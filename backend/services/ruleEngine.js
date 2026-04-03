

const fs = require('fs');
const path = require('path');
const Rule = require('../models/Rule');

const SEVERITY_RANK = { Low: 1, Medium: 2, High: 3, Critical: 4 };

const normSeverity = (s) => {
  if (!s) return null;
  const lower = String(s).toLowerCase();
  if (lower === 'critical' || lower === 'crit') return 'Critical';
  if (lower === 'high') return 'High';
  if (lower === 'medium' || lower === 'med') return 'Medium';
  if (lower === 'low') return 'Low';
  return null;
};

const compare = (a, op, b) => {
  switch (op) {
    case 'eq':       return a === b;
    case 'neq':      return a !== b;
    case 'gt':       return Number(a) >  Number(b);
    case 'gte':      return Number(a) >= Number(b);
    case 'lt':       return Number(a) <  Number(b);
    case 'lte':      return Number(a) <= Number(b);
    case 'in':       return Array.isArray(b) && b.includes(a);
    case 'includes': return Array.isArray(a) && a.includes(b);
    case 'exists':   return a !== undefined && a !== null;
    default:         return false;
  }
};

const evalCondition = (rule, evidence) => {
  const { condition = {} } = rule;
  const all = condition.all || [];
  const any = condition.any || [];
  
  const allPass = all.length === 0 ? true : all.every((c) => compare(evidence[c.field], c.op, c.value));
  if (!allPass) return false;
  if (any.length === 0) return true;
  return any.some((c) => compare(evidence[c.field], c.op, c.value));
};

const EVIDENCE_TOKEN_MAP = {
  power_on: {
    phrases: ['power on', 'has power', 'plugged in', 'receiving power', 'turned on'],
    tokens:  ['powered'],
  },
  no_cooling: {
    phrases: ['no cooling', 'not cooling', 'cooling lost', 'not cold', 'warm inside', 'not getting cold', 'not getting cooler', 'no chill'],
    tokens:  ['uncooled'],
  },
  overheating: {
    phrases: ['overheating', 'overheated', 'too hot', 'very hot'],
    tokens:  ['overheats'],
  },
  temp_high: {
    phrases: ['room hot', 'high temperature', 'temp high', 'not cooling enough', 'too warm'],
    tokens:  ['hotter'],
  },
  fan_not_running: {
    phrases: ['fan not running', 'fan silent', 'fan stopped', 'no air', 'fan dead', 'fan not spinning'],
    tokens:  ['fanless'],
  },
  noise_hissing: {
    phrases: ['hissing noise', 'leaking sound', 'refrigerant leak', 'gas hissing'],
    tokens:  ['hiss', 'hisses', 'hissing'],
  },
  noise_grinding: {
    phrases: ['grinding noise', 'loud grinding', 'scraping sound'],
    tokens:  ['grind', 'grinding', 'rattle', 'rattles', 'scraping'],
  },
  water_leak: {
    phrases: ['water leak', 'leaking water', 'water dripping', 'puddle of water', 'condensate dripping', 'leaking from'],
    tokens:  ['leak', 'leaking', 'dripping'],
  },
  battery_low: {
    phrases: ['battery low', 'low charge', 'battery drains', 'drains fast', 'low battery', 'battery dies', "wont hold charge", "won't hold charge"],
    tokens:  ['drains'],
  },
  charging_connected: {
    phrases: ['charger plugged', 'charging connected'],
    tokens:  ['charging'],
  },
  vibration_high: {
    phrases: ['excessive vibration', 'vibrating heavily', 'shaking violently'],
    tokens:  ['vibrating', 'vibration', 'vibrates', 'shaking', 'shakes'],
  },
  gas_present: {
    phrases: ['gas leak', 'gas detected', 'smoke detected', 'gas smell', 'smell of gas', 'gas sensor tripped'],
    tokens:  ['gas', 'smoke'],
  },
  storage_failing: {
    phrases: ['disk failure', 'storage failing', 'smart failing', 'io error', 'bad sectors', 'disk unhealthy'],
    tokens:  ['sector', 'sectors'],
  },
  ram_pressure: {
    phrases: ['out of memory', 'memory full', 'memory pressure', 'swap thrashing'],
    tokens:  ['oom'],
  },
};

