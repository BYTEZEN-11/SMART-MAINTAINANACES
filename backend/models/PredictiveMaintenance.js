const mongoose = require('mongoose');

const predictiveMaintenanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appliance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appliance',
      required: true,
      index: true,
    },

healthScore: { type: Number, min: 0, max: 100, required: true },
    failureRisk: { type: Number, min: 0, max: 100, default: 0 },
    trend: { type: String, enum: ['improving', 'stable', 'declining'], default: 'stable' },
    estimatedLifespan: { type: String, default: null }, 

components: [
      {
        name: String,
        health: Number,
        note: String,
      },
    ],

predictedFailures: [
      {
        component: String,
        probability: Number,
        estimatedDays: Number,
        message: String, 
      },
    ],

maintenanceSchedule: [
      {
        title: String,
        dueDate: Date,
        priority: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
        completed: { type: Boolean, default: false },
      },
    ],

    recommendations: [
      {
        priority: String,
        action: String,
        reason: String,
        timeframe: String,
      },
    ],

basedOnAnalyses: { type: Number, default: 0 },
    basedOnReadings: { type: Number, default: 0 },

    validUntil: { type: Date, default: () => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d;
    } },
  },
  { timestamps: true }
);

predictiveMaintenanceSchema.index({ appliance: 1, createdAt: -1 });
predictiveMaintenanceSchema.index({ validUntil: 1 });

module.exports = mongoose.model('PredictiveMaintenance', predictiveMaintenanceSchema);
