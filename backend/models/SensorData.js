const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConnectedDevice',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appliance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appliance',
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  dataType: {
    type: String,
    enum: ['telemetry', 'status', 'alert', 'diagnostic'],
    default: 'telemetry'
  },
  readings: {
    
    power: {
      consumption: Number, 
      voltage: Number, 
      current: Number, 
      frequency: Number, 
      powerFactor: Number
    },
    
    temperature: {
      value: Number, 
      unit: {
        type: String,
        enum: ['C', 'F'],
        default: 'C'
      },
      location: String 
    },
    
    vibration: {
      x: Number,
      y: Number,
      z: Number,
      magnitude: Number,
      frequency: Number
    },
    
    gas: {
      type: String, 
      concentration: Number, 
      threshold: Number,
      alert: Boolean
    },
    
    humidity: {
      value: Number, 
      dewPoint: Number
    },
    
    status: {
      state: String, 
      mode: String, 
      errorCode: String,
      runtime: Number 
    },
    
    smartPlug: {
      isOn: Boolean,
      totalEnergy: Number, 
      todayEnergy: Number, 
      cost: Number
    }
  },
  
  metrics: {
    efficiency: Number,
    performanceScore: Number,
    anomalyScore: Number,
    healthScore: Number
  },
  
  anomalies: [{
    type: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    description: String,
    detectedAt: Date
  }],
  
  rawData: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

sensorDataSchema.index({ device: 1, timestamp: -1 });
sensorDataSchema.index({ user: 1, timestamp: -1 });
sensorDataSchema.index({ appliance: 1, timestamp: -1 });
sensorDataSchema.index({ 'anomalies.severity': 1, timestamp: -1 });
sensorDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); 

sensorDataSchema.pre('save', function (next) {
  next(new Error(
    'SensorData collection is read-only (BUGFIX #15). Use SensorReading for new writes.'
  ));
});
sensorDataSchema.pre('insertMany', function (next) {
  next(new Error(
    'SensorData collection is read-only (BUGFIX #15). Use SensorReading for new writes.'
  ));
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