const TOKEN_RE_CACHE = new Map();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tokenRe = (word) => {
  let re = TOKEN_RE_CACHE.get(word);
  if (!re) {
    re = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
    TOKEN_RE_CACHE.set(word, re);
  }
  return re;
};

const matchesAny = (haystack, entry) => {
  if (!entry) return false;
  for (const phrase of entry.phrases) if (haystack.includes(phrase)) return true;
  for (const tok of entry.tokens) if (tokenRe(tok).test(haystack)) return true;
  return false;
};

const synthEvidence = (analysis = {}, ctx = {}) => {
  const evidence = {};

  const textBits = [
    analysis.issue || '',
    analysis.rootCause || '',
    analysis.summary || '',
    analysis.description || '',
    ctx.issue || '',
    ctx.userText || '',
    ctx.description || '',
    ctx.soundDescription || '',
    ctx.deviceName || '',
  ];
  const text = textBits.join(' ').toLowerCase();

  for (const [flag, entry] of Object.entries(EVIDENCE_TOKEN_MAP)) {
    if (matchesAny(text, entry)) evidence[flag] = true;
  }

if (Array.isArray(analysis.probable_causes)) {
    const aiText = analysis.probable_causes.join(' ').toLowerCase();
    if (aiText) {
      if (aiText.includes('gas') || aiText.includes('smoke')) evidence.gas_present = true;
      if (aiText.includes('leak') || aiText.includes('drip')) evidence.water_leak = true;
    }
  }

const sensor = ctx.sensorData || {};
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  if (num(sensor.cpuTemp) !== null && sensor.cpuTemp >= 90) evidence.overheating = true;
  if (num(sensor.gpuTemp) !== null && sensor.gpuTemp >= 90) evidence.overheating = true;
  if (num(sensor.batteryTemp) !== null && sensor.batteryTemp >= 45) evidence.overheating = true;
  if (num(sensor.ramUsedPct) !== null && sensor.ramUsedPct >= 90) evidence.ram_pressure = true;
  if (num(sensor.batteryHealth) !== null && sensor.batteryHealth < 80) evidence.battery_low = true;
  if (typeof sensor.diskHealth === 'string' && sensor.diskHealth !== 'OK') evidence.storage_failing = true;
  if (num(sensor.gasPpm) !== null && sensor.gasPpm > 50) evidence.gas_present = true;
  if (num(sensor.vibrationMag) !== null && sensor.vibrationMag > 5) evidence.vibration_high = true;
  if (num(sensor.tempC) !== null && sensor.tempC > 60) evidence.overheating = true;
  
  if (num(sensor.current) !== null && sensor.current < 0.1) evidence.fan_not_running = true;

  return evidence;
};

let _initialized = false;

const initRuleEngine = async () => {
  if (_initialized) return { ok: true, count: 0, skipped: true };
  const file = path.join(__dirname, '..', 'data', 'rules.json');
  if (!fs.existsSync(file)) {
    _initialized = true;
    return { ok: true, count: 0, skipped: true, reason: 'rules.json missing' };
  }
  const rules = JSON.parse(fs.readFileSync(file, 'utf8'));
  const ops = rules.map((r) => ({
    updateOne: {
      filter: { id: r.id },
      update: { $set: r },
      upsert: true,
    },
  }));
  let res;
  try {
    res = await Rule.bulkWrite(ops, { ordered: false });
  } catch (e) {
    
    console.warn('[ruleEngine] bulkWrite warning:', e.message);
    _initialized = true;
    return { ok: true, count: 0, skipped: true };
  }
  _initialized = true;
  return {
    ok: true,
    count: rules.length,
    upserted: res.upsertedCount || 0,
    modified: res.modifiedCount || 0,
  };
};

const getActiveRules = async (deviceType) => {
  const filter = { enabled: true };
  if (deviceType) filter.deviceType = deviceType;
  return Rule.find(filter).sort({ weight: -1, id: 1 }).lean();
};

const fireCounts = async (deviceType) => {
  const match = deviceType ? { deviceType } : {};
  const rows = await Rule.aggregate([
    { $match: match },
    { $group: { _id: '$deviceType', total: { $sum: 1 }, fires: { $sum: '$fireCount' } } },
  ]);
  const out = {};
  rows.forEach((r) => { out[r._id] = { total: r.total, fires: r.fires }; });
  return out;
};

