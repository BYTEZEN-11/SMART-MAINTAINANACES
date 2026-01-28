const DiagnosticTest = require('../models/DiagnosticTest');
const {
  analyzeSoundPattern,
  analyzeVibrationPattern,
  analyzeThermalData,
  analyzeVisualInspection,
  analyzeSymptoms,
  comprehensiveDiagnostic,
  analyzePerformance,
  analyzeBatteryHealth,
  analyzeStorageHealth,
  analyzeConnectivity,
  analyzePower,
} = require('../services/diagnosticService');
const { sendSuccess, sendError, tryCatch, ValidationError } = require('../utils/errorHandler');

const runAnalysisLifecycle = async (req, res, { testType, baseRecord, aiFn }) => {
  const startTime = Date.now();
  const doc = new DiagnosticTest({ ...baseRecord, testType, status: 'processing' });

await doc.save({ validateBeforeSave: false });

  try {
    const diagnosis = await aiFn();
    doc.diagnosis = diagnosis;
    doc.aiAnalysis = { model: process.env.GEMINI_MODEL || 'gemini-1.5-flash', processingTime: Date.now() - startTime };
    doc.status = 'completed';
    await doc.save();
    return sendSuccess(res, 200, doc, `${testType} completed successfully`);
  } catch (aiErr) {

try {
      doc.status = 'failed';
      doc.aiAnalysis = { model: process.env.GEMINI_MODEL || 'gemini-1.5-flash', processingTime: Date.now() - startTime, error: aiErr.message };
      await doc.save();
    } catch (_) {  }
    throw aiErr;
  }
};

const runSoundAnalysis = tryCatch(async (req, res) => {
  const { deviceType, deviceName, soundDescription, audioUrl, audioData, applianceId } = req.body;
  if (!deviceType || !deviceName) {
    throw new ValidationError('Device type and name are required');
  }
  return runAnalysisLifecycle(req, res, {
    testType: 'sound-analysis',
    baseRecord: {
      user: req.user._id,
      appliance: applianceId || null,
      deviceType,
      deviceName,
      testData: {
        audioUrl,
        audioFrequency: audioData?.frequency || [],
        audioAmplitude: audioData?.amplitude || [],
        soundPattern: soundDescription
      },
    },
    aiFn: () => analyzeSoundPattern(deviceType, soundDescription, audioData),
  });
});

const runVibrationAnalysis = tryCatch(async (req, res) => {
  const { deviceType, deviceName, vibrationData, applianceId } = req.body;
  if (!deviceType || !deviceName || !vibrationData) {
    throw new ValidationError('Device type, name, and vibration data are required');
  }
  return runAnalysisLifecycle(req, res, {
    testType: 'vibration-analysis',
    baseRecord: {
      user: req.user._id,
      appliance: applianceId || null,
      deviceType,
      deviceName,
      testData: {
        vibrationData: vibrationData.readings || [],
        vibrationIntensity: vibrationData.intensity,
        vibrationFrequency: vibrationData.frequency
      },
    },
    aiFn: () => analyzeVibrationPattern(deviceType, vibrationData),
  });
});

const runThermalAnalysis = tryCatch(async (req, res) => {
  const { deviceType, deviceName, thermalData, thermalImageUrl, applianceId } = req.body;
  if (!deviceType || !deviceName) {
    throw new ValidationError('Device type and name are required');
  }
  return runAnalysisLifecycle(req, res, {
    testType: 'thermal-analysis',
    baseRecord: {
      user: req.user._id,
      appliance: applianceId || null,
      deviceType,
      deviceName,
      testData: {
        temperatureReadings: thermalData?.readings || [],
        thermalImageUrl,
        hotSpots: thermalData?.hotSpots || []
      },
    },
    aiFn: () => analyzeThermalData(deviceType, thermalData),
  });
});

const runVisualInspection = tryCatch(async (req, res) => {
  const { deviceType, deviceName, imageUrls, description, applianceId } = req.body;
  if (!deviceType || !deviceName || !imageUrls || imageUrls.length === 0) {
    throw new ValidationError('Device type, name, and at least one image are required');
  }
  return runAnalysisLifecycle(req, res, {
    testType: 'visual-inspection',
    baseRecord: {
      user: req.user._id,
      appliance: applianceId || null,
      deviceType,
      deviceName,
      testData: { images: imageUrls },
    },
    aiFn: () => analyzeVisualInspection(deviceType, imageUrls, description),
  });
});

