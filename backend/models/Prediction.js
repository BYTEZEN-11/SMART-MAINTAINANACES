const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
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
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  failureRisk: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  components: [{
    name: String,
    health: Number,
    note: String
  }],
  maintenanceSchedule: [{
    title: String,
    dueDate: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  estimatedLifespan: String,
  recommendations: [{
    priority: String,
    action: String,
    reason: String,
    timeframe: String
  }],
  validUntil: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 30); 
      return date;
    }
  }
}, {
  timestamps: true
});

predictionSchema.index({ appliance: 1, createdAt: -1 });
predictionSchema.index({ validUntil: 1 });

predictionSchema.pre('save', function (next) {
  next(new Error(
    'Prediction collection is read-only (BUGFIX #15). Use PredictiveMaintenance for new writes.'
  ));
});
predictionSchema.pre('insertMany', function (next) {
  next(new Error(
    'Prediction collection is read-only (BUGFIX #15). Use PredictiveMaintenance for new writes.'
  ));
});

module.exports = mongoose.model('Prediction', predictionSchema);
