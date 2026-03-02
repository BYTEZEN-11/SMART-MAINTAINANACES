const mongoose = require('mongoose');

const troubleshootingSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appliance: { type: mongoose.Schema.Types.ObjectId, ref: 'Appliance' },
    deviceType: { type: String, required: true },
    deviceName: { type: String, required: true },
    initialDescription: { type: String, default: null },

messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],

currentDiagnosis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    stage: { type: String, enum: ['gathering', 'clarifying', 'final'], default: 'gathering' },
    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

troubleshootingSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('TroubleshootingSession', troubleshootingSessionSchema);
