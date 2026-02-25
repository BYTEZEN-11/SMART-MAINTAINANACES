const mongoose = require('mongoose');

const riskScoreSchema = new mongoose.Schema({
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
  overallRisk: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    }
  },
  riskFactors: [{
    category: {
      type: String,
      enum: ['age', 'usage', 'maintenance', 'performance', 'symptoms'],
      required: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    weight: {
      type: Number,
      min: 0,
      max: 1
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  }],
  predictions: {
    failureProbability: {
      next30Days: Number,
      next90Days: Number,
      next180Days: Number
    },
    estimatedTimeToFailure: String,
    mostLikelyFailureMode: String
  },
  recommendations: [{
    priority: String,
    action: String,
    impact: String,
    cost: {
      min: Number,
      max: Number
    }
  }],
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 7); 
      return date;
    }
  }
}, {
  timestamps: true
});

riskScoreSchema.index({ appliance: 1, calculatedAt: -1 });
riskScoreSchema.index({ 'overallRisk.level': 1 });

module.exports = mongoose.model('RiskScore', riskScoreSchema);
