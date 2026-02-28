const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    appliance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appliance',
      index: true,
    },
    deviceId: { type: String, default: null }, 
    source: { type: String, default: 'esp32' }, 
    timestamp: { type: Date, default: Date.now, index: true },

temperature: { type: Number, default: null }, 
    humidity: { type: Number, default: null }, 
    current: { type: Number, default: null }, 
    voltage: { type: Number, default: null }, 
    power: { type: Number, default: null }, 
    frequency: { type: Number, default: null }, 
    vibration: { type: Number, default: null }, 
    gas: { type: Number, default: null }, 

healthScore: { type: Number, min: 0, max: 100, default: null },
    anomalies: [
      {
        type: { type: String },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
        message: String,
        value: Number,
        threshold: Number,
      },
    ],

raw: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

sensorReadingSchema.index({ user: 1, timestamp: -1 });
sensorReadingSchema.index({ appliance: 1, timestamp: -1 });

sensorReadingSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 365 }
);

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
