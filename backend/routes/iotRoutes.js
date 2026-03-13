const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  connectDevice,
  disconnectDevice,
  deleteDevice,
  getDevices,
  getDeviceById,
  receiveSensorData,
  getSensorDataHistory,
  getDeviceAlerts,
  getAllAlerts,
  updateAlertStatus,
  getDeviceHealth,
} = require('../controllers/iotController');

router.use(protect);

const ingestLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 60, 

keyGenerator: (req) => `${req.user?._id || 'anon'}:${req.params.deviceId || 'none'}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many samples', details: 'Per-device ingest rate limit exceeded' },
});

router.post('/connect', connectDevice);
router.post('/disconnect/:deviceId', disconnectDevice);
router.delete('/devices/:deviceId', deleteDevice);
router.get('/devices', getDevices);
router.get('/devices/:deviceId', getDeviceById);
router.get('/devices/:deviceId/health', getDeviceHealth);

router.post('/data/:deviceId', ingestLimiter, receiveSensorData);
router.get('/data/:deviceId/history', getSensorDataHistory);

router.get('/alerts', getAllAlerts);
router.get('/alerts/:deviceId', getDeviceAlerts);
router.patch('/alerts/:alertId', updateAlertStatus);

module.exports = router;
