const DesktopAgentLog = require('../models/DesktopAgentLog');
const ConnectedDevice = require('../models/ConnectedDevice');

const processLogPayload = (payload = {}) => {
  const processed = {
    cpuTemp: payload?.cpu?.temp ?? null,
    gpuTemp: payload?.gpu?.temp ?? null,
    ramUsedPct: payload?.ram && payload.ram.total > 0
      ? Math.round((payload.ram.used / payload.ram.total) * 100)
      : null,
    batteryHealth: payload?.battery?.health ?? null,
    diskHealth: (payload?.storage && payload.storage.length)
      ? (payload.storage.some((d) => d.health && d.health !== 'OK') ? 'DEGRADED' : 'OK')
      : 'OK',
    crashCount: Array.isArray(payload?.crashes) ? payload.crashes.length : 0,

fanRpm: payload?.fans && payload.fans.length
      ? payload.fans.reduce((mx, f) => Math.max(mx, f.rpm || 0), 0)
      : null,
  };

  const anomalies = [];

  if (processed.cpuTemp !== null && processed.cpuTemp >= 95) {
    anomalies.push({ type: 'cpu_overheating', severity: 'critical', message: `CPU at ${processed.cpuTemp}°C`, metric: { cpuTemp: processed.cpuTemp } });
  } else if (processed.cpuTemp !== null && processed.cpuTemp >= 85) {
    anomalies.push({ type: 'cpu_warm', severity: 'high', message: `CPU at ${processed.cpuTemp}°C`, metric: { cpuTemp: processed.cpuTemp } });
  }

  if (processed.gpuTemp !== null && processed.gpuTemp >= 95) {
    anomalies.push({ type: 'gpu_overheating', severity: 'critical', message: `GPU at ${processed.gpuTemp}°C`, metric: { gpuTemp: processed.gpuTemp } });
  }

  if (processed.ramUsedPct !== null && processed.ramUsedPct >= 95) {
    anomalies.push({ type: 'ram_pressure', severity: 'high', message: `RAM ${processed.ramUsedPct}% used`, metric: { ramUsedPct: processed.ramUsedPct } });
  } else if (processed.ramUsedPct !== null && processed.ramUsedPct >= 85) {
    anomalies.push({ type: 'ram_warm', severity: 'medium', message: `RAM ${processed.ramUsedPct}% used`, metric: { ramUsedPct: processed.ramUsedPct } });
  }

  if (processed.batteryHealth !== null && processed.batteryHealth < 60) {
    anomalies.push({ type: 'battery_critical', severity: 'high', message: `Battery health ${processed.batteryHealth}%`, metric: { batteryHealth: processed.batteryHealth } });
  } else if (processed.batteryHealth !== null && processed.batteryHealth < 80) {
    anomalies.push({ type: 'battery_degraded', severity: 'medium', message: `Battery health ${processed.batteryHealth}%`, metric: { batteryHealth: processed.batteryHealth } });
  }

  if (processed.diskHealth === 'DEGRADED') {
    anomalies.push({ type: 'disk_degraded', severity: 'high', message: 'A storage device reports non-OK SMART status', metric: {} });
  }

  if (processed.crashCount > 0) {
    anomalies.push({
      type: 'crashes_reported',
      severity: processed.crashCount >= 3 ? 'high' : 'medium',
      message: `${processed.crashCount} crash event(s) reported`,
      metric: { crashCount: processed.crashCount },
    });
  }

  return { processedHealth: processed, anomalies };
};

const ingestBatch = async (userId, { deviceId, source = 'manual', payload = {}, agentVersion = '' }) => {
  if (!deviceId || typeof deviceId !== 'string') {
    throw new Error('ingestBatch: deviceId required');
  }
  if (!userId) {
    throw new Error('ingestBatch: userId required');
  }
  const { processedHealth, anomalies } = processLogPayload(payload);
  const log = await DesktopAgentLog.create({
    user: userId,
    deviceId,
    source,
    agentVersion,
    timestamp: new Date(),
    payload,
    processedHealth,
    anomalies,
  });

try {
    await ConnectedDevice.findOneAndUpdate(
      { user: userId, deviceId },
      { $set: { lastSeen: new Date(), status: 'connected' } },
      { upsert: false }
    );
  } catch (_) {  }

  return log;
};

const getLatestHealth = async (userId, deviceId, hours = 1) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const logs = await DesktopAgentLog.find({
    user: userId,
    deviceId,
    timestamp: { $gte: since },
  }).sort({ timestamp: -1 }).lean();

  if (!logs.length) return { deviceId, count: 0, averages: {}, recent: [], anomalies: [] };

  const sum = (key) => logs.reduce((acc, l) => acc + (l.processedHealth?.[key] || 0), 0);
  const cnt = (key) => logs.filter((l) => typeof l.processedHealth?.[key] === 'number').length || 1;

  const averages = {
    cpuTemp:     Number((sum('cpuTemp')     / cnt('cpuTemp')).toFixed(1)),
    gpuTemp:     Number((sum('gpuTemp')     / cnt('gpuTemp')).toFixed(1)),
    ramUsedPct:  Number((sum('ramUsedPct')  / cnt('ramUsedPct')).toFixed(1)),
    batteryHealth: Number((sum('batteryHealth') / cnt('batteryHealth')).toFixed(1)),
    crashCount:  logs.reduce((acc, l) => acc + (l.processedHealth?.crashCount || 0), 0),
  };

  const allAnomalies = logs.flatMap((l) => (l.anomalies || []).map((a) => ({ ...a, ts: l.timestamp })));

  return {
    deviceId,
    count: logs.length,
    lastSeen: logs[0].timestamp,
    averages,
    recent: logs.slice(0, 10),
    anomalies: allAnomalies.slice(0, 25),
  };
};

const crypto = require('crypto');

const _pairCodes = new Map(); 
const PAIR_CODE_TTL_MS = 10 * 60 * 1000; 
const PAIR_CODE_MAX = 1000; 

const _purgeExpired = () => {
  const now = Date.now();
  for (const [code, entry] of _pairCodes) {
    if (entry.expiresAt <= now) _pairCodes.delete(code);
  }
};

const _evictOldestIfFull = () => {
  if (_pairCodes.size < PAIR_CODE_MAX) return;
  
  const oldest = _pairCodes.keys().next().value;
  if (oldest !== undefined) _pairCodes.delete(oldest);
};

const generatePairCode = (userId) => {
  _purgeExpired();
  _evictOldestIfFull();
  const code = crypto.randomBytes(8).toString('hex').toUpperCase().slice(0, 8);
  _pairCodes.set(code, { userId: String(userId), expiresAt: Date.now() + PAIR_CODE_TTL_MS });
  return code;
};

const consumePairCode = (code) => {
  _purgeExpired();
  const entry = _pairCodes.get(code);
  if (!entry) return null;
  _pairCodes.delete(code); 
  return entry.userId;
};

module.exports = {
  processLogPayload,
  ingestBatch,
  getLatestHealth,
  generatePairCode,
  consumePairCode,
};