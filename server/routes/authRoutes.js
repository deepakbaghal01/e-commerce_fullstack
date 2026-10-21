const express = require('express');
const router = express.Router();
const {
  register,
  registerSeller,
  verifyRegistration,
  resendVerification,
  login,
  getMe,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  registrationLimiter,
  verificationLimiter,
  resendLimiter
} = require('../middleware/verificationRateLimit');

router.post('/register', registrationLimiter, register);
router.post('/register-seller', registrationLimiter, registerSeller);
router.post('/verify-registration', verificationLimiter, verifyRegistration);
router.post('/resend-verification', resendLimiter, resendVerification);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

module.exports = router;
