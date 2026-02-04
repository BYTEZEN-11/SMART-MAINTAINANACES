const ruleEngine = require('../services/ruleEngine');
const { sendSuccess, sendError, tryCatch, ValidationError } = require('../utils/errorHandler');

const MAX_DEVICE_TYPE_LEN = 64;
const MAX_EVIDENCE_KEYS = 200;
const MAX_EVIDENCE_VALUE = 4000;

exports.getActiveRules = tryCatch(async (req, res) => {
  await ruleEngine.initRuleEngine();
  const deviceType = typeof req.query.deviceType === 'string'
    ? req.query.deviceType.slice(0, MAX_DEVICE_TYPE_LEN)
    : undefined;
  const rules = await ruleEngine.getActiveRules(deviceType);
  return sendSuccess(res, 200, rules, 'Active rules');
});

exports.evaluateRules = tryCatch(async (req, res) => {
  await ruleEngine.initRuleEngine();
  const { deviceType, evidence: rawEvidence = {}, analysis = null } = req.body;
  if (!deviceType || typeof deviceType !== 'string') {
    throw new ValidationError('deviceType is required');
  }
  if (deviceType.length > MAX_DEVICE_TYPE_LEN) {
    throw new ValidationError(`deviceType must be <= ${MAX_DEVICE_TYPE_LEN} chars`);
  }

const evidence = {};
  const keys = Object.keys(rawEvidence || {}).slice(0, MAX_EVIDENCE_KEYS);
  for (const k of keys) {
    const v = rawEvidence[k];
    if (typeof v === 'string') evidence[k] = v.slice(0, MAX_EVIDENCE_VALUE);
    else if (typeof v === 'number' || typeof v === 'boolean' || v == null) evidence[k] = v;
    else evidence[k] = String(v).slice(0, MAX_EVIDENCE_VALUE);
  }
  const out = await ruleEngine.evaluateRules({ deviceType, evidence, analysis });
  return sendSuccess(res, 200, out, 'Evaluation complete');
});

exports.fireCounts = tryCatch(async (req, res) => {
  const deviceType = typeof req.query.deviceType === 'string'
    ? req.query.deviceType.slice(0, MAX_DEVICE_TYPE_LEN)
    : undefined;
  const counts = await ruleEngine.fireCounts(deviceType);
  return sendSuccess(res, 200, counts, 'Fire counts');
});