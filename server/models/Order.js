const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
      },
      price: {
        type: Number,
        required: true
      },
      image: {
        type: String,
        required: true
      }
    }
  ],
  shippingAddress: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pinCode: {
      type: String,
      required: true
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    default: 'COD',
    enum: ['COD', 'Card', 'UPI', 'Netbanking', 'Wallet', 'PayLater', 'EMI', 'Razorpay']
  },
  paymentStatus: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Completed', 'Failed', 'paid']
  },
  transactionId: {
    type: String,
    trim: true
  },
  razorpayOrderId: {
    type: String,
    trim: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true
  },
  checkoutSessionId: {
    type: String,
    trim: true
  },
  razorpayOrderCreateLock: {
    type: Date
  },
  orderStatus: {
    type: String,
    default: 'Processing',
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

OrderSchema.index(
  { user: 1, checkoutSessionId: 1 },
  { unique: true, partialFilterExpression: { checkoutSessionId: { $type: 'string' } } }
);
OrderSchema.index({ razorpayOrderId: 1 }, { sparse: true });
OrderSchema.index({ razorpayPaymentId: 1 }, { sparse: true });

module.exports = mongoose.model('Order', OrderSchema);
