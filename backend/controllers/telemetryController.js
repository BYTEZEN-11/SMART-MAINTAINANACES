

const SensorReading = require('../models/SensorReading');
const ConnectedDevice = require('../models/ConnectedDevice');
const { sendSuccess, sendError, tryCatch, NotFoundError, ValidationError } = require('../utils/errorHandler');
const { classifyPayload } = require('../services/anomalyDetectionService');

const MAX_READINGS_PER_REQUEST = 500;

const ingest = tryCatch(async (req, res) => {
  const { deviceId, readings } = req.body;
  if (!deviceId || !Array.isArray(readings) || readings.length === 0) {
    throw new ValidationError('deviceId and a non-empty readings array are required');
  }

  const device = await ConnectedDevice.findOne({
    user: req.user._id,
    deviceId,
  }).select('_id').lean();

  if (!device) throw new NotFoundError('Device not found');

  const docs = [];
  const anomalies = [];
  for (const r of readings.slice(0, MAX_READINGS_PER_REQUEST)) {
    if (!r || typeof r !== 'object') continue;
    const value = Number(r.value);
    if (!Number.isFinite(value)) continue;
    const ts = r.ts ? new Date(r.ts) : new Date();
    if (Number.isNaN(ts.getTime())) continue;
    const metric = String(r.metric || 'unknown').slice(0, 64);
    docs.push({ user: req.user._id, device: device._id, deviceId, metric, value, ts });
    const c = classifyPayload({ [metric]: value });
    if (c.anomalies.length > 0) {
      anomalies.push({ metric, value, ...c.anomalies[0] });
    }
  }

  if (docs.length === 0) {
    return sendSuccess(res, 200, { ingested: 0, anomalies: [] }, 'No valid readings');
  }
  await SensorReading.insertMany(docs, { ordered: false }).catch(() => {});
  sendSuccess(res, 201, { ingested: docs.length, anomalies }, 'Telemetry ingested');
});

const list = tryCatch(async (req, res) => {
  const { deviceId, metric, limit } = req.query;
  const q = { user: req.user._id };
  if (deviceId) q.deviceId = deviceId;
  if (metric) q.metric = metric;
  const lim = Math.max(1, Math.min(1000, parseInt(limit, 10) || 100));
  const out = await SensorReading.find(q).sort({ ts: -1 }).limit(lim).lean();
  sendSuccess(res, 200, out, 'Telemetry retrieved');
});

module.exports = { ingest, list };
