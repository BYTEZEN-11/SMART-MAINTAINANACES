const mongoose = require('mongoose');

const desktopAgentLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appliance: { type: mongoose.Schema.Types.ObjectId, ref: 'Appliance' },

    deviceId: { type: String, required: true, index: true }, 
    source: { type: String, enum: ['electron', 'python', 'manual'], default: 'manual' },
    agentVersion: { type: String, default: '' },

    timestamp: { type: Date, default: Date.now, index: true },

    payload: {
      cpu: { temp: Number, usage: Number, model: String },
      gpu: { temp: Number, usage: Number, model: String },
      ram: { used: Number, total: Number },
      battery: { health: Number, cycleCount: Number, temp: Number },
      storage: [{ name: String, health: String, freeGB: Number, totalGB: Number }],
      crashes: [{ ts: Date, signature: String, exit: Number }],
      fans: [{ name: String, rpm: Number }],
      os: { type: String, default: '' },
    },

    processedHealth: {
      cpuTemp: { type: Number, default: null },
      gpuTemp: { type: Number, default: null },
      ramUsedPct: { type: Number, default: null },
      batteryHealth: { type: Number, default: null },
      diskHealth: { type: String, default: 'OK' },
      crashCount: { type: Number, default: 0 },
      fanRpm: { type: Number, default: null },
    },

    anomalies: [
      {
        type: { type: String },           
        severity: { type: String },       
        message: { type: String },
        metric: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  { timestamps: true }
);

desktopAgentLogSchema.index({ deviceId: 1, timestamp: -1 });

desktopAgentLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('DesktopAgentLog', desktopAgentLogSchema);