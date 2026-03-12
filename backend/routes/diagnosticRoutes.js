const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  runSoundAnalysis,
  runVibrationAnalysis,
  runThermalAnalysis,
  runVisualInspection,
  runSymptomChecker,
  runComprehensiveDiagnostic,
  runPerformanceTest,
  runBatteryHealth,
  runStorageHealth,
  runConnectivityTest,
  runPowerAnalysis,
  getDiagnosticHistory,
  getDiagnosticById,
  getDiagnosticStats
} = require('../controllers/diagnosticController');

router.use(protect);

router.post('/sound-analysis', runSoundAnalysis);
router.post('/vibration-analysis', runVibrationAnalysis);
router.post('/thermal-analysis', runThermalAnalysis);
router.post('/visual-inspection', runVisualInspection);
router.post('/symptom-checker', runSymptomChecker);
router.post('/comprehensive', runComprehensiveDiagnostic);
router.post('/performance-test', runPerformanceTest);
router.post('/battery-health', runBatteryHealth);
router.post('/storage-health', runStorageHealth);
router.post('/connectivity-test', runConnectivityTest);
router.post('/power-analysis', runPowerAnalysis);

router.get('/history', getDiagnosticHistory);
router.get('/stats', getDiagnosticStats);
router.get('/:id', getDiagnosticById);

module.exports = router;
