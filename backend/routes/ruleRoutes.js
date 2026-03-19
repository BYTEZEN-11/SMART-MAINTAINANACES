const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/ruleController');

router.use(protect);

router.get('/active',     ctrl.getActiveRules);
router.post('/evaluate',  ctrl.evaluateRules);
router.get('/fire-counts', ctrl.fireCounts);

module.exports = router;