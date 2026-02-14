const mongoose = require('mongoose');

const aiResponseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appliance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appliance'
  },
  inputText: {
    type: String
  },
  imageUrl: {
    type: String
  },
  issue: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  solution: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

aiResponseSchema.index({ user: 1, createdAt: -1 });
aiResponseSchema.index({ appliance: 1 });

module.exports = mongoose.model('AIResponse', aiResponseSchema);
