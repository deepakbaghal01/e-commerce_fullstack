const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

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

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  const reservations = [];
  try {
    const { products, shippingAddress, paymentMethod } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty.'
      });
    }

    const requiredAddressFields = ['name', 'phone', 'address', 'city', 'state', 'pinCode'];
    if (
      !shippingAddress ||
      requiredAddressFields.some((field) => !String(shippingAddress[field] || '').trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Complete all shipping information before placing your order.'
      });
    }

    if (paymentMethod && !['COD', 'Card', 'UPI'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Select a valid payment method.'
      });
    }

    const requestedQuantities = new Map();
    for (const item of products) {
      if (!mongoose.isValidObjectId(item?.product)) {
        return res.status(400).json({
          success: false,
          message: 'A product in your cart is no longer valid. Remove it and add it again.'
        });
      }

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Cart quantities must be whole numbers greater than zero.'
        });
      }
      const productId = String(item.product);
      requestedQuantities.set(productId, (requestedQuantities.get(productId) || 0) + quantity);
    }

    let totalAmount = 0;
    const orderProducts = [];
    const productsById = new Map();
    for (const productId of requestedQuantities.keys()) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'A product in your cart is no longer available. Remove it and try again.'
        });
      }
      productsById.set(productId, product);
    }

    for (const [productId, quantity] of requestedQuantities) {
      const product = productsById.get(productId);
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      orderProducts.push({
        product: product._id,
        name: product.name,
        quantity,
        price: product.price,
        image: product.image
      });

      totalAmount += product.price * quantity;
    }

    for (const [productId, quantity] of requestedQuantities) {
      const reservedProduct = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!reservedProduct) {
        await restoreReservedStock(reservations);
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${productsById.get(productId).name}.`
        });
      }
      reservations.push({ productId, quantity });
    }

    const order = await Order.create({
      user: req.user.id,
      products: orderProducts,
      shippingAddress: Object.fromEntries(
        requiredAddressFields.map((field) => [field, String(shippingAddress[field]).trim()])
      ),
      totalAmount,
      paymentMethod: paymentMethod || 'COD'
    });

    reservations.length = 0;
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    await restoreReservedStock(reservations);
    console.error('Order creation failed:', error.message);
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Some order information is invalid. Check your shipping details and cart, then try again.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'We could not place your order right now. Please try again.'
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
