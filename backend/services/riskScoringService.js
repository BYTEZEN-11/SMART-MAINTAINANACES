

const HEALTH_WEIGHT = 0.5;
const ANOMALY_WEIGHT = 0.25;
const SERVICE_WEIGHT = 0.15;
const VOLATILITY_WEIGHT = 0.1;

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

const healthToRisk = (healthScore) => {
  if (typeof healthScore !== "number" || !Number.isFinite(healthScore)) return 50;
  return clamp(100 - healthScore);
};

const anomalyFactor = (count, windowDays = 30) => {
  if (typeof count !== "number" || count <= 0) return 0;
  
  return clamp((count / 10) * 100, 0, 100);
};

const serviceFactor = (lastServiceDate, expectedIntervalDays = 180) => {
  if (!lastServiceDate) return 50;
  const d = new Date(lastServiceDate);
  if (Number.isNaN(d.getTime())) return 50;
  const ageDays = (Date.now() - d.getTime()) / 86_400_000;
  if (ageDays < 0) return 0;
  return clamp((ageDays / expectedIntervalDays) * 100);
};

const volatilityFactor = (values = []) => {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const clean = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (clean.length < 2) return 0;
  const mean = clean.reduce((s, v) => s + v, 0) / clean.length;
  const variance = clean.reduce((s, v) => s + (v - mean) ** 2, 0) / clean.length;
  const stddev = Math.sqrt(variance);

return clamp((stddev / 20) * 100);
};

const calculateRiskScore = (input = {}) => {
  const components = {
    health:      healthToRisk(input.healthScore),
    anomalies:   anomalyFactor(input.anomalyCount30d),
    serviceAge:  serviceFactor(input.lastServiceDate),
    volatility:  volatilityFactor(input.sensorValues),
  };
  const score = clamp(
    components.health     * HEALTH_WEIGHT     +
    components.anomalies  * ANOMALY_WEIGHT    +
    components.serviceAge * SERVICE_WEIGHT    +
    components.volatility * VOLATILITY_WEIGHT
  );

  let level = "low";
  if (score >= 80) level = "critical";
  else if (score >= 60) level = "high";
  else if (score >= 35) level = "medium";

  return {
    score: Math.round(score),
    level,
    components: Object.fromEntries(
      Object.entries(components).map(([k, v]) => [k, Math.round(v)])
    ),
    computedAt: new Date().toISOString(),
  };
};

const worstComponentRisk = (components = []) => {
  if (!Array.isArray(components) || components.length === 0) return null;
  let worst = null;
  for (const c of components) {
    const h = typeof c.health === "number" ? c.health : 100;
    const risk = 100 - h;
    if (!worst || risk > worst.risk) {
      worst = { name: c.name || "Component", health: h, risk };
    }
  }
  return worst;
};

module.exports = {
  calculateRiskScore,
  worstComponentRisk,
};
