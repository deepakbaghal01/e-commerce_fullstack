const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { getRazorpayClient, getRazorpayCredentials } = require('../services/razorpay');

const requiredAddressFields = ['name', 'phone', 'address', 'city', 'state', 'pinCode'];

const checkoutError = (status, message) => Object.assign(new Error(message), { status });

const restoreReservedStock = async (reservations) => {
  for (const { productId, quantity } of reservations) {
    try {
      await Product.updateOne({ _id: productId }, { $inc: { stock: quantity } });
    } catch (error) {
      console.error(`Could not restore stock for product ${productId}:`, error.message);
    }
  }
  reservations.length = 0;
};

const createOrderFromCheckout = async ({
  userId,
  products,
  shippingAddress,
  paymentMethod,
  checkoutSessionId
}) => {
  const reservations = [];
  try {
    if (!Array.isArray(products) || products.length === 0) {
      throw checkoutError(400, 'Your cart is empty.');
    }

    if (
      !shippingAddress ||
      requiredAddressFields.some((field) => !String(shippingAddress[field] || '').trim())
    ) {
      throw checkoutError(400, 'Complete all shipping information before placing your order.');
    }

    if (!['COD', 'Razorpay'].includes(paymentMethod)) {
      throw checkoutError(400, 'Select Cash on Delivery or pay securely with Razorpay.');
    }

    if (paymentMethod === 'Razorpay') {
      if (typeof checkoutSessionId !== 'string' || !/^[\w-]{16,100}$/.test(checkoutSessionId)) {
        throw checkoutError(400, 'Your checkout session is invalid. Refresh checkout and try again.');
      }

      const existingOrder = await Order.findOne({ user: userId, checkoutSessionId });
      if (existingOrder) {
        if (existingOrder.paymentStatus === 'paid' || existingOrder.paymentStatus === 'Completed') {
          throw checkoutError(409, 'This checkout has already been paid.');
        }
        return existingOrder;
      }
    }

    const requestedQuantities = new Map();
    for (const item of products) {
      if (!mongoose.isValidObjectId(item?.product)) {
        throw checkoutError(400, 'A product in your cart is no longer valid. Remove it and add it again.');
      }

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw checkoutError(400, 'Cart quantities must be whole numbers greater than zero.');
      }
      const productId = String(item.product);
      requestedQuantities.set(productId, (requestedQuantities.get(productId) || 0) + quantity);
    }

    let totalAmountInPaise = 0;
    const orderProducts = [];
    const productsById = new Map();
    for (const productId of requestedQuantities.keys()) {
      const product = await Product.findById(productId);
      if (!product) {
        throw checkoutError(404, 'A product in your cart is no longer available. Remove it and try again.');
      }
      productsById.set(productId, product);
    }

    for (const [productId, quantity] of requestedQuantities) {
      const product = productsById.get(productId);
      if (product.stock < quantity) {
        throw checkoutError(400, `Insufficient stock for ${product.name}`);
      }

      const priceInPaise = Math.round(Number(product.price) * 100);
      if (!Number.isSafeInteger(priceInPaise) || priceInPaise < 0) {
        throw checkoutError(400, `The price for ${product.name} is invalid.`);
      }

      orderProducts.push({
        product: product._id,
        name: product.name,
        quantity,
        price: product.price,
        image: product.image
      });

      totalAmountInPaise += priceInPaise * quantity;
      if (!Number.isSafeInteger(totalAmountInPaise)) {
        throw checkoutError(400, 'The order total is too large.');
      }
    }

    if (paymentMethod === 'Razorpay' && totalAmountInPaise < 100) {
      throw checkoutError(400, 'Razorpay payments must total at least ₹1.00.');
    }

    for (const [productId, quantity] of requestedQuantities) {
      const reservedProduct = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!reservedProduct) {
        await restoreReservedStock(reservations);
        throw checkoutError(400, `Insufficient stock for ${productsById.get(productId).name}.`);
      }
      reservations.push({ productId, quantity });
    }

    const order = await Order.create({
      user: userId,
      products: orderProducts,
      shippingAddress: Object.fromEntries(
        requiredAddressFields.map((field) => [field, String(shippingAddress[field]).trim()])
      ),
      totalAmount: totalAmountInPaise / 100,
      paymentMethod,
      paymentStatus: 'Pending',
      ...(checkoutSessionId ? { checkoutSessionId } : {})
    });

    reservations.length = 0;
    return order;
  } catch (error) {
    await restoreReservedStock(reservations);
    if (error.code === 11000 && checkoutSessionId) {
      const existingOrder = await Order.findOne({ user: userId, checkoutSessionId });
      if (existingOrder) return existingOrder;
    }
    throw error;
  }
};

