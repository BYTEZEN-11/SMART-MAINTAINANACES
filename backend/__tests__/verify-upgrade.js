

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const jwt = require('jsonwebtoken');

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const log = (...a) => console.log('[verify]', ...a);

const authHeaders = (token) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

const call = async (method, p, token, body) => {
  const res = await fetch(`${BASE}${p}`, {
    method,
    headers: authHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, body: json };
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const u = await User.findOne({}).lean();
  if (!u) { log('NO USER FOUND'); process.exit(1); }
  const token = jwt.sign({ id: u._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

log('GET /api/rules/active?deviceType=fridge');
  const a1 = await call('GET', '/api/rules/active?deviceType=fridge', token);
  log('  status', a1.status, 'count', (a1.body?.data || []).length, 'ids', (a1.body?.data || []).slice(0, 3).map((r) => r.id).join(','));

  log('POST /api/rules/evaluate { power_on, no_cooling }');
  const a2 = await call('POST', '/api/rules/evaluate', token, {
    deviceType: 'fridge',
    evidence: { power_on: true, no_cooling: true },
  });
  const fired = a2.body?.data?.fired || [];
  log('  status', a2.status, 'fired', fired.length, fired.map((f) => `${f.id}(${f.action.severity})`).join(', '));

log('GET /api/desktop-agent/pair-code');
  const d1 = await call('GET', '/api/desktop-agent/pair-code', token);
  log('  status', d1.status, 'pairCode', d1.body?.data?.pairCode);

  log('POST /api/desktop-agent/ingest');
  const d2 = await call('POST', '/api/desktop-agent/ingest', token, {
    deviceId: 'verify-laptop',
    source: 'manual',
    payload: {
      cpu: { temp: 92, usage: 88 },
      ram: { used: 7.6, total: 8 },
      battery: { health: 62 },
      storage: [{ name: 'C:', health: 'OK' }, { name: 'D:', health: 'DEGRADED' }],
    },
  });
  log('  status', d2.status, 'anomalies', (d2.body?.data?.anomalies || []).length);

  log('GET /api/desktop-agent/health');
  const d3 = await call('GET', '/api/desktop-agent/health?deviceId=verify-laptop', token);
  log('  status', d3.status, 'count', d3.body?.data?.count, 'averages', JSON.stringify(d3.body?.data?.averages));

log('POST /api/analyze/text');
  const m1 = await call('POST', '/api/analyze/text', token, {
    deviceType: 'fridge',
    deviceName: 'VerifyFridge',
    textDescription: 'The fridge has power but is not cooling at all. Compressor silent.',
  });
  log('  status', m1.status, 'analysisId', m1.body?.data?._id, 'severity', m1.body?.data?.analysis?.severity, 'confidence', m1.body?.data?.analysis?.confidence);
  log('  matchedRules', (m1.body?.data?.analysis?.matchedRules || []).join(','));
  log('  traceLength', (m1.body?.data?.analysis?.ruleTrace || []).length);

if (m1.body?.data?._id) {
    log('POST /api/reports/generate (executive)');
    const r1 = await call('POST', '/api/reports/generate', token, { analysisId: m1.body.data._id, template: 'executive' });
    log('  status', r1.status, 'fileName', r1.body?.data?.pdfUrl, 'fileSize', r1.body?.data?.fileSize);

    log('POST /api/reports/generate (technician)');
    const r2 = await call('POST', '/api/reports/generate', token, { analysisId: m1.body.data._id, template: 'technician' });
    log('  status', r2.status, 'fileName', r2.body?.data?.pdfUrl, 'fileSize', r2.body?.data?.fileSize);

    log('POST /api/reports/generate (insurance)');
    const r3 = await call('POST', '/api/reports/generate', token, { analysisId: m1.body.data._id, template: 'insurance' });
    log('  status', r3.status, 'fileName', r3.body?.data?.pdfUrl, 'fileSize', r3.body?.data?.fileSize);
  }

  await mongoose.disconnect();
  log('DONE');
})().catch((e) => { console.error(e); process.exit(1); });