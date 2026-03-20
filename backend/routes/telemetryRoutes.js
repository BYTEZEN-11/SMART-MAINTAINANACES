const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const SensorReading = require("../models/SensorReading");
const ConnectedDevice = require("../models/ConnectedDevice");
const { sendSuccess, tryCatch, NotFoundError, ValidationError } = require("../utils/errorHandler");
const { classifyPayload } = require("../services/anomalyDetectionService");

router.post("/", protect, tryCatch(async (req, res) => {
  const { deviceId, readings } = req.body;
  if (!deviceId || !Array.isArray(readings) || readings.length === 0) {
    throw new ValidationError("deviceId and a non-empty readings array are required");
  }

const device = await ConnectedDevice.findOne({
    user: req.user._id,
    deviceId,
  }).select("_id").lean();

  if (!device) throw new NotFoundError("Device not found");

  const docs = [];
  const anomalies = [];
  for (const r of readings.slice(0, 500)) {
    if (!r || typeof r !== "object") continue;
    const value = Number(r.value);
    if (!Number.isFinite(value)) continue;
    const ts = r.ts ? new Date(r.ts) : new Date();
    if (Number.isNaN(ts.getTime())) continue;
    docs.push({
      user: req.user._id,
      device: device._id,
      deviceId,
      metric: String(r.metric || "unknown").slice(0, 64),
      value,
      ts,
    });
  }
  if (docs.length === 0) {
    return sendSuccess(res, 200, { ingested: 0, anomalies: [] }, "No valid readings");
  }

  await SensorReading.insertMany(docs, { ordered: false });

for (const d of docs) {
    const r = (await import("../services/anomalyDetectionService")).classifyReading(d.metric, d.value);
    if (r.isAnomaly) anomalies.push({ ...d, severity: r.severity, reason: r.reason });
  }

  sendSuccess(res, 201, { ingested: docs.length, anomalies }, "Telemetry ingested");
}));

router.get("/", protect, tryCatch(async (req, res) => {
  const { deviceId, metric, limit } = req.query;
  const q = { user: req.user._id };
  if (deviceId) q.deviceId = deviceId;
  if (metric) q.metric = metric;
  const lim = Math.max(1, Math.min(1000, parseInt(limit, 10) || 100));
  const list = await SensorReading.find(q).sort({ ts: -1 }).limit(lim).lean();
  sendSuccess(res, 200, list, "Telemetry retrieved");
}));

module.exports = router;
