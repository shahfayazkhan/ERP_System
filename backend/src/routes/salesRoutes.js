const express = require('express');
const router = express.Router();
const {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrderStatus,
} = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Customers
router.route('/customers')
  .get(protect, getCustomers)
  .post(protect, createCustomer);

router.route('/customers/:id')
  .put(protect, updateCustomer)
  .delete(protect, authorize('admin'), deleteCustomer);

// Sales Orders
router.route('/orders')
  .get(protect, getSalesOrders)
  .post(protect, createSalesOrder);

router.route('/orders/:id')
  .get(protect, getSalesOrderById);

router.put('/orders/:id/status', protect, updateSalesOrderStatus);

module.exports = router;
