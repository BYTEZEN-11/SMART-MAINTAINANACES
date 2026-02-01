const path = require('path');
const fs = require('fs');
const MultimodalAnalysis = require('../models/MultimodalAnalysis');
const SensorReading = require('../models/SensorReading');
const PredictiveMaintenance = require('../models/PredictiveMaintenance');
const GeneratedReport = require('../models/GeneratedReport');
const TroubleshootingSession = require('../models/TroubleshootingSession');
const Appliance = require('../models/Appliance');
const {
  analyzeImage,
  analyzeVideo,
  analyzeAudio,
  analyzeSensor,
  analyzeMultimodal,
  generateFollowUpQuestions,
  refineDiagnosisFromAnswers,
  generatePrediction,
} = require('../services/multimodalAiService');
const { generateReport: generatePdf } = require('../services/pdfReportService');
const ruleEngine = require('../services/ruleEngine');
const { sendSuccess, sendError } = require('../utils/errorHandler');

const enrichWithRules = async (result, ctx) => {
  if (!result || !result.analysis) return result;
  try {
    await ruleEngine.initRuleEngine();
    const evidenceCtx = { ...ctx };

const userText =
      result?.inputs?.textDescription ||
      ctx?.textDescription ||
      ctx?.description ||
      ctx?.soundDescription ||
      '';
    if (userText && !evidenceCtx.userText) evidenceCtx.userText = userText;
    await ruleEngine.applyRules(result.analysis, evidenceCtx);
  } catch (e) {
    console.warn('[multimodalController] rule post-process failed:', e.message);
  }
  return result;
};

const persistAnalysis = async ({ userId, applianceId, deviceType, deviceName, inputs, result }) => {
  const doc = new MultimodalAnalysis({
    user: userId,
    appliance: applianceId || null,
    deviceType,
    deviceName,
    inputs: {
      imageUrls: inputs.imageUrls || [],
      videoUrl: inputs.videoUrl || null,
      audioUrl: inputs.audioUrl || null,
      textDescription: inputs.textDescription || null,
      sensorData: inputs.sensorData || null,
    },
    analysis: result.analysis,
    sensorAnomalies: result.sensorAnomalies || [],
    aiModel: result.aiModel,
    processingTime: result.processingTime,
    isMock: result.isMock,
    status: 'completed',
  });
  await doc.save();
  return doc;
};

const analyzeImageCtrl = async (req, res) => {
  try {
    const { deviceType, deviceName, imageUrls, description, applianceId } = req.body;
    if (!deviceType || !deviceName) {
      return sendError(res, 400, 'Validation error', 'deviceType and deviceName are required');
    }
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return sendError(res, 400, 'Validation error', 'At least one image URL is required');
    }

    const result = await analyzeImage({ deviceType, deviceName, imageUrls, description });
    await enrichWithRules(result, { deviceType, deviceName, issue: result.analysis?.issue, sensorData: null, description });
    const doc = await persistAnalysis({
      userId: req.user._id,
      applianceId,
      deviceType,
      deviceName,
      inputs: { imageUrls, textDescription: description },
      result,
    });
    sendSuccess(res, 200, doc, 'Image analysis completed');
  } catch (err) {
    console.error('analyzeImage error:', err);
    sendError(res, 500, 'Analysis failed', err.message);
  }
};

const analyzeVideoCtrl = async (req, res) => {
  try {
    const { deviceType, deviceName, videoUrl, description, applianceId } = req.body;
    if (!deviceType || !deviceName || !videoUrl) {
      return sendError(res, 400, 'Validation error', 'deviceType, deviceName, and videoUrl are required');
    }
    const result = await analyzeVideo({ deviceType, deviceName, videoUrl, description });
    await enrichWithRules(result, { deviceType, deviceName, issue: result.analysis?.issue, sensorData: null, description });
    const doc = await persistAnalysis({
      userId: req.user._id,
      applianceId,
      deviceType,
      deviceName,
      inputs: { videoUrl, textDescription: description },
      result,
    });
    sendSuccess(res, 200, doc, 'Video analysis completed');
  } catch (err) {
    console.error('analyzeVideo error:', err);
    sendError(res, 500, 'Analysis failed', err.message);
  }
};

