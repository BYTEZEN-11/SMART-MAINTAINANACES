const mongoose = require('mongoose');

const deviceAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConnectedDevice',
    required: true,
    index: true
  },
  appliance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appliance'
  },
  alertType: {
    type: String,
    enum: ['anomaly', 'threshold', 'offline', 'error', 'maintenance', 'critical'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    issue: String,
    possibleCause: String,
    recommendation: String,
    estimatedCost: {
      min: Number,
      max: Number
    }
  },
  sensorData: {

type: mongoose.Schema.Types.ObjectId,
    ref: 'SensorReading'
  },
  status: {
    type: String,
    enum: ['new', 'acknowledged', 'resolved', 'dismissed'],
    default: 'new'
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationSentAt: Date,
  acknowledgedAt: Date,
  resolvedAt: Date,
  dismissedAt: Date
}, {
  timestamps: true
});

deviceAlertSchema.index({ user: 1, status: 1, createdAt: -1 });
deviceAlertSchema.index({ device: 1, createdAt: -1 });
deviceAlertSchema.index({ severity: 1, status: 1 });
deviceAlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DeviceAlert', deviceAlertSchema);
