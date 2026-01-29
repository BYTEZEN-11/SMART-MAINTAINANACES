const ConnectedDevice = require('../models/ConnectedDevice');
const SensorReading = require('../models/SensorReading');
const DeviceAlert = require('../models/DeviceAlert');
const Appliance = require('../models/Appliance');
const { sendSuccess, sendError, tryCatch } = require('../utils/errorHandler');
const { ConflictError, NotFoundError, ApiError } = require('../src/errors/ApiError');
const { analyzeIoTData } = require('../services/iotAnalysisService');
const { sendPushNotification } = require('../services/notificationService');
const crypto = require('crypto');

const findOwnedDevice = async (userId, idOrDeviceId) => {

return ConnectedDevice.findOne({ deviceId: idOrDeviceId, user: userId });
};

const hashApiKey = (raw) => {
  if (!raw) return { hash: null, prefix: null };
  const hash = crypto.createHash('sha256').update(String(raw)).digest('hex');
  const prefix = String(raw).slice(0, 4);
  return { hash, prefix };
};

const connectDevice = tryCatch(async (req, res) => {
  const {
    deviceId,
    deviceName,
    deviceType,
    connectionType,
    manufacturer,
    model,
    ipAddress,
    macAddress,
    apiEndpoint,
    apiKey,
    mqttTopic,
    capabilities,
    applianceId
  } = req.body;

  if (!deviceId || !deviceName || !deviceType || !connectionType) {
    return sendError(res, 400, 'Validation error', 'Missing required fields');
  }

const { hash: apiKeyHash, prefix: apiKeyPrefix } = hashApiKey(apiKey);

let device = await ConnectedDevice.findOne({ deviceId, user: req.user._id });

  if (!device) {

const existing = await ConnectedDevice.findOne({ deviceId });
    if (existing) {
      throw new ConflictError(
        'Device is already registered to another account. ' +
        'Please ask the original owner to disconnect the device first, or contact support.'
      );
    }
    try {
      device = await ConnectedDevice.create({
        user: req.user._id,
        deviceId,
        deviceName,
        deviceType,
        connectionType,
        manufacturer,
        model,
        ipAddress,
        macAddress,
        apiEndpoint,
        apiKeyHash,
        apiKeyPrefix,
        mqttTopic,
        capabilities,
        appliance: applianceId,
        status: 'connected'
      });
    } catch (e) {

if (e && e.code === 11000) {
        throw new ConflictError(
          'Device is already registered. Please refresh and try again.'
        );
      }
      throw e;
    }
  } else {
    
    device.deviceName = deviceName;
    device.deviceType = deviceType;
    device.connectionType = connectionType;
    device.manufacturer = manufacturer;
    device.model = model;
    device.ipAddress = ipAddress;
    device.macAddress = macAddress;
    device.apiEndpoint = apiEndpoint;
    if (apiKeyHash) {
      device.apiKeyHash = apiKeyHash;
      device.apiKeyPrefix = apiKeyPrefix;
    }
    device.mqttTopic = mqttTopic;
    device.capabilities = capabilities;
    device.appliance = applianceId;
    device.status = 'connected';
    device.lastSeen = new Date();
    await device.save();
  }

const safe = device.toObject();
  delete safe.apiKeyHash;
  sendSuccess(res, 201, safe, 'Device connected successfully');
});

const disconnectDevice = tryCatch(async (req, res) => {
  const { deviceId } = req.params;
  const device = await findOwnedDevice(req.user._id, deviceId);
  if (!device) {
    throw new NotFoundError('Device not found');
  }
  device.status = 'disconnected';
  await device.save();
  sendSuccess(res, 200, device, 'Device disconnected');
});

const getDevices = tryCatch(async (req, res) => {
  const devices = await ConnectedDevice.find({
    user: req.user._id
  })
  .populate('appliance', 'name type brand model')
  .sort({ lastSeen: -1 });

  sendSuccess(res, 200, devices, 'Devices retrieved');
});

const getDeviceById = tryCatch(async (req, res) => {
  const { deviceId } = req.params;
  const device = await findOwnedDevice(req.user._id, deviceId);
  if (!device) {
    throw new NotFoundError('Device not found');
  }
  
  const latestData = await SensorReading.findOne({
    user: req.user._id,
    deviceId: device.deviceId,
  }).sort({ timestamp: -1 }).lean();
  sendSuccess(res, 200, { device, latestData }, 'Device retrieved');
});

