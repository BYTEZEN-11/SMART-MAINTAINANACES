const mongoose = require('mongoose');

const diagnosticTestSchema = new mongoose.Schema({
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
  deviceType: {
    type: String,
    required: true,
    enum: [
      'laptop', 'desktop', 'mac',
      'phone', 'tablet',
      'tv', 'soundbar',
      'fridge', 'ac', 'washing-machine', 'microwave', 'oven',
      'router', 'modem',
      'other'
    ]
  },
  deviceName: {
    type: String,
    required: true
  },
  testType: {
    type: String,
    required: true,
    enum: [
      'sound-analysis',
      'vibration-analysis',
      'thermal-analysis',
      'visual-inspection',
      'symptom-checker',
      'performance-test',
      'battery-health',
      'storage-health',
      'display-test',
      'connectivity-test',
      'audio-test',
      'input-test',
      'remote-diagnostics',
      'power-analysis',
      'full-scan'
    ]
  },
  testData: {
    
    audioUrl: String,
    audioFrequency: [Number],
    audioAmplitude: [Number],
    soundPattern: String,

vibrationData: [{
      x: Number,
      y: Number,
      z: Number,
      timestamp: Number
    }],
    vibrationIntensity: Number,
    vibrationFrequency: Number,

temperatureReadings: [{
      location: String,
      temperature: Number,
      timestamp: Date
    }],
    thermalImageUrl: String,
    hotSpots: [{
      x: Number,
      y: Number,
      temperature: Number
    }],

images: [String],
    detectedIssues: [{
      type: String,
      confidence: Number,
      location: String,
      description: String
    }],

symptoms: [{
      question: String,
      answer: String
    }],

performanceMetrics: {
      cpuUsage: Number,
      memoryUsage: Number,
      diskUsage: Number,
      networkSpeed: Number,
      responseTime: Number,
      benchmarkScore: Number
    },

batteryHealth: {
      capacity: Number,
      cycleCount: Number,
      health: String,
      voltage: Number,
      temperature: Number,
      isSwollen: Boolean
    },

storageHealth: {
      totalSpace: Number,
      usedSpace: Number,
      smartStatus: String,
      badSectors: Number,
      readErrors: Number,
      writeErrors: Number,
      estimatedLifespan: Number
    },

displayIssues: [{
      type: String, 
      location: String,
      severity: String
    }],

connectivityStatus: {
      wifi: Boolean,
      bluetooth: Boolean,
      ethernet: Boolean,
      usb: Boolean,
      hdmi: Boolean,
      signalStrength: Number
    },

powerMetrics: {
      voltage: Number,
      current: Number,
      power: Number,
      powerFactor: Number,
      energyConsumption: Number
    }
  },
  diagnosis: {
    issue: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    affectedComponents: [String],
    rootCause: String,
    solution: {
      type: String,
      required: true
    },
    estimatedCost: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'INR'
      }
    },
    urgency: {
      type: String,
      enum: ['immediate', 'within-week', 'within-month', 'routine'],
      default: 'routine'
    },
    diyPossible: {
      type: Boolean,
      default: false
    },
    preventiveMeasures: [String]
  },
  aiAnalysis: {
    model: String,
    processingTime: Number,
    rawResponse: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

diagnosticTestSchema.index({ user: 1, createdAt: -1 });
diagnosticTestSchema.index({ deviceType: 1 });
diagnosticTestSchema.index({ testType: 1 });
diagnosticTestSchema.index({ 'diagnosis.severity': 1 });

module.exports = mongoose.model('DiagnosticTest', diagnosticTestSchema);
