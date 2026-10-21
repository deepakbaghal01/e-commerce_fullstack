const crypto = require('crypto');

const getVerificationSecret = () => {
  const secret = process.env.OTP_SECRET;
  if (!secret || secret.length < 32 || secret === 'replace_with_a_random_secret_at_least_32_characters') {
    throw new Error('Set a random OTP_SECRET with at least 32 characters in server/.env before enabling registration verification.');
  }
  return secret;
};

const hashValue = (purpose, value) => crypto
  .createHmac('sha256', getVerificationSecret())
  .update(`${purpose}:${value}`)
  .digest('hex');

const generateCode = () => crypto.randomInt(100000, 1000000).toString();
const generateChallengeToken = () => crypto.randomBytes(32).toString('hex');
const isOtpVerificationEnabled = () => process.env.OTP_VERIFICATION_ENABLED !== 'false';

const normalizePhone = (value) => {
  const compact = String(value || '').trim().replace(/[\s()-]/g, '');
  if (/^\d{10}$/.test(compact)) return `+91${compact}`;
  if (/^91\d{10}$/.test(compact)) return `+${compact}`;
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
  return null;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const safeEqual = (first, second) => {
  const firstBuffer = Buffer.from(first || '', 'hex');
  const secondBuffer = Buffer.from(second || '', 'hex');
  return firstBuffer.length === secondBuffer.length &&
    firstBuffer.length > 0 &&
    crypto.timingSafeEqual(firstBuffer, secondBuffer);
};

module.exports = {
  generateChallengeToken,
  generateCode,
  hashValue,
  isOtpVerificationEnabled,
  isValidEmail,
  normalizePhone,
  safeEqual
};
