const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/multimodalController');

const router = express.Router();

router.use(protect);

router.post('/analyze/image', ctrl.analyzeImageCtrl);
router.post('/analyze/video', ctrl.analyzeVideoCtrl);
router.post('/analyze/audio', ctrl.analyzeAudioCtrl);
router.post('/analyze/multimodal', ctrl.analyzeMultimodalCtrl);
router.post('/analyze/text', ctrl.analyzeTextCtrl);

router.get('/analyses', ctrl.listAnalyses);
router.get('/analyses/:id', ctrl.getAnalysis);
router.delete('/analyses/:id', ctrl.deleteAnalysis);

router.post('/sensor-data', ctrl.ingestSensorData);
router.post('/sensor-data/ingest', ctrl.ingestSensorData); 
router.get('/sensor-data', ctrl.listSensorData);
router.get('/sensor-data/summary', ctrl.sensorSummary);

router.get('/predictions', ctrl.getPredictions);
router.post('/predictions/generate', ctrl.generatePredictionCtrl);

router.get('/reports', ctrl.listReports);
router.get('/reports/:id', ctrl.getReport);
router.get('/reports/:id/download', ctrl.downloadReport);
router.post('/reports/generate', ctrl.generateReportCtrl);

router.get('/dashboard', ctrl.getDashboard);

router.post('/troubleshoot/start', ctrl.startTroubleshoot);
router.post('/troubleshoot/:sessionId/answer', ctrl.answerTroubleshoot);
router.get('/troubleshoot/sessions', ctrl.listSessions);

module.exports = router;
