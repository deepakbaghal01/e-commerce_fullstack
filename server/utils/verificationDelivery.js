const https = require('https');

const isDevelopmentConsoleMode = () =>
  process.env.VERIFICATION_DELIVERY_MODE === 'console' &&
  process.env.NODE_ENV !== 'production';

const getMissingDeliverySettings = () => {
  if (process.env.VERIFICATION_DELIVERY_MODE === 'console') {
    return process.env.NODE_ENV === 'production'
      ? ['VERIFICATION_DELIVERY_MODE (console delivery is disabled in production)']
      : [];
  }

  const required = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_FROM_NUMBER'
  ];
  const placeholders = /^(your_|replace_with_|\+10000000000)/i;
  const missing = required.filter((key) => {
    const value = process.env[key];
    return !value || placeholders.test(value);
  });
  if (process.env.TWILIO_ACCOUNT_SID && !/^AC[a-f\d]{32}$/i.test(process.env.TWILIO_ACCOUNT_SID)) {
    missing.push('TWILIO_ACCOUNT_SID (must be a valid Twilio Account SID)');
  }
  if (process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_AUTH_TOKEN.length < 32) {
    missing.push('TWILIO_AUTH_TOKEN (must be a valid Twilio auth token)');
  }
  if (process.env.TWILIO_FROM_NUMBER && !/^\+[1-9]\d{7,14}$/.test(process.env.TWILIO_FROM_NUMBER)) {
    missing.push('TWILIO_FROM_NUMBER (must use E.164 format)');
  }
  return missing;
};

const sendPhoneCode = (phone, code) => new Promise((resolve, reject) => {
  const body = new URLSearchParams({
    To: phone,
    From: process.env.TWILIO_FROM_NUMBER,
    Body: `Your ShopHub verification code is ${code}. It expires in 10 minutes.`
  }).toString();
  const authorization = Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
  ).toString('base64');
  const request = https.request({
    hostname: 'api.twilio.com',
    path: `/2010-04-01/Accounts/${encodeURIComponent(process.env.TWILIO_ACCOUNT_SID)}/Messages.json`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${authorization}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    },
    timeout: 10000
  }, (response) => {
    response.on('end', () => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        resolve();
        return;
      }
      reject(new Error(`SMS delivery failed (HTTP ${response.statusCode}).`));
    });
    response.resume();
  });

  request.on('timeout', () => request.destroy(new Error('SMS delivery timed out')));
  request.on('error', reject);
  request.end(body);
});

const deliverVerificationCode = async ({ phone, phoneCode }) => {
  if (isDevelopmentConsoleMode()) {
    console.info('[DEV ONLY] ShopHub phone verification code: %s', phoneCode);
    return { phone: true, errors: [] };
  }

  const result = await Promise.allSettled([sendPhoneCode(phone, phoneCode)]);
  return {
    phone: result[0].status === 'fulfilled',
    errors: result[0].status === 'rejected' ? [result[0].reason] : []
  };
};

module.exports = {
  deliverVerificationCode,
  getMissingDeliverySettings,
  isDevelopmentConsoleMode
};
