const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, reviewSeller } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize('admin'), getAllUsers);

router.route('/:id')
  .get(protect, authorize('admin'), getUserById);

router.route('/:id/verification')
  .patch(protect, authorize('admin'), reviewSeller);

module.exports = router;
