const mongoose = require('mongoose');

const generatedReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appliance: { type: mongoose.Schema.Types.ObjectId, ref: 'Appliance', index: true },
    analysis: { type: mongoose.Schema.Types.ObjectId, ref: 'MultimodalAnalysis' },

    title: { type: String, required: true },
    summary: { type: String, default: null },
    pdfUrl: { type: String, required: true }, 
    fileSize: { type: Number, default: 0 },
    pages: { type: Number, default: 1 },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

generatedReportSchema.index({ user: 1, generatedAt: -1 });

module.exports = mongoose.model('GeneratedReport', generatedReportSchema);
