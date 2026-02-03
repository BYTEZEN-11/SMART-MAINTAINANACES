const RiskScore = require('../models/RiskScore');
const Appliance = require('../models/Appliance');
const UsageLog = require('../models/UsageLog');
const DiagnosticTest = require('../models/DiagnosticTest');

const PredictiveMaintenance = require('../models/PredictiveMaintenance');
const { sendSuccess, sendError, tryCatch, ValidationError, NotFoundError } = require('../utils/errorHandler');

const calculateRiskScore = tryCatch(async (req, res) => {
  const { applianceId } = req.params;

  const appliance = await Appliance.findOne({
    _id: applianceId,
    user: req.user._id
  });

  if (!appliance) {
    throw new NotFoundError('Appliance not found');
  }

const existingRisk = await RiskScore.findOne({
    appliance: applianceId,
    validUntil: { $gt: new Date() }
  }).sort({ calculatedAt: -1 });

  if (existingRisk) {
    return sendSuccess(res, 200, existingRisk, 'Risk score retrieved');
  }

const ageInMonths = calculateAge(appliance.purchaseDate);
  const usageLogs = await UsageLog.find({ appliance: applianceId }).limit(30);
  const diagnostics = await DiagnosticTest.find({
    user: req.user._id,
    deviceName: appliance.name
  }).limit(10);
  const prediction = await PredictiveMaintenance.findOne({ appliance: applianceId })
    .sort({ createdAt: -1 });

const riskFactors = [];

const ageRisk = calculateAgeRisk(ageInMonths, appliance.type);
  riskFactors.push(ageRisk);

const usageRisk = calculateUsageRisk(usageLogs, appliance.type);
  riskFactors.push(usageRisk);

const maintenanceRisk = calculateMaintenanceRisk(appliance);
  riskFactors.push(maintenanceRisk);

const performanceRisk = calculatePerformanceRisk(prediction);
  riskFactors.push(performanceRisk);

const symptomRisk = calculateSymptomRisk(diagnostics);
  riskFactors.push(symptomRisk);

const overallScore = calculateOverallRisk(riskFactors);
  const riskLevel = getRiskLevel(overallScore);

const predictions = generatePredictions(overallScore, riskFactors, appliance.type);

const recommendations = generateRiskRecommendations(riskFactors, overallScore);

  const riskScore = await RiskScore.create({
    user: req.user._id,
    appliance: applianceId,
    overallRisk: {
      score: overallScore,
      level: riskLevel
    },
    riskFactors,
    predictions,
    recommendations
  });

  sendSuccess(res, 200, riskScore, 'Risk score calculated');
});

const getRiskHistory = tryCatch(async (req, res) => {
  const { applianceId } = req.params;

  const history = await RiskScore.find({
    appliance: applianceId,
    user: req.user._id
  })
  .sort({ calculatedAt: -1 })
  .limit(10);

  sendSuccess(res, 200, history, 'Risk history retrieved');
});

const monthsBetween = (later, earlier) => {
  const ms = later.getTime() - earlier.getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 30));
};

const calculateAge = (purchaseDate) => {
  if (!purchaseDate) return 12;
  const purchase = new Date(purchaseDate);
  if (Number.isNaN(purchase.getTime())) return 12;
  return monthsBetween(new Date(), purchase) ?? 12;
};

const calculateAgeRisk = (ageInMonths, type) => {
  const expectedLife = { 
    fridge: 120, 
    'washing-machine': 96, 
    ac: 120, 
    microwave: 84,
    tv: 84,
    laptop: 60,
    phone: 36
  };
  const lifespan = expectedLife[type] || 96;
  
  const ageRatio = ageInMonths / lifespan;
  let score = Math.min(100, ageRatio * 100);
  
  let severity = 'low';
  if (score >= 80) severity = 'critical';
  else if (score >= 60) severity = 'high';
  else if (score >= 40) severity = 'medium';
  
  return {
    category: 'age',
    score: Math.round(score),
    weight: 0.25,
    description: `Device is ${ageInMonths} months old (${Math.round(ageRatio * 100)}% of expected lifespan)`,
    severity
  };
};

