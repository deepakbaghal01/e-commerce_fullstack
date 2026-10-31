const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { getRazorpayClient, getRazorpayCredentials } = require('../services/razorpay');

const isValidSignature = (expected, received) => {
  if (typeof received !== 'string' || !/^[a-f0-9]{64}$/i.test(received)) return false;
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(received, 'hex');
  return expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

const getPaymentMethod = (method) => {
  const paymentMethods = {
    upi: 'UPI',
    card: 'Card',
    netbanking: 'Netbanking',
    wallet: 'Wallet',
    paylater: 'PayLater',
    emi: 'EMI'
  };
  return paymentMethods[String(method || '').toLowerCase()] || 'Razorpay';
};

const isPaid = (order) => order.paymentStatus === 'paid' || order.paymentStatus === 'Completed';

const markPaymentCaptured = async (order, payment) => {
  if (
    !order ||
    payment.status !== 'captured' ||
    payment.order_id !== order.razorpayOrderId ||
    payment.currency !== 'INR' ||
    Number(payment.amount) !== Math.round(order.totalAmount * 100)
  ) {
    return { error: 'Payment details do not match this order.' };
  }

  if (isPaid(order)) {
    return order.razorpayPaymentId === payment.id
      ? { order, alreadyProcessed: true }
      : { error: 'A different payment has already completed this order.' };
  }

  const updatedOrder = await Order.findOneAndUpdate({
    _id: order._id,
    razorpayOrderId: payment.order_id,
    paymentStatus: { $nin: ['paid', 'Completed'] }
  }, {
    $set: {
      paymentStatus: 'paid',
      paymentMethod: getPaymentMethod(payment.method),
      transactionId: payment.id,
      razorpayPaymentId: payment.id,
      orderStatus: 'Processing'
    }
  }, { new: true });

  if (updatedOrder) return { order: updatedOrder };

  const latestOrder = await Order.findById(order._id);
  if (latestOrder && isPaid(latestOrder) && latestOrder.razorpayPaymentId === payment.id) {
    return { order: latestOrder, alreadyProcessed: true };
  }
  return { error: 'This order has already been paid with another payment.' };
};

// @route   POST /api/orders/razorpay/verify
// @access  Private
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    } = req.body;

    if (
      !mongoose.isValidObjectId(orderId) ||
      typeof razorpayOrderId !== 'string' ||
      typeof razorpayPaymentId !== 'string' ||
      typeof razorpaySignature !== 'string'
    ) {
      return res.status(400).json({ success: false, message: 'Payment verification details are invalid.' });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'Payment does not belong to this order.' });
    }

    const { keySecret } = getRazorpayCredentials();
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    if (!isValidSignature(expectedSignature, razorpaySignature)) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }

    const payment = await getRazorpayClient().payments.fetch(razorpayPaymentId);
    if (
      payment.status !== 'captured' ||
      payment.order_id !== razorpayOrderId ||
      Number(payment.amount) !== Math.round(order.totalAmount * 100) ||
      payment.currency !== 'INR'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay has not confirmed the full payment for this order yet.'
      });
    }

    const result = await markPaymentCaptured(order, payment);
    if (result.error) {
      return res.status(409).json({ success: false, message: result.error });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      order: result.order
    });
  } catch (error) {
    console.error('Razorpay verification failed:', error.message);
    res.status(502).json({
      success: false,
      message: 'Payment confirmation is not available yet. Check My Orders before retrying.'
    });
  }
};

// @route   POST /api/orders/razorpay/failure
// @access  Private
exports.markRazorpayFailure = async (req, res) => {
  try {
    const { orderId, razorpayOrderId } = req.body;
    if (!mongoose.isValidObjectId(orderId) || typeof razorpayOrderId !== 'string') {
      return res.status(400).json({ success: false, message: 'Payment details are invalid.' });
    }

    const order = await Order.findOneAndUpdate({
      _id: orderId,
      user: req.user.id,
      razorpayOrderId,
      paymentStatus: { $nin: ['paid', 'Completed'] }
    }, {
      $set: { paymentStatus: 'Failed' }
    }, { new: true });

    if (!order) {
      const existingOrder = await Order.findOne({ _id: orderId, user: req.user.id });
      if (!existingOrder) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }
      if (isPaid(existingOrder)) {
        return res.status(409).json({ success: false, message: 'This order has already been paid.' });
      }
      return res.status(400).json({ success: false, message: 'Payment does not belong to this order.' });
    }

    res.status(200).json({ success: true, paymentStatus: order.paymentStatus });
  } catch (error) {
    console.error('Could not update payment failure status:', error.message);
    res.status(500).json({ success: false, message: 'Could not update payment status.' });
  }
};

// @route   POST /api/payments/razorpay/webhook
// @access  Razorpay webhook signature
exports.razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(503).json({ success: false, message: 'Razorpay webhook is not configured.' });
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ success: false, message: 'Webhook payload is invalid.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');
    if (!isValidSignature(expectedSignature, req.headers['x-razorpay-signature'])) {
      return res.status(400).json({ success: false, message: 'Webhook signature verification failed.' });
    }

    const event = JSON.parse(req.body.toString('utf8'));
    const payment = event.payload?.payment?.entity;
    if (!payment?.order_id || !payment?.id) {
      return res.status(200).json({ success: true, message: 'Event ignored.' });
    }

    const order = await Order.findOne({ razorpayOrderId: payment.order_id });
    if (!order) {
      return res.status(200).json({ success: true, message: 'Order not found; event ignored.' });
    }

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const result = await markPaymentCaptured(order, payment);
      if (result.error) {
        console.error(`Razorpay webhook payment mismatch for order ${order._id}.`);
        return res.status(400).json({ success: false, message: result.error });
      }
    } else if (event.event === 'payment.failed' && !isPaid(order)) {
      await Order.updateOne(
        { _id: order._id, paymentStatus: { $nin: ['paid', 'Completed'] } },
        { $set: { paymentStatus: 'Failed' } }
      );
    }

    res.status(200).json({ success: true, message: 'Webhook processed.' });
  } catch (error) {
    console.error('Razorpay webhook processing failed:', error.message);
    res.status(500).json({ success: false, message: 'Webhook processing failed.' });
  }
};
