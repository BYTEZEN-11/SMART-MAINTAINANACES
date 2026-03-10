const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const authRateLimiter = require('../middleware/authRateLimiter');
const ctrl = require('../controllers/desktopAgentController');

const pairConsumeLimiter = authRateLimiter();
router.post('/pair/consume', pairConsumeLimiter, ctrl.consumePairCode);

router.use(protect);

router.post('/ingest',    ctrl.ingestLogs);
router.get('/logs',       ctrl.getLatestLogs);
router.get('/health',     ctrl.getHealth);
router.get('/pair-code',  ctrl.getPairCode);
router.post('/devices/:deviceId/verify', ctrl.verifyDevice);

module.exports = router;