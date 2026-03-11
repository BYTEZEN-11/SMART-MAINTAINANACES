const express = require("express");
const router = express.Router();
const ConnectedDevice = require("../models/ConnectedDevice");
const { protect } = require("../middleware/authMiddleware");
const { sendSuccess, sendError, tryCatch, NotFoundError, ValidationError } = require("../utils/errorHandler");
const crypto = require("crypto");

router.post("/", protect, tryCatch(async (req, res) => {
  const { name, type, deviceId, location } = req.body;
  if (!name || !type || !deviceId) {
    throw new ValidationError("name, type, and deviceId are required");
  }

const existing = await ConnectedDevice.findOne({ user: req.user._id, deviceId });
  if (existing) {
    return sendSuccess(res, 200, existing, "Device already registered");
  }

  const apiKey = crypto.randomBytes(24).toString("hex");
  const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  const apiKeyPrefix = apiKey.slice(0, 4);

  const device = await ConnectedDevice.create({
    user: req.user._id,
    name,
    type,
    deviceId,
    location: location || "",
    apiKeyHash,
    apiKeyPrefix,
  });

sendSuccess(res, 201, { ...device.toObject(), apiKey }, "Device registered");
}));

router.get("/", protect, tryCatch(async (req, res) => {
  const devices = await ConnectedDevice.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  sendSuccess(res, 200, devices, "Devices retrieved");
}));

router.get("/:id", protect, tryCatch(async (req, res) => {
  const device = await ConnectedDevice.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).lean();
  if (!device) throw new NotFoundError("Device not found");
  sendSuccess(res, 200, device, "Device retrieved");
}));

router.put("/:id", protect, tryCatch(async (req, res) => {
  const updates = {};
  for (const k of ["name", "type", "location", "status"]) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  const device = await ConnectedDevice.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true }
  );
  if (!device) throw new NotFoundError("Device not found");
  sendSuccess(res, 200, device, "Device updated");
}));

router.delete("/:id", protect, tryCatch(async (req, res) => {
  const r = await ConnectedDevice.deleteOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (r.deletedCount === 0) throw new NotFoundError("Device not found");
  sendSuccess(res, 200, null, "Device deleted");
}));

module.exports = router;
