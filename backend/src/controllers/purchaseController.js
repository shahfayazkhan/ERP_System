const { PurchaseOrder, PurchaseOrderItem, Supplier, Product, InventoryTransaction, sequelize } = require('../models');

// --- SUPPLIER CONTROLLERS ---

const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, suppliers });
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  const { name, contactName, email, phone, address } = req.body;
  try {
    if (!name) {
      res.status(400);
      throw new Error('Supplier name is required');
    }
    const supplier = await Supplier.create({ name, contactName, email, phone, address });
    res.status(201).json({ success: true, supplier });
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  const { id } = req.params;
  const { name, contactName, email, phone, address } = req.body;
  try {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      res.status(404);
      throw new Error('Supplier not found');
    }
    await supplier.update({ name, contactName, email, phone, address });
    res.json({ success: true, supplier });
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  const { id } = req.params;
  try {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      res.status(404);
      throw new Error('Supplier not found');
    }
    await supplier.destroy();
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- PURCHASE ORDER CONTROLLERS ---

const getPurchaseOrders = async (req, res, next) => {
  try {
    const orders = await PurchaseOrder.findAll({
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] }
      ],
      order: [['orderDate', 'DESC']]
    });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

const getPurchaseOrderById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const order = await PurchaseOrder.findByPk(id, {
      include: [
        { model: Supplier, as: 'supplier' },
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'sku', 'name', 'cost'] }]
        }
      ]
    });

    if (!order) {
      res.status(404);
      throw new Error('Purchase order not found');
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

const createPurchaseOrder = async (req, res, next) => {
  const { supplierId, orderDate, status, notes, items } = req.body; // items = [{ productId, quantity, unitCost }]
  const t = await sequelize.transaction();

  try {
    if (!supplierId || !items || !items.length) {
      res.status(400);
      throw new Error('Supplier and at least one item are required');
    }

    // Verify Supplier
    const supplier = await Supplier.findByPk(supplierId, { transaction: t });
    if (!supplier) {
      res.status(400);
      throw new Error('Invalid supplier ID');
    }

    let calculatedTotal = 0;
    const orderItemsToCreate = [];

    // Verify products and calculate costs
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

      const unitCost = Number(item.unitCost) !== undefined ? Number(item.unitCost) : product.cost;
      const itemTotalCost = quantity * unitCost;
      calculatedTotal += itemTotalCost;

      orderItemsToCreate.push({
        productId: product.id,
        quantity,
        unitCost,
        totalCost: itemTotalCost
      });
    }

    // Create Purchase Order
    const purchaseOrder = await PurchaseOrder.create({
      supplierId,
      orderDate: orderDate || new Date(),
      status: status || 'Pending',
      totalAmount: calculatedTotal,
      notes
    }, { transaction: t });

    // Create Items and update stock / create transaction logs if status is Received
    for (const itemData of orderItemsToCreate) {
      await PurchaseOrderItem.create({
        purchaseOrderId: purchaseOrder.id,
        ...itemData
      }, { transaction: t });

      if (status === 'Received') {
        const product = await Product.findByPk(itemData.productId, { transaction: t });
        // Increment stock
        await product.update({ stockQuantity: product.stockQuantity + itemData.quantity }, { transaction: t });

        // Log transaction
        await InventoryTransaction.create({
          productId: itemData.productId,
          type: 'IN',
          quantity: itemData.quantity,
          referenceId: purchaseOrder.orderNumber,
          notes: `Purchase Order Restocked`
        }, { transaction: t });
      }
    }

    await t.commit();

    const createdOrder = await PurchaseOrder.findByPk(purchaseOrder.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderItem, as: 'items', include: ['product'] }
      ]
    });

    res.status(201).json({ success: true, order: createdOrder });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const updatePurchaseOrderStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const t = await sequelize.transaction();

  try {
    if (!status) {
      res.status(400);
      throw new Error('Status is required');
    }

    const order = await PurchaseOrder.findByPk(id, {
      include: [{ model: PurchaseOrderItem, as: 'items' }],
      transaction: t
    });

    if (!order) {
      res.status(404);
      throw new Error('Purchase order not found');
    }

    const oldStatus = order.status;
    const newStatus = status;

    if (oldStatus === newStatus) {
      await t.commit();
      return res.json({ success: true, order });
    }

    const isOldReceived = oldStatus === 'Received';
    const isNewReceived = newStatus === 'Received';

    // 1. Transition: Pending/Draft/Cancelled -> Received (Increment Stock)
    if (!isOldReceived && isNewReceived) {
      for (const item of order.items) {
        const product = await Product.findByPk(item.productId, { transaction: t });
        // Increment
        await product.update({ stockQuantity: product.stockQuantity + item.quantity }, { transaction: t });
        // Log transaction
        await InventoryTransaction.create({
          productId: product.id,
          type: 'IN',
          quantity: item.quantity,
          referenceId: order.orderNumber,
          notes: `Purchase Order status changed: ${oldStatus} -> Received (Stock Added)`
        }, { transaction: t });
      }
    }

    // 2. Transition: Received -> Cancelled/Draft/Pending (Deduct Stock - checking if stock becomes negative)
    if (isOldReceived && !isNewReceived) {
      for (const item of order.items) {
        const product = await Product.findByPk(item.productId, { transaction: t });
        if (product.stockQuantity < item.quantity) {
          res.status(400);
          throw new Error(`Cannot cancel or revert this order. Cancelling would deduct ${item.quantity} units from ${product.name}, but current stock is only ${product.stockQuantity}.`);
        }
        // Deduct
        await product.update({ stockQuantity: product.stockQuantity - item.quantity }, { transaction: t });
        // Log transaction
        await InventoryTransaction.create({
          productId: product.id,
          type: 'OUT',
          quantity: -item.quantity,
          referenceId: order.orderNumber,
          notes: `Purchase Order reverted from Received. Status: ${newStatus} (Stock Deducted)`
        }, { transaction: t });
      }
    }

    await order.update({ status: newStatus }, { transaction: t });
    await t.commit();

    const updatedOrder = await PurchaseOrder.findByPk(order.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderItem, as: 'items', include: ['product'] }
      ]
    });

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
};
