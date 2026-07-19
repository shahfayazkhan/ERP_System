const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
} = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Suppliers
router.route('/suppliers')
  .get(protect, getSuppliers)
  .post(protect, authorize('admin', 'manager'), createSupplier);

router.route('/suppliers/:id')
  .put(protect, authorize('admin', 'manager'), updateSupplier)
  .delete(protect, authorize('admin'), deleteSupplier);

// Purchase Orders
router.route('/orders')
  .get(protect, getPurchaseOrders)
  .post(protect, authorize('admin', 'manager'), createPurchaseOrder);

router.route('/orders/:id')
  .get(protect, getPurchaseOrderById);

router.put('/orders/:id/status', protect, authorize('admin', 'manager'), updatePurchaseOrderStatus);

module.exports = router;
