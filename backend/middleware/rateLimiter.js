const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests',
    details: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { generalLimiter };
