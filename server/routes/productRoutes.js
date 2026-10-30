const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getProducts)
  .post(protect, authorize('admin', 'seller'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, authorize('admin', 'seller'), updateProduct)
  .delete(protect, authorize('admin', 'seller'), deleteProduct);

module.exports = router;
