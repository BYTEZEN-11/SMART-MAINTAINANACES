const Appliance = require('../models/Appliance');

const PredictiveMaintenance = require('../models/PredictiveMaintenance');
const UsageLog = require('../models/UsageLog');
const { sendSuccess, sendError, tryCatch, NotFoundError } = require('../utils/errorHandler');

const getPrediction = tryCatch(async (req, res) => {
  const { applianceId } = req.params;

  const appliance = await Appliance.findOne({
    _id: applianceId,
    user: req.user._id
  });

  if (!appliance) {
    throw new NotFoundError('Appliance not found');
  }

const existingPrediction = await PredictiveMaintenance.findOne({
    appliance: applianceId,
    validUntil: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (existingPrediction) {
    return sendSuccess(res, 200, existingPrediction, 'Prediction retrieved');
  }

const ageInMonths = calculateAge(appliance.purchaseDate);
  const usageLogs = await UsageLog.find({ appliance: applianceId }).limit(30);
  const avgDailyUsage = calculateAvgUsage(usageLogs);

  const healthScore = calculateHealthScore({
    age: ageInMonths,
    usage: avgDailyUsage,
    type: appliance.type
  });

  const failureRisk = calculateFailureRisk(healthScore, ageInMonths);
  const components = getComponentHealth(appliance.type, ageInMonths, avgDailyUsage);
  const maintenanceSchedule = generateMaintenanceSchedule(appliance, components);

const prediction = await PredictiveMaintenance.create({
    user: req.user._id,
    appliance: applianceId,
    healthScore,
    failureRisk,
    components,
    maintenanceSchedule,
    estimatedLifespan: calculateRemainingLife(healthScore, ageInMonths),
    recommendations: generateRecommendations(healthScore, components)
  });

  sendSuccess(res, 200, prediction, 'Prediction generated successfully');
});

const calculateAge = (purchaseDate) => {
  if (!purchaseDate) return 12;
  const purchase = new Date(purchaseDate);
  if (Number.isNaN(purchase.getTime())) return 12;
  const ms = Date.now() - purchase.getTime();
  if (!Number.isFinite(ms) || ms < 0) return 12;
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 30));
};

const calculateAvgUsage = (logs) => {
  if (logs.length === 0) return 8; 
  const totalRuntime = logs.reduce((sum, log) => sum + log.runtime, 0);
  return totalRuntime / logs.length;
};

const calculateHealthScore = ({ age, usage, type }) => {
  let score = 100;
  
  const expectedLife = { fridge: 120, 'washing-machine': 96, ac: 120, microwave: 84 };
  const lifespan = expectedLife[type] || 96;
  
  score -= (age / lifespan) * 40;
  score -= (usage / 12) * 30;
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

const calculateFailureRisk = (healthScore, age) => {
  let risk = (100 - healthScore) * 0.6;
  if (age > 60) risk += 20;
  else if (age > 36) risk += 10;
  return Math.min(100, Math.round(risk));
};

const getComponentHealth = (type, age, usage) => {
  const templates = {
    fridge: [
      { name: 'Compressor', avgLife: 120 },
      { name: 'Thermostat', avgLife: 96 },
      { name: 'Door Seal', avgLife: 60 },
      { name: 'Cooling Fan', avgLife: 84 }
    ],
    'washing-machine': [
      { name: 'Motor', avgLife: 108 },
      { name: 'Drum Bearings', avgLife: 72 },
      { name: 'Water Pump', avgLife: 60 },
      { name: 'Control Board', avgLife: 96 }
    ],
    ac: [
      { name: 'Compressor', avgLife: 120 },
      { name: 'Condenser Coil', avgLife: 96 },
      { name: 'Fan Motor', avgLife: 84 },
      { name: 'Capacitor', avgLife: 60 }
    ]
  };
  
  const components = templates[type] || templates.fridge;
  
  return components.map(comp => {
    const health = Math.max(0, Math.min(100, 
      Math.round(100 - (age / comp.avgLife) * 60 - (usage / 10) * 20)
    ));
    
    let note = '';
    if (health < 30) note = 'Critical - Replace soon';
    else if (health < 50) note = 'Fair - Monitor closely';
    else if (health < 70) note = 'Good - Schedule maintenance';
    else note = 'Excellent condition';
    
    return { name: comp.name, health, note };
  });
};

const generateMaintenanceSchedule = (appliance, components) => {
  const schedule = [];
  const now = new Date();
  
  components.forEach(comp => {
    if (comp.health < 50) {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 30);
      schedule.push({
        title: `${comp.name} Inspection`,
        dueDate,
        priority: comp.health < 30 ? 'high' : 'medium'
      });
    }
  });
  
  return schedule;
};

const calculateRemainingLife = (healthScore, age) => {
  const remainingMonths = Math.round((healthScore / 100) * (120 - age));
  const years = Math.floor(remainingMonths / 12);
  const months = remainingMonths % 12;
  return `${years} years ${months} months`;
};

const generateRecommendations = (healthScore, components) => {
  const recommendations = [];
  
  if (healthScore < 50) {
    recommendations.push({
      priority: 'high',
      action: 'Schedule professional inspection',
      reason: 'Overall health is below 50%',
      timeframe: 'Within 2 weeks'
    });
  }
  
  components.filter(c => c.health < 50).forEach(comp => {
    recommendations.push({
      priority: comp.health < 30 ? 'high' : 'medium',
      action: `Inspect/replace ${comp.name}`,
      reason: `Component health at ${comp.health}%`,
      timeframe: comp.health < 30 ? 'Immediate' : 'Within 1 month'
    });
  });
  
  return recommendations;
};

module.exports = {
  getPrediction
};
