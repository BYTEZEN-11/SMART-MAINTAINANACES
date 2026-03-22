const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { sendSuccess, sendError, tryCatch } = require('../utils/errorHandler');
const { ValidationError } = require('../src/errors/ApiError');

router.use(protect);

router.get('/me', tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  if (!user) throw new ValidationError('User not found');
  sendSuccess(res, 200, user, 'Profile');
}));

router.put('/me/fcm-token', tryCatch(async (req, res) => {
  const { token } = req.body || {};
  if (typeof token !== 'string' || token.length < 10) {
    throw new ValidationError('FCM token must be a non-empty string');
  }

const safe = token.slice(0, 512);
  await User.findByIdAndUpdate(req.user._id, { fcmToken: safe });
  sendSuccess(res, 200, null, 'FCM token registered');
}));

router.delete('/me/fcm-token', tryCatch(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { fcmToken: 1 } });
  sendSuccess(res, 200, null, 'FCM token cleared');
}));

module.exports = router;