const crypto = require('crypto');
const User = require('../models/User');
const RegistrationChallenge = require('../models/RegistrationChallenge');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  generateChallengeToken,
  generateCode,
  hashValue,
  isOtpVerificationEnabled,
  isValidEmail,
  normalizePhone,
  safeEqual
} = require('../utils/verification');
const {
  deliverVerificationCode,
  getMissingDeliverySettings,
  isDevelopmentConsoleMode
} = require('../utils/verificationDelivery');

const CODE_TTL_MS = 10 * 60 * 1000;
const CHALLENGE_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_RESENDS = 5;
const MAX_ATTEMPTS = 5;

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: '30d'
});

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  isPhoneVerified: user.isPhoneVerified,
  isVerified: user.isVerified,
  verificationStatus: user.verificationStatus,
  verificationNotes: user.verificationNotes,
  businessName: user.businessName,
  businessAddress: user.businessAddress,
  businessPhone: user.businessPhone,
  gstNumber: user.gstNumber
});

const maskPhone = (phone) => `${phone.slice(0, 3)}${'*'.repeat(Math.max(0, phone.length - 5))}${phone.slice(-2)}`;

const validateRegistration = (body, isSeller) => {
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const phone = normalizePhone(body.phone || (isSeller ? body.businessPhone : ''));

  if (name.length < 2 || name.length > 50) {
    return { error: 'Name must be between 2 and 50 characters.' };
  }
  if (!isValidEmail(email) || email.length > 254) {
    return { error: 'Enter a valid email address.' };
  }
  if (password.length < 8 || password.length > 128) {
    return { error: 'Password must be between 8 and 128 characters.' };
  }
  if (!phone) {
    return { error: 'Enter a valid phone number, including country code if outside India.' };
  }

  const details = { name, email, password, phone };
  if (!isSeller) return { details };

  const businessName = String(body.businessName || '').trim();
  const businessAddress = String(body.businessAddress || '').trim();
  const gstNumber = String(body.gstNumber || '').trim().toUpperCase();

  if (businessName.length < 2 || businessName.length > 100) {
    return { error: 'Business name must be between 2 and 100 characters.' };
  }
  if (businessAddress.length < 10 || businessAddress.length > 300) {
    return { error: 'Business address must be between 10 and 300 characters.' };
  }
  if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstNumber)) {
    return { error: 'Enter a valid 15-character GSTIN, or leave the field blank.' };
  }

  return {
    details: {
      ...details,
      businessName,
      businessAddress,
      businessPhone: phone,
      gstNumber
    }
  };
};

const checkVerificationConfiguration = (res) => {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET === 'your_jwt_secret_key_here'
  ) {
    res.status(503).json({
      success: false,
      message: 'Set a random JWT_SECRET with at least 32 characters in server/.env before enabling authentication.'
    });
    return false;
  }

  if (!isOtpVerificationEnabled()) return true;

  let secret;
  try {
    secret = hashValue('configuration-check', 'ready');
  } catch (error) {
    res.status(503).json({
      success: false,
      message: error.message
    });
    return false;
  }

  const missingSettings = getMissingDeliverySettings();
  if (missingSettings.length > 0) {
    res.status(503).json({
      success: false,
      message: `Configure email and SMS delivery in server/.env before registration. Missing: ${missingSettings.join(', ')}.`
    });
    return false;
  }
  if (isDevelopmentConsoleMode()) {
    console.info('Verification is using development console delivery. The code is printed in this server terminal.');
  }
  return Boolean(secret);
};

const deliverCode = async (user, phoneCode) => {
  const delivery = await deliverVerificationCode({
    phone: user.phone,
    phoneCode
  });

  if (delivery.errors.length > 0) {
    console.error('Verification code delivery failed:', delivery.errors.map((error) => error.message));
  }

  return {
    phone: delivery.phone
  };
};

const sendRegistrationError = (error, res, fallbackMessage) => {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists. Please log in or use a different email.'
    });
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.status(500).json({
    success: false,
    message: fallbackMessage
  });
};