const calculateUsageRisk = (logs, type) => {
  if (logs.length === 0) {
    return {
      category: 'usage',
      score: 50,
      weight: 0.20,
      description: 'No usage data available',
      severity: 'medium'
    };
  }
  
  const avgDailyUsage = logs.reduce((sum, log) => sum + log.runtime, 0) / logs.length;
  const normalUsage = { fridge: 24, 'washing-machine': 2, ac: 8, microwave: 1, tv: 6, laptop: 8, phone: 12 };
  const expected = normalUsage[type] || 8;
  
  const usageRatio = avgDailyUsage / expected;
  let score = Math.min(100, usageRatio * 50);
  
  let severity = 'low';
  if (score >= 80) severity = 'critical';
  else if (score >= 60) severity = 'high';
  else if (score >= 40) severity = 'medium';
  
  return {
    category: 'usage',
    score: Math.round(score),
    weight: 0.20,
    description: `Average daily usage: ${avgDailyUsage.toFixed(1)} hours (${Math.round(usageRatio * 100)}% of normal)`,
    severity
  };
};

const calculateMaintenanceRisk = (appliance) => {
  const lastService = appliance.lastServiceDate;

  if (!lastService) {
    return {
      category: 'maintenance',
      score: 70,
      weight: 0.15,
      description: 'No service history recorded',
      severity: 'high'
    };
  }

const serviceDate = new Date(lastService);
  if (Number.isNaN(serviceDate.getTime())) {
    return {
      category: 'maintenance',
      score: 70,
      weight: 0.15,
      description: 'Service history date is unparseable',
      severity: 'high'
    };
  }
  const monthsSinceService = monthsBetween(new Date(), serviceDate) ?? 0;
  let score = Math.min(100, (monthsSinceService / 12) * 100);
  
  let severity = 'low';
  if (score >= 80) severity = 'critical';
  else if (score >= 60) severity = 'high';
  else if (score >= 40) severity = 'medium';
  
  return {
    category: 'maintenance',
    score: Math.round(score),
    weight: 0.15,
    description: `Last serviced ${monthsSinceService} months ago`,
    severity
  };
};

const calculatePerformanceRisk = (prediction) => {
  if (!prediction) {
    return {
      category: 'performance',
      score: 50,
      weight: 0.25,
      description: 'No performance data available',
      severity: 'medium'
    };
  }
  
  const score = 100 - prediction.healthScore;
  
  let severity = 'low';
  if (score >= 80) severity = 'critical';
  else if (score >= 60) severity = 'high';
  else if (score >= 40) severity = 'medium';
  
  return {
    category: 'performance',
    score: Math.round(score),
    weight: 0.25,
    description: `Health score: ${prediction.healthScore}%, Failure risk: ${prediction.failureRisk}%`,
    severity
  };
};

const calculateSymptomRisk = (diagnostics) => {
  if (diagnostics.length === 0) {
    return {
      category: 'symptoms',
      score: 0,
      weight: 0.15,
      description: 'No symptoms detected',
      severity: 'low'
    };
  }

const severityOf = (d) => d?.diagnosis?.severity || d?.results?.severity || 'Low';
  const recentDiagnostics = diagnostics.slice(0, 5);
  const issueCount = recentDiagnostics.filter((d) => {
    const s = severityOf(d);
    return s && s !== 'Low';
  }).length;
  
  const score = Math.min(100, (issueCount / recentDiagnostics.length) * 100);
  
  let severity = 'low';
  if (score >= 80) severity = 'critical';
  else if (score >= 60) severity = 'high';
  else if (score >= 40) severity = 'medium';
  
  return {
    category: 'symptoms',
    score: Math.round(score),
    weight: 0.15,
    description: `${issueCount} issues detected in last ${recentDiagnostics.length} tests`,
    severity
  };
};

