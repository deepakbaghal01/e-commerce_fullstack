const { rateLimit } = require('express-rate-limit');

const createVerificationLimiter = (max, message) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: max,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message
  }
});

exports.registrationLimiter = createVerificationLimiter(
  5,
  'Too many registration attempts. Please wait 15 minutes and try again.'
);
exports.verificationLimiter = createVerificationLimiter(
  20,
  'Too many verification attempts. Please wait 15 minutes and try again.'
);
exports.resendLimiter = createVerificationLimiter(
  10,
  'Too many code requests. Please wait 15 minutes and try again.'
);