const createChallenge = async (user) => {
  const challengeToken = generateChallengeToken();
  const phoneCode = generateCode();
  const now = Date.now();

  const challenge = await RegistrationChallenge.findOneAndUpdate(
    { user: user._id },
    {
      $set: {
        tokenHash: hashValue('challenge-token', challengeToken),
        phoneCodeHash: hashValue('phone-code', phoneCode),
        codeExpiresAt: new Date(now + CODE_TTL_MS),
        attempts: 0,
        resends: 0,
        nextResendAt: new Date(now + RESEND_COOLDOWN_MS),
        expiresAt: new Date(now + CHALLENGE_TTL_MS)
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return { challenge, challengeToken, phoneCode };
};

const startRegistration = async (req, res, isSeller) => {
  const validation = validateRegistration(req.body, isSeller);
  if (validation.error) {
    return res.status(400).json({ success: false, message: validation.error });
  }
  if (!checkVerificationConfiguration(res)) return undefined;

  const existingUser = await User.findOne({ email: validation.details.email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists. Please log in or use a different email.'
    });
  }

  const hashedPassword = await bcrypt.hash(validation.details.password, 12);
  const user = await User.create({
    ...validation.details,
    password: hashedPassword,
    role: isSeller ? 'seller' : 'buyer',
    isPhoneVerified: false,
    ...(isSeller ? {
      isVerified: false,
      verificationStatus: 'pending'
    } : {})
  });

  if (!isOtpVerificationEnabled()) {
    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token: generateToken(user._id),
      user: publicUser(user)
    });
  }

  const { challengeToken, phoneCode } = await createChallenge(user);
  const delivery = await deliverCode(user, phoneCode);

  return res.status(202).json({
    success: true,
    message: 'Enter the verification code sent to your phone.',
    challengeToken,
    maskedPhone: maskPhone(user.phone),
    deliveryMode: isDevelopmentConsoleMode() ? 'console' : 'provider',
    delivery
  });
};

// @desc    Start a buyer registration and send a phone verification code
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    return await startRegistration(req, res, false);
  } catch (error) {
    console.error('Registration could not be started:', error.message);
    return sendRegistrationError(
      error,
      res,
      'Registration could not be started. Please try again.'
    );
  }
};

// @desc    Start a seller registration and send a phone verification code
// @route   POST /api/auth/register-seller
// @access  Public
exports.registerSeller = async (req, res) => {
  try {
    return await startRegistration(req, res, true);
  } catch (error) {
    console.error('Seller registration could not be started:', error.message);
    return sendRegistrationError(
      error,
      res,
      'Seller registration could not be started. Please try again.'
    );
  }
};

// @desc    Verify registration phone code
// @route   POST /api/auth/verify-registration
// @access  Public
exports.verifyRegistration = async (req, res) => {
  try {
    if (!isOtpVerificationEnabled()) {
      return res.status(403).json({
        success: false,
        message: 'Phone verification is temporarily disabled.'
      });
    }

    const { challengeToken, phoneCode } = req.body;
    if (
      typeof challengeToken !== 'string' ||
      !/^\d{6}$/.test(String(phoneCode || ''))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter the six-digit code sent to your phone.'
      });
    }

    const tokenHash = hashValue('challenge-token', challengeToken);
    const now = new Date();
    const challenge = await RegistrationChallenge.findOneAndUpdate(
      {
        tokenHash,
        attempts: { $lt: MAX_ATTEMPTS },
        expiresAt: { $gt: now },
        codeExpiresAt: { $gt: now }
      },
      { $inc: { attempts: 1 } },
      { new: true }
    );

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: 'The verification session or code has expired. Request a new code to continue.'
      });
    }

    const validPhoneCode = safeEqual(
      hashValue('phone-code', String(phoneCode)),
      challenge.phoneCodeHash
    );

    if (!validPhoneCode) {
      return res.status(400).json({
        success: false,
        message: challenge.attempts >= MAX_ATTEMPTS
          ? 'Too many incorrect attempts. Request a new verification code.'
          : 'The verification code is incorrect.'
      });
    }

    const user = await User.findById(challenge.user);
    if (!user) {
      await RegistrationChallenge.deleteOne({ _id: challenge._id });
      return res.status(404).json({ success: false, message: 'Registration account not found.' });
    }

    user.isPhoneVerified = true;
    await user.save();
    await RegistrationChallenge.deleteOne({ _id: challenge._id });

    return res.status(200).json({
      success: true,
      message: 'Phone number verified successfully.',
      token: generateToken(user._id),
      user: publicUser(user)
    });
  } catch (error) {
    console.error('Registration verification failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not verify your registration. Please try again.'
    });
  }
};