const analyzeAudioCtrl = async (req, res) => {
  try {
    const { deviceType, deviceName, audioUrl, soundDescription, audioData, applianceId } = req.body;
    if (!deviceType || !deviceName) {
      return sendError(res, 400, 'Validation error', 'deviceType and deviceName are required');
    }
    const result = await analyzeAudio({ deviceType, deviceName, audioUrl, soundDescription, audioData });
    await enrichWithRules(result, { deviceType, deviceName, issue: result.analysis?.issue, sensorData: null, description });
    const doc = await persistAnalysis({
      userId: req.user._id,
      applianceId,
      deviceType,
      deviceName,
      inputs: { audioUrl, textDescription: soundDescription },
      result,
    });
    sendSuccess(res, 200, doc, 'Audio analysis completed');
  } catch (err) {
    console.error('analyzeAudio error:', err);
    sendError(res, 500, 'Analysis failed', err.message);
  }
};

const analyzeMultimodalCtrl = async (req, res) => {
  try {
    const {
      deviceType, deviceName, applianceId,
      imageUrls, videoUrl, audioUrl, textDescription, sensorData,
    } = req.body;
    if (!deviceType || !deviceName) {
      return sendError(res, 400, 'Validation error', 'deviceType and deviceName are required');
    }
    const hasAny = (imageUrls && imageUrls.length) || videoUrl || audioUrl || sensorData || textDescription;
    if (!hasAny) {
      return sendError(res, 400, 'Validation error', 'At least one input (image, video, audio, sensor, or text) is required');
    }

    const result = await analyzeMultimodal({
      deviceType, deviceName, imageUrls, videoUrl, audioUrl, textDescription, sensorData,
    });
    await enrichWithRules(result, { deviceType, deviceName, issue: result.analysis?.issue, sensorData, textDescription });
    const doc = await persistAnalysis({
      userId: req.user._id,
      applianceId,
      deviceType,
      deviceName,
      inputs: { imageUrls, videoUrl, audioUrl, textDescription, sensorData },
      result,
    });
    sendSuccess(res, 200, doc, 'Multimodal analysis completed');
  } catch (err) {
    console.error('analyzeMultimodal error:', err);
    sendError(res, 500, 'Analysis failed', err.message);
  }
};

const analyzeTextCtrl = async (req, res) => {
  try {
    const { deviceType, deviceName, textDescription, applianceId } = req.body;
    if (!deviceType || !deviceName || !textDescription) {
      return sendError(res, 400, 'Validation error', 'deviceType, deviceName, and textDescription are required');
    }
    
    const result = await analyzeImage({ deviceType, deviceName, imageUrls: [], description: textDescription });
    await enrichWithRules(result, { deviceType, deviceName, issue: result.analysis?.issue, sensorData: null, textDescription });
    const doc = await persistAnalysis({
      userId: req.user._id,
      applianceId,
      deviceType,
      deviceName,
      inputs: { textDescription },
      result,
    });
    sendSuccess(res, 200, doc, 'Text analysis completed');
  } catch (err) {
    console.error('analyzeText error:', err);
    sendError(res, 500, 'Analysis failed', err.message);
  }
};

