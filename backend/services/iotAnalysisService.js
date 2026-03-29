

const SensorReading = require('../models/SensorReading');

const toLegacyShape = (r) => {
  if (!r) return null;
  return {
    power: (r.power || r.current || r.voltage)
      ? {
          consumption: r.power,
          voltage: r.voltage,
          current: r.current,
          frequency: r.frequency,
        }
      : undefined,
    temperature: (r.temperature != null) ? { value: r.temperature } : undefined,
    vibration: (r.vibration != null) ? { magnitude: r.vibration } : undefined,
    gas: (r.gas != null) ? { type: 'CO', concentration: r.gas, threshold: 50, alert: r.gas > 50 } : undefined,
    rawAnomalies: r.anomalies,
  };
};

const analyzeIoTData = async (sensorData, device) => {
  const anomalies = [];
  const metrics = {
    efficiency: 100,
    performanceScore: 100,
    anomalyScore: 0,
    healthScore: 100
  };

  const { readings } = sensorData;

const baseline = await getBaseline(device._id);

if (readings.power) {
    const powerAnomalies = analyzePower(readings.power, baseline.power, device);
    anomalies.push(...powerAnomalies);
  }

if (readings.temperature) {
    const tempAnomalies = analyzeTemperature(readings.temperature, baseline.temperature, device);
    anomalies.push(...tempAnomalies);
  }

if (readings.vibration) {
    const vibrationAnomalies = analyzeVibration(readings.vibration, baseline.vibration, device);
    anomalies.push(...vibrationAnomalies);
  }

if (readings.gas) {
    const gasAnomalies = analyzeGas(readings.gas, device);
    anomalies.push(...gasAnomalies);
  }

if (readings.smartPlug) {
    const plugAnomalies = analyzeSmartPlug(readings.smartPlug, baseline.smartPlug, device);
    anomalies.push(...plugAnomalies);
  }

if (readings.status) {
    const statusAnomalies = analyzeStatus(readings.status, device);
    anomalies.push(...statusAnomalies);
  }

if (anomalies.length > 0) {
    metrics.anomalyScore = Math.min(100, anomalies.length * 15);
    metrics.healthScore = Math.max(0, 100 - metrics.anomalyScore);

    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    const highCount = anomalies.filter(a => a.severity === 'high').length;

    metrics.performanceScore = Math.max(0, 100 - (criticalCount * 30 + highCount * 15));
  }

  return { anomalies, metrics };
};

const getBaseline = async (deviceId) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const rows = await SensorReading.find({

$or: [{ deviceId: String(deviceId) }, { deviceId: deviceId?.toString?.() }],
    timestamp: { $gte: sevenDaysAgo },
    'anomalies.0': { $exists: false },
  })
    .sort({ timestamp: -1 })
    .limit(100);

  if (rows.length < 5) {
    return {
      power: { consumption: 0, voltage: 220, current: 0 },
      temperature: { value: 25 },
      vibration: { magnitude: 0 },
      smartPlug: { totalEnergy: 0 }
    };
  }

const historicalData = rows.map(toLegacyShape);

  if (historicalData.length < 5) {
    return {
      power: { consumption: 0, voltage: 220, current: 0 },
      temperature: { value: 25 },
      vibration: { magnitude: 0 },
      smartPlug: { totalEnergy: 0 }
    };
  }

const baseline = {
    power: { consumption: 0, voltage: 0, current: 0 },
    temperature: { value: 0 },
    vibration: { magnitude: 0 },
    smartPlug: { totalEnergy: 0 }
  };

  let powerCount = 0, tempCount = 0, vibCount = 0, plugCount = 0;

  historicalData.forEach(data => {
    if (data.readings.power && data.readings.power.consumption) {
      baseline.power.consumption += data.readings.power.consumption;
      baseline.power.voltage += data.readings.power.voltage || 220;
      baseline.power.current += data.readings.power.current || 0;
      powerCount++;
    }
    if (data.readings.temperature && data.readings.temperature.value) {
      baseline.temperature.value += data.readings.temperature.value;
      tempCount++;
    }
    if (data.readings.vibration && data.readings.vibration.magnitude) {
      baseline.vibration.magnitude += data.readings.vibration.magnitude;
      vibCount++;
    }
    if (data.readings.smartPlug && data.readings.smartPlug.totalEnergy) {
      baseline.smartPlug.totalEnergy += data.readings.smartPlug.totalEnergy;
      plugCount++;
    }
  });

  if (powerCount > 0) {
    baseline.power.consumption /= powerCount;
    baseline.power.voltage /= powerCount;
    baseline.power.current /= powerCount;
  }
  if (tempCount > 0) baseline.temperature.value /= tempCount;
  if (vibCount > 0) baseline.vibration.magnitude /= vibCount;
  if (plugCount > 0) baseline.smartPlug.totalEnergy /= plugCount;

  return baseline;
};

