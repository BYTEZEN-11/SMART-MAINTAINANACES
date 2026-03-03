const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appliance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appliance',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  powerConsumption: {
    type: Number, 
    required: true
  },
  runtime: {
    type: Number, 
    required: true
  },
  cycles: {
    type: Number, 
    default: 0
  },
  temperature: {
    type: Number, 
    default: null
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'iot', 'estimated'],
      default: 'manual'
    },
    notes: String
  }
}, {
  timestamps: true
});

usageLogSchema.index({ appliance: 1, timestamp: -1 });
usageLogSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('UsageLog', usageLogSchema);
