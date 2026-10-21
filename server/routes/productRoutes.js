const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize, requireVerifiedSeller } = require('../middleware/auth');

router.route('/')
  .get(getProducts)
  .post(protect, authorize('admin', 'seller'), requireVerifiedSeller, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, authorize('admin', 'seller'), requireVerifiedSeller, updateProduct)
  .delete(protect, authorize('admin', 'seller'), requireVerifiedSeller, deleteProduct);

module.exports = router;
