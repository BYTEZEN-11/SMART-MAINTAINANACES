const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceType: {
    type: String,
    required: true
  },
  deviceName: {
    type: String,
    required: true
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      suggestions: [String],
      diagnosis: mongoose.Schema.Types.Mixed
    }
  }],
  context: {
    conversationStage: {
      type: String,
      enum: ['initial', 'gathering', 'analyzing', 'diagnosing', 'completed'],
      default: 'initial'
    },
    collectedInfo: mongoose.Schema.Types.Mixed,
    suspectedIssues: [String]
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  finalDiagnosis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiagnosticTest'
  }
}, {
  timestamps: true
});

chatSessionSchema.index({ user: 1, createdAt: -1 });
chatSessionSchema.index({ status: 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
