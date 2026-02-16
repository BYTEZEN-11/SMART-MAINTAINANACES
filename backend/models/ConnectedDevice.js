const mongoose = require('mongoose');

const connectedDeviceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appliance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appliance',
    index: true
  },

deviceId: {
    type: String,
    required: true,
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    enum: ['wifi', 'bluetooth', 'smart_plug', 'sensor'],
    required: true
  },
  connectionType: {
    type: String,
    enum: ['wifi', 'ble', 'mqtt', 'http', 'websocket'],
    required: true
  },
  manufacturer: String,
  model: String,
  firmwareVersion: String,
  ipAddress: String,
  macAddress: String,
  apiEndpoint: String,

apiKeyHash: {
    type: String,
    select: false,
  },
  apiKeyPrefix: {
    type: String,
    maxlength: 4,
  },
  mqttTopic: String,
  capabilities: [{
    type: String,
    enum: ['power', 'temperature', 'humidity', 'vibration', 'gas', 'current', 'voltage', 'status', 'control']
  }],
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'pairing'],
    default: 'disconnected'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  connectionConfig: {
    pollingInterval: {
      type: Number,
      default: 60000 
    },
    timeout: {
      type: Number,
      default: 30000
    },
    retryAttempts: {
      type: Number,
      default: 3
    }
  },
  metadata: {
    rssi: Number, 
    batteryLevel: Number,
    location: String
  }
}, {
  timestamps: true
});

connectedDeviceSchema.index({ user: 1, deviceId: 1 }, { unique: true });
connectedDeviceSchema.index({ user: 1, status: 1 });
connectedDeviceSchema.index({ deviceType: 1, status: 1 });
connectedDeviceSchema.index({ lastSeen: 1 });

module.exports = mongoose.model('ConnectedDevice', connectedDeviceSchema);
