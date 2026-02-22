const mongoose = require('mongoose');

const multimodalAnalysisSchema = new mongoose.Schema(
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
    deviceType: {
      type: String,
      required: true,
      trim: true,
    },
    deviceName: {
      type: String,
      required: true,
      trim: true,
    },

inputs: {
      imageUrls: { type: [String], default: [] },
      videoUrl: { type: String, default: null },
      audioUrl: { type: String, default: null },
      textDescription: { type: String, default: null },
      sensorData: {
        temperature: Number,
        current: Number,
        voltage: Number,
        vibration: Number,
        humidity: Number,
        power: Number,
        frequency: Number,
        gas: Number,
      },
    },

analysis: {
      issue: { type: String, default: null },
      category: { type: String, default: null }, 
      severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'Medium',
      },
      priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM',
      },
      confidence: { type: Number, min: 0, max: 100, default: 0 },
      healthScore: { type: Number, min: 0, max: 100, default: null },
      probableCauses: [
        {
          cause: String,
          probability: { type: Number, min: 0, max: 100 },
        },
      ],
      affectedComponents: { type: [String], default: [] },
      rootCause: { type: String, default: null },
      recommendations: { type: [String], default: [] },
      repairSteps: { type: [String], default: [] },
      estimatedCost: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
      },
      estimatedTime: {
        value: { type: Number, default: 0 },
        unit: { type: String, default: 'minutes' },
      },
      difficulty: {
        type: String,
        enum: ['Easy', 'Moderate', 'Hard', 'Professional'],
        default: 'Moderate',
      },
      preventionTips: { type: [String], default: [] },
      diyPossible: { type: Boolean, default: false },

ruleTrace:   { type: mongoose.Schema.Types.Mixed, default: null },
      matchedRules:{ type: [String], default: [] },
      evidence:    { type: mongoose.Schema.Types.Mixed, default: null },
    },

troubleshooting: {
      followUpQuestions: [
        {
          question: String,
          options: [String],
          purpose: String,
        },
      ],
      currentStage: { type: String, default: 'initial' }, 
    },

sensorAnomalies: [
      {
        type: { type: String }, 
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
        message: String,
        value: Number,
        threshold: Number,
      },
    ],

aiModel: { type: String, default: 'gemini-1.5-flash' },
    processingTime: { type: Number, default: 0 },
    isMock: { type: Boolean, default: false },

reportPdfUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

multimodalAnalysisSchema.index({ user: 1, createdAt: -1 });
multimodalAnalysisSchema.index({ appliance: 1, createdAt: -1 });
multimodalAnalysisSchema.index({ 'analysis.severity': 1, createdAt: -1 });

module.exports = mongoose.model('MultimodalAnalysis', multimodalAnalysisSchema);
