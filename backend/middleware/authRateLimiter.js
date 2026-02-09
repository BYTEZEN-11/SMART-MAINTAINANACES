const rateLimit = require('express-rate-limit');

const authRateLimiter = (windowMs = 15 * 60 * 1000, max = 5) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many authentication attempts',
      details: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = authRateLimiter;
