const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Categories
router.route('/categories')
  .get(getCategories)
  .post(protect, authorize('admin', 'manager'), createCategory);

router.route('/categories/:id')
  .put(protect, authorize('admin', 'manager'), updateCategory)
  .delete(protect, authorize('admin'), deleteCategory);

// Products
router.route('/products')
  .get(protect, getProducts)
  .post(protect, authorize('admin', 'manager'), createProduct);

router.route('/products/:id')
  .get(protect, getProductById)
  .put(protect, authorize('admin', 'manager'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

router.post('/products/:id/adjust', protect, authorize('admin', 'manager'), adjustStock);

module.exports = router;