// @desc    Resend phone verification code
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    if (!isOtpVerificationEnabled()) {
      return res.status(403).json({
        success: false,
        message: 'Phone verification is temporarily disabled.'
      });
    }
    if (!checkVerificationConfiguration(res)) return undefined;
    let challengeToken = typeof req.body.challengeToken === 'string'
      ? req.body.challengeToken
      : null;
    let rotateChallengeToken = false;
    let challenge = challengeToken
      ? await RegistrationChallenge.findOne({
        tokenHash: hashValue('challenge-token', challengeToken)
      })
      : null;

    if (!challenge && !challengeToken) {
      const email = String(req.body.email || '').trim().toLowerCase();
      const user = isValidEmail(email)
        ? await User.findOne({ email, isPhoneVerified: false })
        : null;
      if (!user) {
        return res.status(202).json({
          success: true,
          message: 'If an unverified account matches that email, a new verification code will be sent.'
        });
      }

      challenge = await RegistrationChallenge.findOne({ user: user._id });
      if (!challenge || challenge.expiresAt <= new Date()) {
        const freshChallenge = await createChallenge(user);
        challenge = freshChallenge.challenge;
        challengeToken = freshChallenge.challengeToken;
        const delivery = await deliverCode(user, freshChallenge.phoneCode);
        return res.status(202).json({
          success: true,
          message: 'A new verification code has been requested.',
          challengeToken,
          maskedPhone: maskPhone(user.phone),
          deliveryMode: isDevelopmentConsoleMode() ? 'console' : 'provider',
          delivery
        });
      }
      rotateChallengeToken = true;
    }

    if (!challenge || challenge.expiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'The verification session has expired. Enter your registration email to request a new code.'
      });
    }
    if (challenge.resends >= MAX_RESENDS) {
      return res.status(429).json({
        success: false,
        message: 'You have reached the resend limit. Please try registration again later.'
      });
    }
    if (challenge.nextResendAt > new Date()) {
      return res.status(429).json({
        success: false,
        message: 'Please wait a minute before requesting a new code.'
      });
    }

    const user = await User.findById(challenge.user);
    if (!user || user.isPhoneVerified === true) {
      return res.status(400).json({ success: false, message: 'This registration no longer needs verification.' });
    }

    if (rotateChallengeToken) {
      challengeToken = generateChallengeToken();
      challenge.tokenHash = hashValue('challenge-token', challengeToken);
    }

    const phoneCode = generateCode();
    const now = Date.now();
    challenge.phoneCodeHash = hashValue('phone-code', phoneCode);
    challenge.codeExpiresAt = new Date(now + CODE_TTL_MS);
    challenge.nextResendAt = new Date(now + RESEND_COOLDOWN_MS);
    challenge.resends += 1;
    challenge.attempts = 0;
    await challenge.save();

    const delivery = await deliverCode(user, phoneCode);
    return res.status(202).json({
      success: true,
      message: 'A new verification code has been requested.',
      challengeToken,
      maskedPhone: maskPhone(user.phone),
      deliveryMode: isDevelopmentConsoleMode() ? 'console' : 'provider',
      delivery
    });
  } catch (error) {
    console.error('Verification codes could not be resent:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not resend the verification code. Please try again.'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }
    if (isOtpVerificationEnabled() && user.isPhoneVerified === false) {
      return res.status(403).json({
        success: false,
        message: 'Verify your phone before logging in.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: generateToken(user._id),
      user: publicUser(user)
    });
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not log in. Please try again.' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error('Could not fetch current user:', error.message);
    return res.status(500).json({ success: false, message: 'Could not fetch account details.' });
  }
};

// @desc    Update seller business details and return them to review
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Only sellers can update business details.' });
    }

    const businessName = String(req.body.businessName || '').trim();
    const businessAddress = String(req.body.businessAddress || '').trim();
    const gstNumber = String(req.body.gstNumber || '').trim().toUpperCase();
    if (businessName.length < 2 || businessName.length > 100) {
      return res.status(400).json({ success: false, message: 'Business name must be between 2 and 100 characters.' });
    }
    if (businessAddress.length < 10 || businessAddress.length > 300) {
      return res.status(400).json({ success: false, message: 'Business address must be between 10 and 300 characters.' });
    }
    if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstNumber)) {
      return res.status(400).json({ success: false, message: 'Enter a valid GSTIN, or leave the field blank.' });
    }

    user.businessName = businessName;
    user.businessAddress = businessAddress;
    user.businessPhone = user.phone;
    user.gstNumber = gstNumber;
    user.isVerified = false;
    user.verificationStatus = 'pending';
    user.verificationNotes = '';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Business details saved and submitted for review.',
      user: publicUser(user)
    });
  } catch (error) {
    console.error('Seller details could not be updated:', error.message);
    return res.status(500).json({ success: false, message: 'Could not update seller details.' });
  }
};
