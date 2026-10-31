const mongoose = require('mongoose');
const { normalizeProductCategory } = require('../utils/productCategory');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a product price'],
    min: [0, 'Price cannot be negative']
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Please provide a product category'],
    default: 'Other',
    set: normalizeProductCategory,
    enum: ['Electronics', 'Clothing', 'Shoes', 'Accessories', 'Home', 'Other']
  },
  image: {
    type: String,
    required: [true, 'Please provide a product image URL']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);