const analyzePower = (power, baseline, device) => {
  const anomalies = [];

  if (!power.consumption) return anomalies;

  const baselinePower = baseline.consumption || 100;
  const deviation = ((power.consumption - baselinePower) / baselinePower) * 100;

if (deviation > 50) {
    anomalies.push({
      type: 'High Power Consumption',
      severity: deviation > 100 ? 'critical' : 'high',
      description: `Power consumption is ${Math.round(deviation)}% higher than normal (${power.consumption}W vs ${baselinePower.toFixed(0)}W baseline)`,
      detectedAt: new Date(),
      details: {
        issue: 'Abnormal power consumption detected',
        possibleCause: getPowerIssueCause(device.deviceType, deviation),
        recommendation: 'Inspect device for malfunctioning components. Check compressor, motor, or heating elements.',
        estimatedCost: { min: 500, max: 3000 }
      }
    });
  }

if (power.voltage && (power.voltage < 200 || power.voltage > 240)) {
    anomalies.push({
      type: 'Voltage Anomaly',
      severity: power.voltage < 180 || power.voltage > 250 ? 'critical' : 'medium',
      description: `Voltage is ${power.voltage}V (normal range: 200-240V)`,
      detectedAt: new Date(),
      details: {
        issue: 'Abnormal voltage detected',
        possibleCause: 'Power supply issue or electrical fault',
        recommendation: 'Check electrical connections and power supply. May need voltage stabilizer.',
        estimatedCost: { min: 200, max: 1000 }
      }
    });
  }

if (power.current && baseline.current && power.current > baseline.current * 1.5) {
    anomalies.push({
      type: 'Current Spike',
      severity: 'high',
      description: `Current draw is ${power.current.toFixed(2)}A (${Math.round((power.current / baseline.current - 1) * 100)}% above normal)`,
      detectedAt: new Date(),
      details: {
        issue: 'Excessive current draw',
        possibleCause: 'Motor overload, short circuit, or component failure',
        recommendation: 'Immediate inspection required. Disconnect device if overheating.',
        estimatedCost: { min: 800, max: 2500 }
      }
    });
  }

  return anomalies;
};

const analyzeTemperature = (temperature, baseline, device) => {
  const anomalies = [];

  if (!temperature.value) return anomalies;

  const baselineTemp = baseline.value || 25;
  const tempDiff = temperature.value - baselineTemp;

if (temperature.value > 70) {
    anomalies.push({
      type: 'Overheating Detected',
      severity: temperature.value > 85 ? 'critical' : 'high',
      description: `Temperature is ${temperature.value}°C (${tempDiff > 0 ? '+' : ''}${tempDiff.toFixed(1)}°C from baseline)`,
      detectedAt: new Date(),
      details: {
        issue: 'Device overheating',
        possibleCause: getTemperatureIssueCause(device.deviceType, temperature.value),
        recommendation: 'Stop using device immediately. Check ventilation, clean filters, inspect cooling system.',
        estimatedCost: { min: 500, max: 2000 }
      }
    });
  } else if (tempDiff > 15) {
    anomalies.push({
      type: 'Temperature Increase',
      severity: 'medium',
      description: `Temperature increased by ${tempDiff.toFixed(1)}°C (now ${temperature.value}°C)`,
      detectedAt: new Date(),
      details: {
        issue: 'Abnormal temperature rise',
        possibleCause: 'Reduced cooling efficiency or increased load',
        recommendation: 'Clean air filters and vents. Check for blockages.',
        estimatedCost: { min: 200, max: 800 }
      }
    });
  }

const applianceType = (device?.appliance && device.appliance.type) || device?.applianceType;
  const isCoolingAppliance = ['refrigerator', 'fridge', 'freezer', 'ac', 'air-conditioner'].includes(applianceType);
  if (isCoolingAppliance && temperature.value > 10) {
    anomalies.push({
      type: 'Cooling Failure',
      severity: 'critical',
      description: `${applianceType} temperature is ${temperature.value}°C (should be below 5°C)`,
      detectedAt: new Date(),
      details: {
        issue: `${applianceType} not cooling properly`,
        possibleCause: 'Compressor failure, refrigerant leak, or thermostat malfunction',
        recommendation: 'Immediate service required. Food safety at risk.',
        estimatedCost: { min: 1500, max: 5000 }
      }
    });
  }

  return anomalies;
};

const analyzeVibration = (vibration, baseline, device) => {
  const anomalies = [];

  if (!vibration.magnitude) return anomalies;

  const baselineVib = baseline.magnitude || 1;
  const vibRatio = vibration.magnitude / baselineVib;

  if (vibration.magnitude > 5 || vibRatio > 2) {
    anomalies.push({
      type: 'Excessive Vibration',
      severity: vibration.magnitude > 10 ? 'critical' : 'high',
      description: `Vibration magnitude is ${vibration.magnitude.toFixed(2)} (${Math.round((vibRatio - 1) * 100)}% above normal)`,
      detectedAt: new Date(),
      details: {
        issue: 'Abnormal vibration detected',
        possibleCause: getVibrationIssueCause(device.deviceType),
        recommendation: 'Check for loose parts, unbalanced load, or bearing wear. Stop using if vibration is severe.',
        estimatedCost: { min: 400, max: 1800 }
      }
    });
  }

  return anomalies;
};

