const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    deviceType: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    condition: {
      all: [
        {
          field: { type: String },
          op: { type: String, enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'includes', 'exists'] },
          value: mongoose.Schema.Types.Mixed,
        },
      ],
      any: [
        {
          field: { type: String },
          op: { type: String, enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'includes', 'exists'] },
          value: mongoose.Schema.Types.Mixed,
        },
      ],
    },
    action: {
      severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical', null],
        default: null,
      },
      confidenceDelta: { type: Number, default: 0 },
      issue: { type: String, default: null },
      solution: { type: String, default: null },
      recommendation: { type: String, default: null },
    },
    weight: { type: Number, default: 1 },
    enabled: { type: Boolean, default: true, index: true },
    source: { type: String, enum: ['builtin', 'user', 'admin'], default: 'builtin' },
    lastFiredAt: { type: Date, default: null },
    fireCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ruleSchema.index({ deviceType: 1, enabled: 1 });
ruleSchema.index({ deviceType: 1, weight: -1 });

module.exports = mongoose.model('Rule', ruleSchema);