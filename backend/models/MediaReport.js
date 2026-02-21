const mongoose = require('mongoose');

const mediaReportSchema = new mongoose.Schema({
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
  mediaType: {
    type: String,

enum: ['image', 'video', 'audio', 'document'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

mediaReportSchema.index({ user: 1, createdAt: -1 });
mediaReportSchema.index({ appliance: 1 });

module.exports = mongoose.model('MediaReport', mediaReportSchema);
