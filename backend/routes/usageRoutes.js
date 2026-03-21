const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { logUsage, getPatternAnalysis } = require('../controllers/usageController');

router.use(protect);

router.post('/log', logUsage);
router.get('/pattern-analysis/:applianceId', getPatternAnalysis);

module.exports = router;