const evaluateRules = async ({ deviceType, evidence = {}, analysis = null }) => {
  const rules = await getActiveRules(deviceType);
  const fired = [];
  const trace = [];

  for (const r of rules) {
    const hit = evalCondition(r, evidence);
    trace.push({
      id: r.id,
      deviceType: r.deviceType,
      name: r.name,
      matched: hit,
      action: r.action,
      weight: r.weight,
      conditionText: renderCondition(r.condition),
    });
    if (hit) fired.push(r);
  }

  let adjustedSeverity = analysis ? normSeverity(analysis.severity) : null;
  let confidenceDelta = 0;
  const issues = [];
  const solutions = [];
  const recommendations = [];

  for (const r of fired) {
    if (r.action.severity) {
      const sev = normSeverity(r.action.severity);
      if (sev && (!adjustedSeverity || SEVERITY_RANK[sev] > SEVERITY_RANK[adjustedSeverity])) {
        adjustedSeverity = sev;
      }
    }
    confidenceDelta += Number(r.action.confidenceDelta || 0);
    if (r.action.issue) issues.push(r.action.issue);
    if (r.action.solution) solutions.push(r.action.solution);
    if (r.action.recommendation) recommendations.push(r.action.recommendation);
  }

if (fired.length) {
    Rule.updateMany(
      { _id: { $in: fired.map((f) => f._id) } },
      { $inc: { fireCount: 1 }, $set: { lastFiredAt: new Date() } }
    ).catch(() => {});
  }

  return {
    fired: fired.map((f) => ({
      id: f.id,
      name: f.name,
      deviceType: f.deviceType,
      weight: f.weight,
      action: f.action,
    })),
    adjusted: {
      severity: adjustedSeverity,
      confidenceDelta,
    },
    issues,
    solutions,
    recommendations,
    trace,
  };
};

const applyRules = async (analysis, ctx = {}) => {
  if (!analysis) return analysis;
  try {
    await initRuleEngine();
    const evidence = synthEvidence(analysis, ctx);
    const result = await evaluateRules({
      deviceType: ctx.deviceType || analysis.deviceType,
      evidence,
      analysis,
    });

analysis.ruleTrace = result.trace;
    analysis.matchedRules = result.fired.map((f) => f.id);
    analysis.evidence = evidence;

    if (result.adjusted.severity) {
      analysis.severity = result.adjusted.severity;
    }
    if (result.issues.length) {
      analysis.issue = analysis.issue
        ? `${analysis.issue}; ${result.issues.join('; ')}`
        : result.issues.join('; ');
    }
    if (result.solutions.length) {
      analysis.solution = analysis.solution
        ? `${analysis.solution} ${result.solutions.join(' ')}`
        : result.solutions.join(' ');
    }
    if (result.recommendations.length) {
      analysis.recommendations = Array.isArray(analysis.recommendations)
        ? [...analysis.recommendations, ...result.recommendations]
        : result.recommendations;
    }
    if (result.adjusted.confidenceDelta) {
      const base = Number(analysis.confidence || 70);
      analysis.confidence = Math.max(0, Math.min(100, base + result.adjusted.confidenceDelta));
    }
  } catch (e) {
    
    console.warn('[ruleEngine] applyRules failed:', e.message);
  }
  return analysis;
};

const renderCondition = (condition = {}) => {
  const parts = [];
  const fmt = (c) => {
    const v = typeof c.value === 'string' ? `'${c.value}'` : JSON.stringify(c.value);
    return `${c.field} ${c.op} ${v}`;
  };
  if (Array.isArray(condition.all) && condition.all.length) {
    parts.push(condition.all.map(fmt).join(' AND '));
  }
  if (Array.isArray(condition.any) && condition.any.length) {
    parts.push(condition.any.map(fmt).join(' OR '));
  }
  return parts.length ? parts.join(' AND ') : '(always fires)';
};

module.exports = {
  initRuleEngine,
  getActiveRules,
  evaluateRules,
  applyRules,
  synthEvidence,
  normSeverity,
  renderCondition,
};