const calculateOverallRisk = (factors) => {
  const weightedSum = factors.reduce((sum, factor) => 
    sum + (factor.score * factor.weight), 0
  );
  return Math.round(weightedSum);
};

const getRiskLevel = (score) => {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
};

const generatePredictions = (overallScore, factors, type) => {
  const baseFailureRate = overallScore / 100;
  
  return {
    failureProbability: {
      next30Days: Math.round(baseFailureRate * 15),
      next90Days: Math.round(baseFailureRate * 35),
      next180Days: Math.round(baseFailureRate * 60)
    },
    estimatedTimeToFailure: overallScore >= 75 ? '1-3 months' :
                            overallScore >= 50 ? '3-6 months' :
                            overallScore >= 25 ? '6-12 months' : '12+ months',
    mostLikelyFailureMode: getMostLikelyFailure(factors, type)
  };
};

const getMostLikelyFailure = (factors, type) => {
  const highestRisk = factors.reduce((max, f) => 
    f.score > max.score ? f : max
  );
  
  const failures = {
    age: { fridge: 'Compressor failure', 'washing-machine': 'Motor failure', ac: 'Compressor failure' },
    usage: { fridge: 'Thermostat failure', 'washing-machine': 'Bearing wear', ac: 'Capacitor failure' },
    maintenance: { fridge: 'Cooling system', 'washing-machine': 'Pump failure', ac: 'Coil damage' },
    performance: { fridge: 'Gas leakage', 'washing-machine': 'Control board', ac: 'Refrigerant leak' },
    symptoms: { fridge: 'Multiple issues', 'washing-machine': 'Multiple issues', ac: 'Multiple issues' }
  };
  
  return failures[highestRisk.category]?.[type] || 'Component failure';
};

const generateRiskRecommendations = (factors, overallScore) => {
  const recommendations = [];

if (overallScore >= 75) {
    recommendations.push({
      priority: 'critical',
      action: 'Schedule immediate professional inspection',
      impact: 'Prevent catastrophic failure and expensive repairs',
      cost: { min: 500, max: 2000 }
    });
  }

factors.forEach(factor => {
    if (factor.severity === 'critical' || factor.severity === 'high') {
      const rec = getFactorRecommendation(factor);
      if (rec) recommendations.push(rec);
    }
  });

if (overallScore >= 50 && recommendations.length < 3) {
    recommendations.push({
      priority: 'medium',
      action: 'Schedule routine maintenance',
      impact: 'Extend appliance lifespan and improve efficiency',
      cost: { min: 200, max: 800 }
    });
  }
  
  return recommendations.slice(0, 5);
};

const getFactorRecommendation = (factor) => {
  const recommendations = {
    age: {
      priority: 'high',
      action: 'Consider replacement or major service',
      impact: 'Avoid unexpected breakdown',
      cost: { min: 1000, max: 5000 }
    },
    usage: {
      priority: 'medium',
      action: 'Reduce usage frequency or optimize settings',
      impact: 'Decrease wear and tear',
      cost: { min: 0, max: 0 }
    },
    maintenance: {
      priority: 'high',
      action: 'Schedule overdue maintenance service',
      impact: 'Restore optimal performance',
      cost: { min: 300, max: 1500 }
    },
    performance: {
      priority: 'high',
      action: 'Investigate performance degradation',
      impact: 'Identify and fix underlying issues',
      cost: { min: 500, max: 2000 }
    },
    symptoms: {
      priority: 'high',
      action: 'Address detected symptoms immediately',
      impact: 'Prevent issue escalation',
      cost: { min: 300, max: 1500 }
    }
  };
  
  return recommendations[factor.category];
};

module.exports = {
  calculateRiskScore,
  getRiskHistory
};
