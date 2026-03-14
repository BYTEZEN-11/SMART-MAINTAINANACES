const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPrediction } = require('../controllers/maintenanceController');

router.use(protect);

router.get('/prediction/:applianceId', getPrediction);

module.exports = router;
