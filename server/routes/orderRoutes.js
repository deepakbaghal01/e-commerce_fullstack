const express = require('express');
const router = express.Router();
const {
  createOrder,
  createRazorpayOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/orderController');
const {
  verifyRazorpayPayment,
  markRazorpayFailure
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, createOrder)
  .get(protect, authorize('admin'), getAllOrders);

router.post('/razorpay/order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);
router.post('/razorpay/failure', protect, markRazorpayFailure);

router.get('/my-orders', protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;
