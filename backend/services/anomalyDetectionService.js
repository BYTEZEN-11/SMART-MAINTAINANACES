

const DEFAULT_RANGES = {
  temperature: { min: -20, max: 90,    unit: "°C" },
  humidity:    { min: 0,   max: 100,   unit: "%" },
  vibration:   { min: 0,   max: 50,    unit: "mm/s" },
  power:       { min: 0,   max: 5000,  unit: "W" },
  voltage:     { min: 90,  max: 270,   unit: "V" },
  current:     { min: 0,   max: 50,    unit: "A" },
};

const safeNumber = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
};

const classifyReading = (metric, value) => {
  const v = safeNumber(value);
  if (v === null) return { isAnomaly: false };
  const range = DEFAULT_RANGES[metric];
  if (!range) return { isAnomaly: false };
  if (v < range.min) {
    return {
      isAnomaly: true,
      severity: "warn",
      reason: `${metric} (${v}${range.unit}) below minimum ${range.min}${range.unit}`,
    };
  }
  if (v > range.max) {
    return {
      isAnomaly: true,
      severity: "critical",
      reason: `${metric} (${v}${range.unit}) above maximum ${range.max}${range.unit}`,
    };
  }
  return { isAnomaly: false };
};

const classifyPayload = (payload = {}) => {
  const anomalies = [];
  const readings = [];
  if (!payload || typeof payload !== "object") {
    return { anomalies, readings };
  }
  for (const [metric, raw] of Object.entries(payload)) {
    const v = safeNumber(raw);
    if (v === null) continue;
    readings.push({ metric, value: v });
    const result = classifyReading(metric, v);
    if (result.isAnomaly) {
      anomalies.push({
        metric,
        value: v,
        severity: result.severity,
        reason: result.reason,
      });
    }
  }
  return { anomalies, readings };
};

const zScore = (values = []) => {
  const clean = values.map(safeNumber).filter((v) => v !== null);
  if (clean.length < 2) return 0;
  const mean = clean.reduce((s, v) => s + v, 0) / clean.length;
  const variance = clean.reduce((s, v) => s + (v - mean) ** 2, 0) / clean.length;
  const stddev = Math.sqrt(variance);
  if (stddev === 0) return 0;
  return Math.abs((clean[clean.length - 1] - mean) / stddev);
};

module.exports = {
  DEFAULT_RANGES,
  classifyReading,
  classifyPayload,
  zScore,
};