// @desc    Create new Cash on Delivery order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    if (req.body.paymentMethod && req.body.paymentMethod !== 'COD') {
      throw checkoutError(400, 'Choose Razorpay for online payments.');
    }

    const order = await createOrderFromCheckout({
      ...req.body,
      userId: req.user.id,
      paymentMethod: 'COD'
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    console.error('Order creation failed:', error.message);
    const status = error.status || (
      error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500
    );
    res.status(status).json({
      success: false,
      message: error.status ? error.message : status === 400
        ? 'Some order information is invalid. Check your shipping details and cart, then try again.'
        : 'We could not place your order right now. Please try again.'
    });
  }
};

// @desc    Create or resume a Razorpay payment order
// @route   POST /api/orders/razorpay/order
// @access  Private
exports.createRazorpayOrder = async (req, res) => {
  let order;
  let lockAt;
  try {
    const { keyId } = getRazorpayCredentials();
    const razorpay = getRazorpayClient();
    order = await createOrderFromCheckout({
      ...req.body,
      userId: req.user.id,
      paymentMethod: 'Razorpay'
    });

    if (order.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        order: { _id: order._id, totalAmount: order.totalAmount },
        razorpayOrder: { id: order.razorpayOrderId, amount: Math.round(order.totalAmount * 100), currency: 'INR' },
        keyId
      });
    }

    lockAt = new Date();
    const lockExpiredBefore = new Date(Date.now() - 30000);
    const lockedOrder = await Order.findOneAndUpdate({
      _id: order._id,
      user: req.user.id,
      paymentStatus: { $nin: ['paid', 'Completed'] },
      $or: [
        { razorpayOrderCreateLock: null },
        { razorpayOrderCreateLock: { $lt: lockExpiredBefore } }
      ]
    }, {
      $set: { razorpayOrderCreateLock: lockAt }
    }, { new: true });

    if (!lockedOrder) {
      const latestOrder = await Order.findOne({ _id: order._id, user: req.user.id });
      if (latestOrder?.razorpayOrderId) {
        return res.status(200).json({
          success: true,
          order: { _id: latestOrder._id, totalAmount: latestOrder.totalAmount },
          razorpayOrder: {
            id: latestOrder.razorpayOrderId,
            amount: Math.round(latestOrder.totalAmount * 100),
            currency: 'INR'
          },
          keyId
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Payment setup is already in progress. Please retry in a moment.'
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt: String(order._id),
      notes: { orderId: String(order._id), userId: String(req.user.id) }
    });

    const savedOrder = await Order.findOneAndUpdate({
      _id: order._id,
      user: req.user.id,
      razorpayOrderCreateLock: lockAt
    }, {
      $set: { razorpayOrderId: razorpayOrder.id, paymentStatus: 'Pending' },
      $unset: { razorpayOrderCreateLock: 1 }
    }, { new: true });

    if (!savedOrder) {
      throw new Error('Could not save Razorpay order details.');
    }

    res.status(201).json({
      success: true,
      order: { _id: savedOrder._id, totalAmount: savedOrder.totalAmount },
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      },
      keyId
    });
  } catch (error) {
    if (order && lockAt) {
      try {
        await Order.updateOne(
          { _id: order._id, razorpayOrderCreateLock: lockAt },
          { $unset: { razorpayOrderCreateLock: 1 } }
        );
      } catch (lockError) {
        console.error('Could not release Razorpay order creation lock:', lockError.message);
      }
    }
    console.error('Razorpay order creation failed:', error.message);
    const status = error.status || (
      error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 502
    );
    res.status(status).json({
      success: false,
      message: error.status ? error.message : status === 400
        ? 'Some order information is invalid. Check your shipping details and cart, then try again.'
        : 'We could not initialize payment. Your order is saved; please retry.'
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.orderStatus = orderStatus || order.orderStatus;

    // If order is cancelled, restore stock
    if (orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
