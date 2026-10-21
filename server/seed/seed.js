const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Product = require('../models/Product');
const bcrypt = require('bcryptjs');

dotenv.config();

// Sample products data
const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
    price: 79.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    rating: 4.5,
    stock: 50
  },
  {
    name: 'Smart Watch Series 5',
    description: 'Advanced smartwatch with health tracking, GPS, and water resistance. Stay connected and monitor your fitness goals.',
    price: 299.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    rating: 4.8,
    stock: 30
  },
  {
    name: 'Premium Cotton T-Shirt',
    description: 'Comfortable 100% cotton t-shirt available in multiple colors. Perfect for casual wear and everyday use.',
    price: 24.99,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    rating: 4.2,
    stock: 100
  },
  {
    name: 'Classic Denim Jeans',
    description: 'Stylish and durable denim jeans with perfect fit. Made from premium quality fabric for long-lasting comfort.',
    price: 59.99,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
    rating: 4.6,
    stock: 75
  },
  {
    name: 'Running Shoes Pro',
    description: 'Lightweight running shoes with advanced cushioning technology. Designed for comfort and performance during workouts.',
    price: 129.99,
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    rating: 4.7,
    stock: 40
  },
  {
    name: 'Leather Casual Shoes',
    description: 'Elegant leather shoes perfect for both formal and casual occasions. Crafted with attention to detail.',
    price: 89.99,
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=500',
    rating: 4.4,
    stock: 35
  },
  {
    name: 'Designer Sunglasses',
    description: 'Stylish polarized sunglasses with UV protection. Perfect for sunny days and outdoor activities.',
    price: 149.99,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
    rating: 4.3,
    stock: 60
  },
  {
    name: 'Leather Wallet',
    description: 'Premium leather wallet with multiple card slots and coin compartment. Sleek and functional design.',
    price: 49.99,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500',
    rating: 4.5,
    stock: 80
  },
  {
    name: 'Modern Table Lamp',
    description: 'Elegant table lamp with adjustable brightness. Perfect for reading or as a decorative piece in your home.',
    price: 39.99,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500',
    rating: 4.1,
    stock: 45
  },
  {
    name: 'Cozy Throw Blanket',
    description: 'Soft and warm throw blanket made from premium materials. Perfect for cozying up on the couch.',
    price: 34.99,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
    rating: 4.6,
    stock: 55
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    console.log('Cleared existing data');

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@ecommerce.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin user created:', {
      name: adminUser.name,
      email: adminUser.email,
      password: 'admin123'
    });

    // Create sample seller user
    const sellerPassword = await bcrypt.hash('seller123', salt);

    const sellerUser = await User.create({
      name: 'Sample Seller',
      email: 'seller@ecommerce.com',
      password: sellerPassword,
      role: 'seller',
      businessName: 'Sample Electronics Store',
      businessAddress: '123 Business Street, Tech City',
      businessPhone: '+91 9876543210',
      gstNumber: '29ABCDE1234F1Z5',
      isVerified: true,
      verificationStatus: 'verified'
    });

    console.log('Sample seller user created:', {
      name: sellerUser.name,
      email: sellerUser.email,
      password: 'seller123',
      businessName: sellerUser.businessName
    });

    // Add owner field to sample products (assign to seller)
    const productsWithOwner = sampleProducts.map(product => ({
      ...product,
      owner: sellerUser._id
    }));

    // Create sample products
    const products = await Product.insertMany(productsWithOwner);
    console.log(`${products.length} products created`);

    console.log('Database seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