const analyzeGas = (gas, device) => {
  const anomalies = [];

  if (!gas.concentration) return anomalies;

  if (gas.alert || gas.concentration > gas.threshold) {
    anomalies.push({
      type: `${gas.type.toUpperCase()} Gas Detected`,
      severity: 'critical',
      description: `${gas.type} concentration is ${gas.concentration} ppm (threshold: ${gas.threshold} ppm)`,
      detectedAt: new Date(),
      details: {
        issue: `Dangerous ${gas.type} gas leak detected`,
        possibleCause: 'Gas leak, incomplete combustion, or ventilation failure',
        recommendation: 'EVACUATE IMMEDIATELY. Turn off gas supply. Call emergency services. Do not use electrical switches.',
        estimatedCost: { min: 1000, max: 5000 }
      }
    });
  }

  return anomalies;
};

const analyzeSmartPlug = (smartPlug, baseline, device) => {
  const anomalies = [];

  if (!smartPlug.totalEnergy) return anomalies;

  const baselineEnergy = baseline.totalEnergy || smartPlug.totalEnergy;
  const energyIncrease = smartPlug.todayEnergy || 0;

if (energyIncrease > baselineEnergy * 1.5) {
    anomalies.push({
      type: 'High Energy Consumption',
      severity: 'medium',
      description: `Today's energy consumption is ${energyIncrease.toFixed(2)} kWh (${Math.round((energyIncrease / baselineEnergy - 1) * 100)}% above average)`,
      detectedAt: new Date(),
      details: {
        issue: 'Abnormal energy usage pattern',
        possibleCause: 'Device running inefficiently or continuously',
        recommendation: 'Check device operation. May need maintenance or repair.',
        estimatedCost: { min: 300, max: 1500 }
      }
    });
  }

if (smartPlug.isOn && energyIncrease > 10) {
    anomalies.push({
      type: 'Device Running Continuously',
      severity: 'low',
      description: `Device has been on continuously, consuming ${energyIncrease.toFixed(2)} kWh today`,
      detectedAt: new Date(),
      details: {
        issue: 'Device not turning off',
        possibleCause: 'Thermostat issue, control failure, or user error',
        recommendation: 'Check if device should be running. Inspect auto-off features.',
        estimatedCost: { min: 100, max: 500 }
      }
    });
  }

  return anomalies;
};

const analyzeStatus = (status, device) => {
  const anomalies = [];

  if (status.errorCode) {
    anomalies.push({
      type: 'Device Error',
      severity: 'high',
      description: `Device reported error code: ${status.errorCode}`,
      detectedAt: new Date(),
      details: {
        issue: `Error code ${status.errorCode}`,
        possibleCause: 'Device malfunction or component failure',
        recommendation: 'Refer to device manual for error code. May need professional service.',
        estimatedCost: { min: 500, max: 2000 }
      }
    });
  }

  if (status.state === 'error') {
    anomalies.push({
      type: 'Device in Error State',
      severity: 'high',
      description: 'Device has entered error state',
      detectedAt: new Date(),
      details: {
        issue: 'Device malfunction',
        possibleCause: 'System error or component failure',
        recommendation: 'Restart device. If error persists, contact technician.',
        estimatedCost: { min: 300, max: 1500 }
      }
    });
  }

  return anomalies;
};

const getPowerIssueCause = (deviceType, deviation) => {
  const causes = {
    wifi:        `Compressor overworking (${Math.round(deviation)}% increase) - Possible refrigerant leak, dirty coils, or thermostat failure`,
    bluetooth:   `BLE radio power draw abnormal (${Math.round(deviation)}% increase) - Possible firmware bug or weak battery`,
    smart_plug:  `Motor strain or heating element issue (${Math.round(deviation)}% increase) - Component wear or malfunction`,
    sensor:      `Abnormal power draw detected (${Math.round(deviation)}% increase)`,
  };
  return causes[deviceType] || `Power consumption ${Math.round(deviation)}% above normal - Component inefficiency or failure`;
};

const getTemperatureIssueCause = (deviceType, temp) => {
  if (temp > 85) return 'Critical overheating - Cooling system failure, blocked vents, or motor overload';
  if (temp > 70) return 'Overheating - Reduced cooling efficiency, dirty filters, or ambient temperature too high';
  return 'Temperature elevated - Check ventilation and cooling system';
};

const getVibrationIssueCause = (deviceType) => {
  const causes = {
    wifi:       'Compressor mounting loose, refrigerant flow issue, or internal component failure',
    bluetooth:  'Sensor housing loose or impact damage - re-seat and verify mounting',
    smart_plug: 'Motor bearing wear, unbalanced drum/fan, or loose mounting',
    sensor:     'Mechanical component wear or mounting issue',
  };
  return causes[deviceType] || 'Bearing wear, unbalanced load, or loose components';
};

module.exports = {
  analyzeIoTData,
  getBaseline
};