const runSymptomChecker = tryCatch(async (req, res) => {
  const { deviceType, deviceName, symptoms, applianceId } = req.body;
  if (!deviceType || !deviceName || !symptoms || symptoms.length === 0) {
    throw new ValidationError('Device type, name, and symptoms are required');
  }
  return runAnalysisLifecycle(req, res, {
    testType: 'symptom-checker',
    baseRecord: {
      user: req.user._id,
      appliance: applianceId || null,
      deviceType,
      deviceName,
      testData: { symptoms },
    },
    aiFn: () => analyzeSymptoms(deviceType, symptoms),
  });
});

const runComprehensiveDiagnostic = tryCatch(async (req, res) => {
  const { deviceType, deviceName, allData, applianceId } = req.body;
  if (!deviceType || !deviceName) {
    throw new ValidationError('Device type and name are required');
  }
  return runAnalysisLifecycle(req, res, {
    testType: 'full-scan',
    baseRecord: {
      user: req.user._id,
      appliance: applianceId || null,
      deviceType,
      deviceName,
      testData: {
        audioUrl: allData.audioUrl,
        soundPattern: allData.soundDescription,
        vibrationData: allData.vibrationData?.readings || [],
        vibrationIntensity: allData.vibrationData?.intensity,
        temperatureReadings: allData.thermalData?.readings || [],
        images: allData.imageUrls || [],
        symptoms: allData.symptoms || [],
        performanceMetrics: allData.performanceData,
        batteryHealth: allData.batteryData,
        storageHealth: allData.storageData,
        powerMetrics: allData.powerData
      },
    },
    aiFn: () => comprehensiveDiagnostic(deviceType, allData),
  });
});

const runPerformanceTest = tryCatch(async (req, res) => {
  const { deviceType, deviceName, performanceData, applianceId } = req.body;
  if (!deviceType || !deviceName) {
    throw new ValidationError('Device type and name are required');
  }
  return runAnalysisLifecycle(req, res, {
    testType: 'performance-test',
    baseRecord: {
      user: req.user._id,
      appliance: applianceId || null,
      deviceType,
      deviceName,
      testData: {
        performanceMetrics: {
          cpuUsage: performanceData?.cpuUsage,
          memoryUsage: performanceData?.memoryUsage,
          diskUsage: performanceData?.diskUsage,
          responseTime: performanceData?.responseTime,
          benchmarkScore: performanceData?.benchmarkScore,
        },
      },
    },
    aiFn: () => analyzePerformance(deviceType, performanceData),
  });
});

const runBatteryHealth = tryCatch(async (req, res) => {
  const { deviceType, deviceName, batteryData, applianceId } = req.body;
  if (!deviceType || !deviceName) {
    throw new ValidationError('Device type and name are required');
  }
  return runAnalysisLifecycle(req, res, {
    testType: 'battery-health',
    baseRecord: {
      user: req.user._id,
      appliance: applianceId || null,
      deviceType,
      deviceName,
      testData: {
        batteryHealth: {
          capacity: batteryData?.capacity,
          cycleCount: batteryData?.cycleCount,
          health: batteryData?.health,
          voltage: batteryData?.voltage,
          temperature: batteryData?.temperature,
          isSwollen: batteryData?.isSwollen,
        },
      },
    },
    aiFn: () => analyzeBatteryHealth(deviceType, batteryData),
  });
});

const runStorageHealth = tryCatch(async (req, res) => {
  const { deviceType, deviceName, storageData, applianceId } = req.body;
  if (!deviceType || !deviceName) {
    throw new ValidationError('Device type and name are required');
  }
  return runAnalysisLifecycle(req, res, {
    testType: 'storage-health',
    baseRecord: {
      user: req.user._id,
      appliance: applianceId || null,
      deviceType,
      deviceName,
      testData: {
        storageHealth: {
          totalSpace: storageData?.totalSpace,
          usedSpace: storageData?.usedSpace,
          smartStatus: storageData?.smartStatus,
          badSectors: storageData?.badSectors,
          readErrors: storageData?.readErrors,
          writeErrors: storageData?.writeErrors,
          estimatedLifespan: storageData?.estimatedLifespan,
        },
      },
    },
    aiFn: () => analyzeStorageHealth(deviceType, storageData),
  });
});