const receiveSensorData = tryCatch(async (req, res) => {
  const { deviceId } = req.params;
  const { readings, rawData } = req.body;

  const device = await findOwnedDevice(req.user._id, deviceId);
  if (!device) {
    throw new NotFoundError('Device not found');
  }

await device.populate('appliance', 'name type brand model');

  device.lastSeen = new Date();
  device.status = 'connected';
  await device.save();

const r = readings || {};
  const reading = await SensorReading.create({
    user: req.user._id,
    appliance: device.appliance || null,
    deviceId: device.deviceId,
    source: device.deviceType,
    temperature: r?.temperature?.value,
    humidity: r?.humidity?.value,
    current: r?.power?.current,
    voltage: r?.power?.voltage,
    power: r?.power?.consumption,
    vibration: r?.vibration?.magnitude,
    gas: r?.gas?.concentration,
    raw: rawData || readings,
  });

const analysis = await analyzeIoTData(
    {
      device: device.toObject(),
      readings: r,
    },
    device.toObject(),
  ).catch((e) => ({ anomalies: [], metrics: {}, error: e.message }));

  if (analysis.anomalies?.length) {
    reading.anomalies = analysis.anomalies;
    await reading.save();

    for (const anomaly of analysis.anomalies) {
      if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
        const alert = await DeviceAlert.create({
          user: req.user._id,
          device: device._id,
          appliance: device.appliance,
          alertType: 'anomaly',
          severity: anomaly.severity,
          title: anomaly.type || anomaly.title || 'Anomaly',
          message: anomaly.description || anomaly.message || 'Anomaly detected',
          details: anomaly.details,
          sensorReading: reading._id,
        });

        await sendPushNotification(req.user._id, {
          title: `⚠️ ${anomaly.type || 'Anomaly'}`,
          body: anomaly.description || anomaly.message || 'Anomaly detected',
          data: {
            type: 'device_alert',
            alertId: alert._id.toString(),
            deviceId: device._id.toString(),
            severity: anomaly.severity,
          },
        });

        alert.notificationSent = true;
        alert.notificationSentAt = new Date();
        await alert.save();
      }
    }
  }

  sendSuccess(res, 201, { sensorData: reading, analysis }, 'Data received and analyzed');
});

const getSensorDataHistory = tryCatch(async (req, res) => {
  const { deviceId } = req.params;
  const { startDate, endDate, limit = 100 } = req.query;
  const device = await findOwnedDevice(req.user._id, deviceId);
  if (!device) {
    throw new NotFoundError('Device not found');
  }
  const query = { user: req.user._id, deviceId: device.deviceId };
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  const data = await SensorReading.find(query)
    .sort({ timestamp: -1 })
    .limit(Math.min(parseInt(limit) || 100, 500));
  sendSuccess(res, 200, data, 'Sensor data retrieved');
});

const getDeviceAlerts = tryCatch(async (req, res) => {
  const { deviceId } = req.params;
  const { status } = req.query;
  const device = await findOwnedDevice(req.user._id, deviceId);
  if (!device) {
    throw new NotFoundError('Device not found');
  }
  const query = { device: device._id, user: req.user._id };
  if (status) query.status = status;
  const alerts = await DeviceAlert.find(query)
    .populate('device', 'deviceName deviceType')
    .populate('appliance', 'name type')
    .sort({ createdAt: -1 })
    .limit(50);
  sendSuccess(res, 200, alerts, 'Alerts retrieved');
});

const getAllAlerts = tryCatch(async (req, res) => {
  const { status, severity } = req.query;

  const query = { user: req.user._id };

  if (status) query.status = status;
  if (severity) query.severity = severity;

  const alerts = await DeviceAlert.find(query)
    .populate('device', 'deviceName deviceType')
    .populate('appliance', 'name type')
    .sort({ createdAt: -1 })
    .limit(100);

  sendSuccess(res, 200, alerts, 'Alerts retrieved');
});

