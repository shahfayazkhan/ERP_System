const { SalesOrder, SalesOrderItem, Customer, Product, InventoryTransaction, sequelize } = require('../models');

// --- CUSTOMER CONTROLLERS ---

const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, customers });
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  const { name, email, phone, address } = req.body;
  try {
    if (!name) {
      res.status(400);
      throw new Error('Customer name is required');
    }
    const customer = await Customer.create({ name, email, phone, address });
    res.status(201).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }
    await customer.update({ name, email, phone, address });
    res.json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  const { id } = req.params;
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }
    await customer.destroy();
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- SALES ORDER CONTROLLERS ---

const getSalesOrders = async (req, res, next) => {
  try {
    const orders = await SalesOrder.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name'] }
      ],
      order: [['orderDate', 'DESC']]
    });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

const getSalesOrderById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const order = await SalesOrder.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        {
          model: SalesOrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'sku', 'name', 'price'] }]
        }
      ]
    });

    if (!order) {
      res.status(404);
      throw new Error('Sales order not found');
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

const createSalesOrder = async (req, res, next) => {
  const { customerId, orderDate, status, notes, items } = req.body; // items = [{ productId, quantity }]
  const t = await sequelize.transaction();

  try {
    if (!customerId || !items || !items.length) {
      res.status(400);
      throw new Error('Customer and at least one item are required');
    }

    // Verify Customer exists
    const customer = await Customer.findByPk(customerId, { transaction: t });
    if (!customer) {
      res.status(400);
      throw new Error('Invalid customer ID');
    }

    let calculatedTotal = 0;
    const orderItemsToCreate = [];

    // Verify stock availability and collect pricing
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (!product) {
        res.status(400);
        throw new Error(`Product not found for ID: ${item.productId}`);
      }

      const quantity = Number(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        res.status(400);
        throw new Error(`Invalid quantity for product: ${product.name}`);
      }

      // Check stock if order starts out as Paid or Shipped
      const deductsStock = ['Paid', 'Shipped'].includes(status);
      if (deductsStock && product.stockQuantity < quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for product: ${product.name}. Requested: ${quantity}, Available: ${product.stockQuantity}`);
      }

      const itemTotalPrice = quantity * product.price;
      calculatedTotal += itemTotalPrice;

      orderItemsToCreate.push({
        productId: product.id,
        quantity,
        unitPrice: product.price,
        totalPrice: itemTotalPrice
      });
    }

    // Create the Sales Order
    const salesOrder = await SalesOrder.create({
      customerId,
      orderDate: orderDate || new Date(),
      status: status || 'Pending',
      totalAmount: calculatedTotal,
      notes
    }, { transaction: t });

    // Create Sales Order Items and update stock / create inventory transactions if status is Paid or Shipped
    for (const itemData of orderItemsToCreate) {
      await SalesOrderItem.create({
        salesOrderId: salesOrder.id,
        ...itemData
      }, { transaction: t });

      if (['Paid', 'Shipped'].includes(status)) {
        // Deduct product stock
        const product = await Product.findByPk(itemData.productId, { transaction: t });
        await product.update({ stockQuantity: product.stockQuantity - itemData.quantity }, { transaction: t });

        // Log transaction
        await InventoryTransaction.create({
          productId: itemData.productId,
          type: 'OUT',
          quantity: -itemData.quantity,
          referenceId: salesOrder.orderNumber,
          notes: `Sales Order Payment/Fulfillment`
        }, { transaction: t });
      }
    }

    await t.commit();

    const createdOrder = await SalesOrder.findByPk(salesOrder.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: SalesOrderItem, as: 'items', include: ['product'] }
      ]
    });

    res.status(201).json({ success: true, order: createdOrder });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const updateSalesOrderStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const t = await sequelize.transaction();

  try {
    if (!status) {
      res.status(400);
      throw new Error('Status is required');
    }

    const order = await SalesOrder.findByPk(id, {
      include: [{ model: SalesOrderItem, as: 'items' }],
      transaction: t
    });

    if (!order) {
      res.status(404);
      throw new Error('Sales order not found');
    }

    const oldStatus = order.status;
    const newStatus = status;

    if (oldStatus === newStatus) {
      await t.commit();
      return res.json({ success: true, order });
    }

    const isOldDeducted = ['Paid', 'Shipped'].includes(oldStatus);
    const isNewDeducted = ['Paid', 'Shipped'].includes(newStatus);

    // 1. Transition: Pending/Draft/Cancelled -> Paid/Shipped (Deduct Stock)
    if (!isOldDeducted && isNewDeducted) {
      for (const item of order.items) {
        const product = await Product.findByPk(item.productId, { transaction: t });
        if (product.stockQuantity < item.quantity) {
          res.status(400);
          throw new Error(`Insufficient stock for product: ${product.name}. Required: ${item.quantity}, Available: ${product.stockQuantity}`);
        }
        // Deduct
        await product.update({ stockQuantity: product.stockQuantity - item.quantity }, { transaction: t });
        // Log transaction
        await InventoryTransaction.create({
          productId: product.id,
          type: 'OUT',
          quantity: -item.quantity,
          referenceId: order.orderNumber,
          notes: `Sales Order Status Changed: ${oldStatus} -> ${newStatus}`
        }, { transaction: t });
      }
    }

    // 2. Transition: Paid/Shipped -> Cancelled (Restore Stock)
    if (isOldDeducted && newStatus === 'Cancelled') {
      for (const item of order.items) {
        const product = await Product.findByPk(item.productId, { transaction: t });
        // Restore
        await product.update({ stockQuantity: product.stockQuantity + item.quantity }, { transaction: t });
        // Log transaction
        await InventoryTransaction.create({
          productId: product.id,
          type: 'IN',
          quantity: item.quantity,
          referenceId: order.orderNumber,
          notes: `Sales Order Cancelled: Stock Restored`
        }, { transaction: t });
      }
    }

    // 3. Transition: Paid/Shipped -> Draft/Pending (Restore Stock, but typically not standard, we allow it for edits)
    if (isOldDeducted && ['Draft', 'Pending'].includes(newStatus)) {
      for (const item of order.items) {
        const product = await Product.findByPk(item.productId, { transaction: t });
        await product.update({ stockQuantity: product.stockQuantity + item.quantity }, { transaction: t });
        await InventoryTransaction.create({
          productId: product.id,
          type: 'IN',
          quantity: item.quantity,
          referenceId: order.orderNumber,
          notes: `Sales Order Status Reset: Stock Restored`
        }, { transaction: t });
      }
    }

    await order.update({ status: newStatus }, { transaction: t });
    await t.commit();

    const updatedOrder = await SalesOrder.findByPk(order.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: SalesOrderItem, as: 'items', include: ['product'] }
      ]
    });

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrderStatus,
};
