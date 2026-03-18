const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  calculateRiskScore,
  getRiskHistory
} = require('../controllers/riskController');

router.use(protect);

router.get('/calculate/:applianceId', calculateRiskScore);

router.get('/history/:applianceId', getRiskHistory);

module.exports = router;
