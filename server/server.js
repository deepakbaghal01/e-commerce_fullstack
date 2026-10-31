const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');

const app = express();
const clientOrigins = (process.env.CLIENT_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV !== 'production') {
  clientOrigins.push('http://localhost:3000');
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || clientOrigins.includes(origin));
  }
}));
app.post(
  '/api/payments/razorpay/webhook',
  express.raw({ type: 'application/json' }),
  require('./controllers/paymentController').razorpayWebhook
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'E-commerce API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