const runConnectivityTest = tryCatch(async (req, res) => {
  const { deviceType, deviceName, connectivityData, applianceId } = req.body;
  if (!deviceType || !deviceName) {
    throw new ValidationError('Device type and name are required');
  }
  return runAnalysisLifecycle(req, res, {
    testType: 'connectivity-test',
    baseRecord: {
      user: req.user._id,
      appliance: applianceId || null,
      deviceType,
      deviceName,
      testData: {
        connectivityStatus: {
          wifi: connectivityData?.wifi,
          bluetooth: connectivityData?.bluetooth,
          ethernet: connectivityData?.ethernet,
          usb: connectivityData?.usb,
          hdmi: connectivityData?.hdmi,
          signalStrength: connectivityData?.signalStrength,
        },
      },
    },
    aiFn: () => analyzeConnectivity(deviceType, connectivityData),
  });
});

const runPowerAnalysis = tryCatch(async (req, res) => {
  const { deviceType, deviceName, powerData, applianceId } = req.body;
  if (!deviceType || !deviceName) {
    throw new ValidationError('Device type and name are required');
  }
  return runAnalysisLifecycle(req, res, {
    testType: 'power-analysis',
    baseRecord: {
      user: req.user._id,
      appliance: applianceId || null,
      deviceType,
      deviceName,
      testData: {
        powerMetrics: {
          voltage: powerData?.voltage,
          current: powerData?.current,
          power: powerData?.power,
          powerFactor: powerData?.powerFactor,
          energyConsumption: powerData?.energyConsumption,
        },
      },
    },
    aiFn: () => analyzePower(deviceType, powerData),
  });
});

const getDiagnosticHistory = tryCatch(async (req, res) => {
  const { deviceType, testType, limit } = req.query;

  const filter = { user: req.user._id };
  if (deviceType) filter.deviceType = deviceType;
  if (testType) filter.testType = testType;

const MAX_LIMIT = 200;
  const DEFAULT_LIMIT = 50;
  const parsedLimit = parseInt(limit, 10);
  const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  const history = await DiagnosticTest.find(filter)
    .populate('appliance', 'name type brand')
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  sendSuccess(res, 200, history, 'Diagnostic history retrieved successfully');
});

const getDiagnosticById = tryCatch(async (req, res) => {
  const { id } = req.params;

  const diagnostic = await DiagnosticTest.findOne({
    _id: id,
    user: req.user._id
  }).populate('appliance', 'name type brand');

  if (!diagnostic) {
    return sendError(res, 404, 'Not found', 'Diagnostic test not found');
  }

  sendSuccess(res, 200, diagnostic, 'Diagnostic retrieved successfully');
});

const getDiagnosticStats = tryCatch(async (req, res) => {
  const stats = await DiagnosticTest.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        totalTests: { $sum: 1 },
        criticalIssues: { $sum: { $cond: [{ $eq: ['$diagnosis.severity', 'Critical'] }, 1, 0] } },
        highIssues:     { $sum: { $cond: [{ $eq: ['$diagnosis.severity', 'High'] },     1, 0] } },
        mediumIssues:   { $sum: { $cond: [{ $eq: ['$diagnosis.severity', 'Medium'] },   1, 0] } },
        lowIssues:      { $sum: { $cond: [{ $eq: ['$diagnosis.severity', 'Low'] },      1, 0] } }
      }
    }
  ]);

  const deviceTypeStats = await DiagnosticTest.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$deviceType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const testTypeStats = await DiagnosticTest.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$testType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

const overall = stats[0] || {};
  delete overall._id;

  sendSuccess(res, 200, {
    overall,
    byDeviceType: deviceTypeStats,
    byTestType: testTypeStats
  }, 'Statistics retrieved successfully');
});

module.exports = {
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
};