const ingestSensorData = async (req, res) => {
  try {
    const { applianceId, deviceId, source = 'esp32', temperature, humidity, current, voltage, power, frequency, vibration, gas, raw } = req.body;
    if (temperature == null && humidity == null && current == null && voltage == null && power == null && frequency == null && vibration == null && gas == null) {
      return sendError(res, 400, 'Validation error', 'At least one sensor field is required');
    }

const numericFields = ['temperature', 'humidity', 'current', 'voltage', 'power', 'frequency', 'vibration', 'gas'];
    const cleaned = {};
    for (const f of numericFields) {
      const v = req.body[f];
      if (v === undefined || v === null) continue;
      const n = typeof v === 'number' ? v : Number(v);
      if (!Number.isFinite(n)) {
        return sendError(res, 400, 'Validation error', `${f} must be a finite number`);
      }
      cleaned[f] = n;
    }

    const data = { temperature, humidity, current, voltage, power, frequency, vibration, gas, ...cleaned };
    const result = await analyzeSensor({ deviceType: 'sensor', deviceName: deviceId || 'device', sensorData: data });

    const reading = new SensorReading({
      user: req.user._id,
      appliance: applianceId || null,
      deviceId: deviceId || null,
      source,
      ...cleaned,
      anomalies: result.sensorAnomalies,
      raw: raw || req.body,
    });
    await reading.save();

    sendSuccess(res, 201, {
      reading,
      anomalies: result.sensorAnomalies,
      analysis: result.analysis,
    }, 'Sensor data ingested');
  } catch (err) {
    console.error('ingestSensorData error:', err);
    sendError(res, 500, 'Ingest failed', err.message);
  }
};

const listSensorData = async (req, res) => {
  try {
    const { applianceId, limit = 100 } = req.query;
    const filter = { user: req.user._id };
    if (applianceId) filter.appliance = applianceId;
    const list = await SensorReading.find(filter).sort({ timestamp: -1 }).limit(Number(limit)).lean();
    sendSuccess(res, 200, list, 'Sensor data retrieved');
  } catch (err) {
    console.error('listSensorData error:', err);
    sendError(res, 500, 'Failed to fetch sensor data', err.message);
  }
};

const sensorSummary = async (req, res) => {
  try {
    const { applianceId, days = 30 } = req.query;
    const since = new Date(Date.now() - Number(days) * 86400000);
    const filter = { user: req.user._id, timestamp: { $gte: since } };
    if (applianceId) filter.appliance = applianceId;

    const recent = await SensorReading.find(filter).sort({ timestamp: -1 }).limit(500).lean();
    const aggregates = {};
    for (const f of ['temperature', 'humidity', 'current', 'voltage', 'power', 'frequency', 'vibration', 'gas']) {
      const vals = recent.map((r) => r[f]).filter((v) => Number.isFinite(v));
      if (vals.length === 0) continue;

let mn = vals[0];
      let mx = vals[0];
      let sum = 0;
      for (let i = 0; i < vals.length; i++) {
        const v = vals[i];
        if (v < mn) mn = v;
        if (v > mx) mx = v;
        sum += v;
      }
      aggregates[f] = {
        min: mn,
        max: mx,
        avg: sum / vals.length,
        count: vals.length,
      };
    }
    const anomalies = recent.flatMap((r) => r.anomalies || []);
    sendSuccess(res, 200, { aggregates, anomalies, count: recent.length }, 'Summary retrieved');
  } catch (err) {
    console.error('sensorSummary error:', err);
    sendError(res, 500, 'Failed to summarize', err.message);
  }
};

