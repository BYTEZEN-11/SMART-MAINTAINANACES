const mongoose = require('mongoose');

const applianceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Appliance name is required'],
    trim: true
  },
  type: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  modelNumber: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date
  },
  serviceDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  notes: {
    type: String
  },
  image: {
    type: String
  }
}, {
  timestamps: true
});

applianceSchema.index({ user: 1, createdAt: -1 });
applianceSchema.index({ user: 1, name: 1 });

module.exports = mongoose.model('Appliance', applianceSchema);
