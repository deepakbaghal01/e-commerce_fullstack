const User = require('../models/User');
const { isOtpVerificationEnabled } = require('../utils/verification');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Approve or reject seller business details
// @route   PATCH /api/users/:id/verification
// @access  Private/Admin
exports.reviewSeller = async (req, res) => {
  try {
    const { status } = req.body;
    const notes = String(req.body.notes || '').trim();
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be verified or rejected.'
      });
    }
    if (notes.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Review notes cannot exceed 500 characters.'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.role !== 'seller') {
      return res.status(400).json({ success: false, message: 'Only seller accounts can be reviewed.' });
    }
    if (status === 'verified' && (
      (isOtpVerificationEnabled() && user.isPhoneVerified !== true) ||
      !user.businessName ||
      !user.businessAddress
    )) {
      return res.status(400).json({
        success: false,
        message: isOtpVerificationEnabled()
          ? 'The seller must verify their phone and provide business details before approval.'
          : 'The seller must provide business details before approval.'
      });
    }

    user.verificationStatus = status;
    user.isVerified = status === 'verified';
    user.verificationNotes = notes;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Seller ${status === 'verified' ? 'approved' : 'rejected'} successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        verificationNotes: user.verificationNotes
      }
    });
  } catch (error) {
    console.error('Seller review failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not update seller verification status.'
    });
  }
};