const updateAlertStatus = tryCatch(async (req, res) => {
  const { alertId } = req.params;
  const { status } = req.body;

const ALLOWED_STATUSES = ['new', 'acknowledged', 'resolved', 'dismissed'];
  if (!ALLOWED_STATUSES.includes(status)) {
    return sendError(res, 400, 'Validation error', `status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
  }

  const alert = await DeviceAlert.findOne({
    _id: alertId,
    user: req.user._id
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  alert.status = status;

  if (status === 'acknowledged') {
    alert.acknowledgedAt = new Date();
  } else if (status === 'resolved') {
    alert.resolvedAt = new Date();
  } else if (status === 'dismissed') {
    alert.dismissedAt = new Date();
  }

  await alert.save();

  sendSuccess(res, 200, alert, 'Alert updated');
});

const getDeviceHealth = tryCatch(async (req, res) => {
  const { deviceId } = req.params;
  const device = await findOwnedDevice(req.user._id, deviceId);
  if (!device) {
    throw new NotFoundError('Device not found');
  }

  const latestData = await SensorReading.findOne({
    user: req.user._id,
    deviceId: device.deviceId,
  }).sort({ timestamp: -1 }).lean();

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentData = await SensorReading.find({
    user: req.user._id,
    deviceId: device.deviceId,
    timestamp: { $gte: oneDayAgo },
  }).sort({ timestamp: 1 }).lean();

  const activeAlerts = await DeviceAlert.find({
    device: device._id,
    status: { $in: ['new', 'acknowledged'] },
  }).sort({ createdAt: -1 }).lean();

  const healthMetrics = calculateHealthMetrics(recentData);

  sendSuccess(res, 200, {
    device,
    latestData,
    recentData,
    activeAlerts,
    healthMetrics,
  }, 'Device health retrieved');
});

const calculateHealthMetrics = (dataPoints) => {
  if (!dataPoints || dataPoints.length === 0) {
    return {
      overallHealth: 100,
      powerEfficiency: 100,
      temperatureStatus: 'normal',
      vibrationStatus: 'normal',
      anomalyCount: 0
    };
  }

const readNumeric = (point, ...keys) => {
    for (const k of keys) {
      const v = k.split('.').reduce((acc, seg) => (acc != null ? acc[seg] : undefined), point);
      if (typeof v === 'number' && Number.isFinite(v)) return v;
    }
    return null;
  };

  let totalHealth = 0;
  let healthSamples = 0;
  let anomalyCount = 0;
  const powerReadings = [];
  const tempReadings = [];
  const vibrationReadings = [];

  dataPoints.forEach((data) => {
    if (data.metrics && typeof data.metrics.healthScore === 'number') {
      totalHealth += data.metrics.healthScore;
      healthSamples += 1;
    }
    if (data.anomalies && data.anomalies.length > 0) {
      anomalyCount += data.anomalies.length;
    }
    const p = readNumeric(data, 'power', 'readings.power.consumption');
    const t = readNumeric(data, 'temperature', 'readings.temperature.value');
    const v = readNumeric(data, 'vibration', 'readings.vibration.magnitude');
    if (p != null) powerReadings.push(p);
    if (t != null) tempReadings.push(t);
    if (v != null) vibrationReadings.push(v);
  });

  const avgHealth = healthSamples > 0 ? totalHealth / healthSamples : 100;
  const avgPower = powerReadings.length > 0
    ? powerReadings.reduce((a, b) => a + b, 0) / powerReadings.length
    : 0;
  const avgTemp = tempReadings.length > 0
    ? tempReadings.reduce((a, b) => a + b, 0) / tempReadings.length
    : 0;
  const avgVibration = vibrationReadings.length > 0
    ? vibrationReadings.reduce((a, b) => a + b, 0) / vibrationReadings.length
    : 0;

  return {
    overallHealth: Math.round(avgHealth),
    powerEfficiency: Math.round(100 - (avgPower / 1000) * 10), 
    temperatureStatus: avgTemp > 60 ? 'high' : avgTemp > 40 ? 'warm' : 'normal',
    vibrationStatus: avgVibration > 5 ? 'high' : avgVibration > 2 ? 'moderate' : 'normal',
    anomalyCount,
    averagePower: avgPower.toFixed(2),
    averageTemperature: avgTemp.toFixed(1),
    averageVibration: avgVibration.toFixed(2)
  };
};

const deleteDevice = tryCatch(async (req, res) => {
  const { deviceId } = req.params;
  const device = await findOwnedDevice(req.user._id, deviceId);
  if (!device) {
    throw new NotFoundError('Device not found');
  }
  await Promise.all([
    SensorReading.deleteMany({ user: req.user._id, deviceId: device.deviceId }),
    DeviceAlert.deleteMany({ user: req.user._id, device: device._id }),
    device.deleteOne(),
  ]);
  sendSuccess(res, 200, null, 'Device deleted');
});

module.exports = {
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
  calculateHealthMetrics,
};
