const mongoose = require('mongoose');

const RegistrationChallengeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  phoneCodeHash: {
    type: String,
    required: true
  },
  codeExpiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  resends: {
    type: Number,
    default: 0
  },
  nextResendAt: {
    type: Date,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('RegistrationChallenge', RegistrationChallengeSchema);
