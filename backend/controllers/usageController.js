const UsageLog = require('../models/UsageLog');
const Appliance = require('../models/Appliance');
const { sendSuccess, sendError, tryCatch, NotFoundError, ValidationError } = require('../utils/errorHandler');

const logUsage = tryCatch(async (req, res) => {
  const { applianceId, powerConsumption, runtime, cycles, temperature } = req.body;

  const appliance = await Appliance.findOne({
    _id: applianceId,
    user: req.user._id
  });

  if (!appliance) {
    throw new NotFoundError('Appliance not found');
  }

const numericFields = { powerConsumption, runtime, cycles, temperature };
  for (const [k, v] of Object.entries(numericFields)) {
    if (v === undefined || v === null) continue;
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) {
      throw new ValidationError(`${k} must be a finite number`);
    }
  }

  const usageLog = await UsageLog.create({
    user: req.user._id,
    appliance: applianceId,
    powerConsumption: powerConsumption ?? null,
    runtime: runtime ?? null,
    cycles: cycles || 0,
    temperature: temperature || null,
    metadata: {
      source: 'manual'
    }
  });

  sendSuccess(res, 201, usageLog, 'Usage logged successfully');
});

const getPatternAnalysis = tryCatch(async (req, res) => {
  const { applianceId } = req.params;

  const appliance = await Appliance.findOne({
    _id: applianceId,
    user: req.user._id
  });

  if (!appliance) {
    throw new NotFoundError('Appliance not found');
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const usageLogs = await UsageLog.find({
    appliance: applianceId,
    timestamp: { $gte: thirtyDaysAgo }
  }).sort({ timestamp: 1 });

  if (usageLogs.length < 7) {
    throw new ValidationError('Need at least 7 days of usage data');
  }

  const baseline = calculateBaseline(usageLogs.slice(0, 7));
  const powerPattern = analyzePowerPattern(usageLogs, baseline);
  const runtimePattern = analyzeRuntimePattern(usageLogs, baseline);
  const anomalies = detectAnomalies(usageLogs, baseline, appliance.type);
  const stats = calculateStats(usageLogs);

  const analysis = {
    patterns: {
      powerConsumption: powerPattern,
      runtime: runtimePattern,
      stats
    },
    anomalies,
    baseline
  };

  sendSuccess(res, 200, analysis, 'Pattern analysis completed');
});

const calculateBaseline = (logs) => {

const safeMean = (key) => {
    const vals = logs.map((l) => l[key]).filter((v) => Number.isFinite(v));
    if (vals.length === 0) return 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };
  const avgPower = safeMean('powerConsumption');
  const avgRuntime = safeMean('runtime');

  return {
    power: avgPower,
    runtime: avgRuntime,
    stdDev: {
      power: calculateStdDev(logs.map((l) => l.powerConsumption).filter((v) => Number.isFinite(v))),
      runtime: calculateStdDev(logs.map((l) => l.runtime).filter((v) => Number.isFinite(v)))
    }
  };
};

const calculateStdDev = (values) => {

if (values.length < 2) return 0;
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map((val) => Math.pow(val - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
};

const analyzePowerPattern = (logs, baseline) => {
  const labels = logs.map((_, i) => `Day ${i + 1}`);
  const data = logs.map((log) => log.powerConsumption);
  const current = logs[logs.length - 1]?.powerConsumption || baseline.power;

  return {
    labels: labels.slice(-30),
    data: data.slice(-30),
    baseline: Number.isFinite(baseline.power) ? baseline.power.toFixed(2) : '0.00',
    current: Number.isFinite(current) ? current.toFixed(2) : '0.00'
  };
};

const analyzeRuntimePattern = (logs, baseline) => {
  const labels = logs.map((_, i) => `Day ${i + 1}`);
  const data = logs.map((log) => log.runtime);

  return {
    labels: labels.slice(-30),
    data: data.slice(-30)
  };
};

const detectAnomalies = (logs, baseline, applianceType) => {
  const anomalies = [];
  const threshold = 2;

const safeZ = (val, mean, std) => {
    if (!Number.isFinite(val) || !Number.isFinite(mean) || !Number.isFinite(std) || std <= 0) return 0;
    return Math.abs(val - mean) / std;
  };

  logs.forEach((log) => {
    const powerDeviation = safeZ(log.powerConsumption, baseline.power, baseline.stdDev.power);

    if (powerDeviation > threshold) {
      const increasePct = baseline.power > 0
        ? ((log.powerConsumption / baseline.power - 1) * 100)
        : 0;
      const increase = Number.isFinite(increasePct) ? increasePct.toFixed(0) : '0';
      anomalies.push({
        type: 'High Power Consumption',
        severity: powerDeviation > 3 ? 'critical' : 'high',
        description: `Power consumption is ${increase}% higher than normal`,
        detectedDate: log.timestamp.toISOString().split('T')[0],
        deviation: increase,
        possibleIssue: getPowerIssue(applianceType, increase),
        metric: 'power',
        value: log.powerConsumption
      });
    }

    const runtimeDeviation = safeZ(log.runtime, baseline.runtime, baseline.stdDev.runtime);

    if (runtimeDeviation > threshold) {
      const changePct = baseline.runtime > 0
        ? ((log.runtime / baseline.runtime - 1) * 100)
        : 0;
      const change = Number.isFinite(changePct) ? changePct.toFixed(0) : '0';
      anomalies.push({
        type: 'Abnormal Runtime',
        severity: runtimeDeviation > 3 ? 'high' : 'medium',
        description: `Runtime is ${change}% different from normal`,
        detectedDate: log.timestamp.toISOString().split('T')[0],
        deviation: change,
        possibleIssue: getRuntimeIssue(applianceType, log.runtime > baseline.runtime),
        metric: 'runtime',
        value: log.runtime
      });
    }
  });

  return anomalies.slice(0, 10);
};

const getPowerIssue = (type, increase) => {
  const issues = {
    fridge: `Compressor overworking (${increase}% increase) - Possible refrigerant leak or thermostat failure`,
    'washing-machine': `Motor strain (${increase}% increase) - Possible bearing wear or unbalanced load`,
    ac: `Compressor overload (${increase}% increase) - Possible refrigerant leak or dirty coils`
  };
  return issues[type] || `Abnormal power consumption detected (${increase}% increase)`;
};

const getRuntimeIssue = (type, isHigh) => {
  const issues = {
    fridge: isHigh 
      ? 'Compressor running continuously - Thermostat failure or gas leak'
      : 'Compressor not running enough - Compressor failure',
    'washing-machine': isHigh
      ? 'Extended cycle time - Motor or pump issue'
      : 'Incomplete cycles - Control board issue',
    ac: isHigh
      ? 'Continuous operation - Thermostat issue'
      : 'Short cycling - Compressor issue'
  };
  return issues[type] || 'Abnormal runtime pattern detected';
};

const calculateStats = (logs) => {

const safeAvg = (key) => {
    const vals = logs.map((l) => l[key]).filter((v) => Number.isFinite(v));
    if (vals.length === 0) return 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };
  const avgPowerNum = safeAvg('powerConsumption');
  const avgRuntimeNum = safeAvg('runtime');
  const avgCycles = Math.round(safeAvg('cycles'));
  const avgPower = avgPowerNum.toFixed(2);
  const avgRuntime = avgRuntimeNum.toFixed(1);

const baselineVals = logs.slice(0, Math.min(7, logs.length))
    .map((l) => l.powerConsumption)
    .filter((v) => Number.isFinite(v));
  const baselinePower = baselineVals.length
    ? baselineVals.reduce((s, v) => s + v, 0) / baselineVals.length
    : 0;
  const currentPower = avgPowerNum;
  let efficiency = 75;
  if (baselinePower > 0 && Number.isFinite(currentPower)) {
    efficiency = Math.round(95 - (currentPower / baselinePower) * 20);
    if (efficiency < 50) efficiency = 50;
    if (efficiency > 95) efficiency = 95;
  }

  return {
    avgPower,
    avgRuntime,
    cycles: avgCycles,
    efficiency,
  };
};

module.exports = {
  logUsage,
  getPatternAnalysis
};