const getPredictions = async (req, res) => {
  try {
    const { applianceId } = req.query;
    if (!applianceId) {
      
      const list = await PredictiveMaintenance.aggregate([
        { $match: { user: req.user._id, validUntil: { $gte: new Date() } } },
        { $sort: { appliance: 1, createdAt: -1 } },
        { $group: { _id: '$appliance', doc: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$doc' } },
      ]);
      return sendSuccess(res, 200, list, 'Latest predictions retrieved');
    }
    const list = await PredictiveMaintenance.find({
      user: req.user._id,
      appliance: applianceId,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    sendSuccess(res, 200, list, 'Predictions retrieved');
  } catch (err) {
    console.error('getPredictions error:', err);
    sendError(res, 500, 'Failed to fetch predictions', err.message);
  }
};

const generatePredictionCtrl = async (req, res) => {
  try {
    const { applianceId } = req.body;
    if (!applianceId) return sendError(res, 400, 'Validation error', 'applianceId is required');
    const appliance = await Appliance.findOne({ _id: applianceId, user: req.user._id });
    if (!appliance) return sendError(res, 404, 'Not found', 'Appliance not found');

    const since = new Date(Date.now() - 60 * 86400000);
    const [analyses, readings] = await Promise.all([
      MultimodalAnalysis.find({ user: req.user._id, appliance: applianceId, createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      SensorReading.find({ user: req.user._id, appliance: applianceId, timestamp: { $gte: since } })
        .sort({ timestamp: -1 })
        .limit(200)
        .lean(),
    ]);

    const result = await generatePrediction({ appliance, recentAnalyses: analyses, recentReadings: readings });

    const doc = new PredictiveMaintenance({
      user: req.user._id,
      appliance: applianceId,
      ...result,
      basedOnAnalyses: analyses.length,
      basedOnReadings: readings.length,
    });
    await doc.save();
    sendSuccess(res, 201, doc, 'Prediction generated');
  } catch (err) {
    console.error('generatePrediction error:', err);
    sendError(res, 500, 'Prediction failed', err.message);
  }
};

const listReports = async (req, res) => {
  try {
    const { applianceId, limit = 50 } = req.query;
    const filter = { user: req.user._id };
    if (applianceId) filter.appliance = applianceId;

const parsedLimit = parseInt(limit, 10);
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 200)
      : 50;
    const list = await GeneratedReport.find(filter)
      .sort({ generatedAt: -1 })
      .limit(safeLimit)
      .populate('appliance', 'name type brand')
      .lean();
    sendSuccess(res, 200, list, 'Reports retrieved');
  } catch (err) {
    console.error('listReports error:', err);
    sendError(res, 500, 'Failed to list reports', err.message);
  }
};

const getReport = async (req, res) => {
  try {
    const report = await GeneratedReport.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return sendError(res, 404, 'Not found', 'Report not found');
    sendSuccess(res, 200, report, 'Report retrieved');
  } catch (err) {
    console.error('getReport error:', err);
    sendError(res, 500, 'Failed to get report', err.message);
  }
};

const downloadReport = async (req, res) => {
  try {
    const report = await GeneratedReport.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return sendError(res, 404, 'Not found', 'Report not found');
    const fullPath = path.join(__dirname, '..', report.pdfUrl);
    if (!report.pdfUrl || !fs.existsSync(fullPath)) {
      return sendError(res, 404, 'Missing file', 'PDF file is no longer available');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.title || 'report'}.pdf"`);

const stream = fs.createReadStream(fullPath);
    stream.on('error', (err) => {
      console.error('downloadReport stream error:', err);
      if (!res.headersSent) {
        sendError(res, 500, 'Download failed', err.message);
      } else {
        res.destroy(err);
      }
    });
    stream.pipe(res);
  } catch (err) {
    console.error('downloadReport error:', err);
    sendError(res, 500, 'Download failed', err.message);
  }
};

const generateReportCtrl = async (req, res) => {
  try {
    const { analysisId, template = 'executive' } = req.body;
    if (!analysisId) return sendError(res, 400, 'Validation error', 'analysisId is required');
    const validTemplates = ['executive', 'technician', 'insurance'];
    const chosenTemplate = validTemplates.includes(template) ? template : 'executive';
    const analysis = await MultimodalAnalysis.findOne({ _id: analysisId, user: req.user._id });
    if (!analysis) return sendError(res, 404, 'Not found', 'Analysis not found');
    const appliance = analysis.appliance
      ? await Appliance.findById(analysis.appliance).lean()
      : null;

    const outputDir = path.join(__dirname, '..', 'uploads', 'reports');
    const result = await generatePdf({
      user: req.user,
      appliance,
      analysis,
      outputDir,
      template: chosenTemplate,
    });

    const relativePath = path.join('uploads', 'reports', result.fileName);
    const doc = new GeneratedReport({
      user: req.user._id,
      appliance: analysis.appliance || null,
      analysis: analysis._id,
      title: `Diagnostic Report — ${analysis.deviceName || analysis.deviceType}`,
      summary: analysis.analysis?.issue,
      pdfUrl: relativePath,
      fileSize: result.fileSize,
    });
    await doc.save();

analysis.reportPdfUrl = relativePath;
    await analysis.save();

    sendSuccess(res, 201, doc, 'Report generated');
  } catch (err) {
    console.error('generateReport error:', err);
    sendError(res, 500, 'Report generation failed', err.message);
  }
};

const listAnalyses = async (req, res) => {
  try {
    const { applianceId, limit = 50, severity } = req.query;
    const filter = { user: req.user._id };
    if (applianceId) filter.appliance = applianceId;

if (severity) {
      const sev = String(severity);
      filter['analysis.severity'] = ['low', 'medium', 'high', 'critical'].includes(sev.toLowerCase())
        ? sev[0].toUpperCase() + sev.slice(1).toLowerCase()
        : sev;
    }
    const list = await MultimodalAnalysis.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('appliance', 'name type brand')
      .lean();
    sendSuccess(res, 200, list, 'Analyses retrieved');
  } catch (err) {
    console.error('listAnalyses error:', err);
    sendError(res, 500, 'Failed to list analyses', err.message);
  }
};

const getAnalysis = async (req, res) => {
  try {
    const analysis = await MultimodalAnalysis.findOne({ _id: req.params.id, user: req.user._id })
      .populate('appliance', 'name type brand');
    if (!analysis) return sendError(res, 404, 'Not found', 'Analysis not found');
    sendSuccess(res, 200, analysis, 'Analysis retrieved');
  } catch (err) {
    console.error('getAnalysis error:', err);
    sendError(res, 500, 'Failed to get analysis', err.message);
  }
};

const deleteAnalysis = async (req, res) => {
  try {
    const r = await MultimodalAnalysis.deleteOne({ _id: req.params.id, user: req.user._id });
    if (r.deletedCount === 0) return sendError(res, 404, 'Not found', 'Analysis not found');
    sendSuccess(res, 200, { deleted: true }, 'Analysis deleted');
  } catch (err) {
    console.error('deleteAnalysis error:', err);
    sendError(res, 500, 'Failed to delete', err.message);
  }
};

const getDashboard = async (req, res) => {
  try {
    const [analyses, sensorCount, predictions, openIssues] = await Promise.all([
      MultimodalAnalysis.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10).lean(),
      SensorReading.countDocuments({ user: req.user._id }),
      PredictiveMaintenance.find({ user: req.user._id, validUntil: { $gte: new Date() } })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      MultimodalAnalysis.countDocuments({
        user: req.user._id,
        'analysis.severity': { $in: ['High', 'Critical'] },
      }),
    ]);

const sevMap = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    const recent = analyses.slice(0, 5);
    const healthScore = recent.length
      ? Math.max(0, 100 - (recent.reduce((s, a) => s + (sevMap[a.analysis?.severity] || 0), 0) / recent.length) * 15)
      : 100;

const recentReports = await GeneratedReport.find({ user: req.user._id })
      .sort({ generatedAt: -1 })
      .limit(5)
      .lean();

    sendSuccess(res, 200, {
      healthScore: Math.round(healthScore),
      openIssues,
      recentAnalyses: analyses,
      recentReports,
      predictions,
      sensorReadings: sensorCount,
    }, 'Dashboard retrieved');
  } catch (err) {
    console.error('getDashboard error:', err);
    sendError(res, 500, 'Dashboard failed', err.message);
  }
};

const startTroubleshoot = async (req, res) => {
  try {
    const { deviceType, deviceName, description, applianceId } = req.body;
    if (!deviceType || !deviceName) {
      return sendError(res, 400, 'Validation error', 'deviceType and deviceName are required');
    }

const safeDescription = typeof description === 'string'
      ? description.slice(0, 4000)
      : '';
    const questions = await generateFollowUpQuestions({ deviceType, deviceName, description: safeDescription });
    const session = new TroubleshootingSession({
      user: req.user._id,
      appliance: applianceId || null,
      deviceType,
      deviceName,
      initialDescription: safeDescription,
      messages: [
        { role: 'user', content: safeDescription || '' },
        { role: 'assistant', content: `I'll help troubleshoot your ${deviceType}. Let me ask a few questions to narrow it down.` },
      ],
      stage: 'clarifying',
    });
    await session.save();
    sendSuccess(res, 201, { session, questions }, 'Troubleshooting session started');
  } catch (err) {
    console.error('startTroubleshoot error:', err);
    sendError(res, 500, 'Failed to start', err.message);
  }
};

const answerTroubleshoot = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body; 
    if (!Array.isArray(answers) || answers.length === 0) {
      return sendError(res, 400, 'Validation error', 'answers array is required');
    }

const MAX_ANSWERS = 50;
    const MAX_ANSWER_TEXT = 4000;
    const safeAnswers = answers.slice(0, MAX_ANSWERS).map((a) => ({
      question: typeof a?.question === 'string' ? a.question.slice(0, 500) : '',
      answer: typeof a?.answer === 'string' ? a.answer.slice(0, MAX_ANSWER_TEXT) : String(a?.answer ?? '').slice(0, MAX_ANSWER_TEXT),
      purpose: typeof a?.purpose === 'string' ? a.purpose.slice(0, 200) : '',
    }));

    const session = await TroubleshootingSession.findOne({ _id: sessionId, user: req.user._id });
    if (!session) return sendError(res, 404, 'Not found', 'Session not found');
    if (session.isComplete) return sendError(res, 400, 'Session complete', 'Session is already finalized');

    for (const a of safeAnswers) {
      session.messages.push({ role: 'user', content: `${a.question} -> ${a.answer}` });
    }

const refined = await refineDiagnosisFromAnswers({
      deviceType: session.deviceType,
      deviceName: session.deviceName,
      description: session.initialDescription,
      answers: safeAnswers,
      previousDiagnosis: session.currentDiagnosis,
    });
    await enrichWithRules(refined, {
      deviceType: session.deviceType,
      deviceName: session.deviceName,
      issue: refined.analysis?.issue,
      sensorData: null,
    });

    session.currentDiagnosis = refined.analysis;
    session.stage = 'final';
    session.isComplete = true;
    session.messages.push({
      role: 'assistant',
      content: `Diagnosis refined: ${refined.analysis.issue} (Severity: ${refined.analysis.severity}, Confidence: ${refined.analysis.confidence}%)`,
    });
    await session.save();

const doc = await persistAnalysis({
      userId: req.user._id,
      applianceId: session.appliance,
      deviceType: session.deviceType,
      deviceName: session.deviceName,
      inputs: { textDescription: session.initialDescription },
      result: refined,
    });

    sendSuccess(res, 200, { session, analysis: doc }, 'Diagnosis refined');
  } catch (err) {
    console.error('answerTroubleshoot error:', err);
    sendError(res, 500, 'Failed to process', err.message);
  }
};

const listSessions = async (req, res) => {
  try {
    const list = await TroubleshootingSession.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('appliance', 'name type brand')
      .lean();
    sendSuccess(res, 200, list, 'Sessions retrieved');
  } catch (err) {
    console.error('listSessions error:', err);
    sendError(res, 500, 'Failed to list', err.message);
  }
};

module.exports = {
  analyzeImageCtrl,
  analyzeVideoCtrl,
  analyzeAudioCtrl,
  analyzeMultimodalCtrl,
  analyzeTextCtrl,
  ingestSensorData,
  listSensorData,
  sensorSummary,
  getPredictions,
  generatePredictionCtrl,
  listReports,
  getReport,
  downloadReport,
  generateReportCtrl,
  listAnalyses,
  getAnalysis,
  deleteAnalysis,
  getDashboard,
  startTroubleshoot,
  answerTroubleshoot,
  listSessions,
};
