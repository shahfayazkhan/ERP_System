const { Product, Category, InventoryTransaction, sequelize } = require('../models');
const { Op } = require('sequelize');

// --- CATEGORY CONTROLLERS ---

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  const { name, description } = req.body;
  try {
    if (!name) {
      res.status(400);
      throw new Error('Category name is required');
    }
    const category = await Category.create({ name, description });
    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const category = await Category.findByPk(id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }
    await category.update({ name, description });
    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const category = await Category.findByPk(id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }
    await category.destroy();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- PRODUCT CONTROLLERS ---

const getProducts = async (req, res, next) => {
  const { search, categoryId, lowStock } = req.query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { sku: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (lowStock === 'true') {
    where.stockQuantity = {
      [Op.lte]: sequelize.col('lowStockThreshold')
    };
  }

  try {
    const products = await Product.findAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { 
          model: InventoryTransaction, 
          as: 'inventoryTransactions',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  const { sku, name, description, price, cost, stockQuantity, lowStockThreshold, categoryId } = req.body;
  const t = await sequelize.transaction();

  try {
    if (!name || price === undefined || cost === undefined) {
      res.status(400);
      throw new Error('Name, price, and cost are required');
    }

    let finalSku = sku;
    if (!finalSku) {
      const rand = Math.floor(100000 + Math.random() * 900000);
      finalSku = `PROD-${rand}`;
    }

    const existingProduct = await Product.findOne({ where: { sku: finalSku } });
    if (existingProduct) {
      res.status(400);
      throw new Error('Product with this SKU already exists');
    }

    const product = await Product.create({
      sku: finalSku,
      name,
      description,
      price,
      cost,
      stockQuantity: stockQuantity || 0,
      lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : 10,
      categoryId
    }, { transaction: t });

    // If initial stock is greater than 0, create an inventory transaction log
    if (stockQuantity > 0) {
      await InventoryTransaction.create({
        productId: product.id,
        type: 'IN',
        quantity: stockQuantity,
        notes: 'Initial Stock setup'
      }, { transaction: t });
    }

    await t.commit();

    // Fetch product with associated category to return
    const createdProduct = await Product.findByPk(product.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
    });

    res.status(201).json({ success: true, product: createdProduct });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const { sku, name, description, price, cost, lowStockThreshold, categoryId } = req.body;
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({ where: { sku } });
      if (existingProduct) {
        res.status(400);
        throw new Error('Product with this SKU already exists');
      }
    }

    await product.update({
      sku,
      name,
      description,
      price,
      cost,
      lowStockThreshold,
      categoryId
    });

    const updatedProduct = await Product.findByPk(product.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
    });

    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    await product.destroy();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  const { id } = req.params;
  const { adjustmentQuantity, type, notes } = req.body; // adjustmentQuantity can be positive or negative. type: IN, OUT, ADJUSTMENT
  const t = await sequelize.transaction();

  try {
    if (adjustmentQuantity === undefined || !type) {
      res.status(400);
      throw new Error('Adjustment quantity and type are required');
    }

    const product = await Product.findByPk(id, { transaction: t });
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const newQuantity = product.stockQuantity + Number(adjustmentQuantity);
    if (newQuantity < 0) {
      res.status(400);
      throw new Error(`Insufficient stock. Current quantity is ${product.stockQuantity}, cannot deduct ${Math.abs(adjustmentQuantity)}.`);
    }

    await product.update({ stockQuantity: newQuantity }, { transaction: t });

    await InventoryTransaction.create({
      productId: product.id,
      type,
      quantity: adjustmentQuantity,
      notes: notes || 'Manual stock adjustment'
    }, { transaction: t });

    await t.commit();

    const updatedProduct = await Product.findByPk(product.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
    });

    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
};
