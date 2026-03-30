const axios = require('axios');

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
].filter(Boolean);
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || 'v1beta';

const stripMarkdownFences = (s) => (s || '').replace(/```json|```/g, '').trim();

const extractBalancedJson = (src) => {
  const s = String(src || '');
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return s.substring(start, i + 1);
    }
  }
  return null;
};

const safeJson = (raw) => {
  const cleaned = stripMarkdownFences(raw);
  const balanced = extractBalancedJson(cleaned);
  if (!balanced) return null;
  try {
    return JSON.parse(balanced);
  } catch {
    return null;
  }
};

const callGemini = async (prompt, imageParts = [], timeoutMs = 25000) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 20) return null;

  const parts = [{ text: prompt }, ...imageParts];
  let lastErr;
  for (const model of GEMINI_MODELS) {
    try {
      const { data } = await axios.post(
        `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${apiKey}`,
        { contents: [{ parts }] },
        { headers: { 'Content-Type': 'application/json' }, timeout: timeoutMs }
      );
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;
      return text;
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      if (status && status >= 400 && status < 500 && status !== 404 && status !== 429) {
        console.error('Gemini call failed:', err.response?.data || err.message);
        return null;
      }
      
    }
  }
  console.error('Gemini call failed (all models):', lastErr?.response?.data || lastErr?.message);
  return null;
};

const fetchImagePart = async (url) => {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 8000,
      maxContentLength: 4 * 1024 * 1024,
    });
    const contentType = res.headers['content-type'] || '';
    if (!contentType.startsWith('image/')) return null;
    return {
      inline_data: {
        mime_type: contentType,
        data: Buffer.from(res.data).toString('base64'),
      },
    };
  } catch {
    return null;
  }
};

const VISUAL_DEFECTS = [
  'wall_crack', 'water_leakage', 'dampness', 'mold', 'rust',
  'broken_switch', 'pipe_damage', 'paint_damage', 'structural_defect',
  'broken_glass', 'worn_gasket', 'loose_connection', 'corrosion', 'stain',
];

const AUDIO_DEFECTS = [
  'bearing_failure', 'motor_issue', 'fan_imbalance', 'compressor_problem',
  'pump_abnormality', 'grinding_noise', 'electrical_buzzing',
  'belt_wear', 'valve_clicking', 'refrigerant_hiss',
];

const VIDEO_DEFECTS = [
  'water_leak', 'vibration', 'fan_wobble', 'machine_instability',
  'smoke', 'visible_abnormality', 'arcing', 'oil_leak',
];

const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const normSeverity = (s) => {
  if (!s) return 'Medium';
  const v = String(s).toLowerCase();
  if (v.includes('critical') || v === '4') return 'Critical';
  if (v.includes('high') || v === '3') return 'High';
  if (v.includes('low') || v === '1') return 'Low';
  return 'Medium';
};

const severityToPriority = (sev) => {
  const map = { Critical: 'CRITICAL', High: 'HIGH', Medium: 'MEDIUM', Low: 'LOW' };
  return map[sev] || 'MEDIUM';
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n) || 0));

const analyzeImage = async ({ deviceType, deviceName, imageUrls, description }) => {
  const start = Date.now();
  const isMock = !process.env.GEMINI_API_KEY;

  const prompt = `You are an expert home maintenance AI. Analyze the following image(s) of a ${deviceType} (${deviceName}).

Description: ${description || 'No description provided'}

Detect any of these issues if visible:
${VISUAL_DEFECTS.map((d) => `- ${d.replace(/_/g, ' ')}`).join('\n')}

Respond ONLY with a single JSON object (no markdown) in this exact shape:
{
 "issue": "short name of the main issue",
 "category": "mechanical | electrical | structural | plumbing | cosmetic | other",
 "severity": "Low | Medium | High | Critical",
 "confidence": 0-100,
 "probable_causes": [{ "cause": "...", "probability": 0-100 }],
 "affected_components": ["..."],
 "recommendations": ["..."],
 "repair_steps": ["step 1", "step 2"],
 "estimated_cost": { "min": 0, "max": 0, "currency": "INR" },
 "estimated_time": { "value": 0, "unit": "minutes" },
 "difficulty": "Easy | Moderate | Hard | Professional",
 "prevention_tips": ["..."],
 "diy_possible": true|false
}`;

  let imageParts = [];
  for (const u of imageUrls || []) {
    const p = await fetchImagePart(u);
    if (p) imageParts.push(p);
  }

  const raw = await callGemini(prompt, imageParts);
  const parsed = raw ? safeJson(raw) : null;
  if (parsed) {
    return shapeResult(parsed, 'image', Date.now() - start, isMock);
  }

return mockImageAnalysis({ deviceType, deviceName, description }, isMock, Date.now() - start);
};

const mockImageAnalysis = ({ deviceType, description }, isMock, processingTime) => {
  const desc = (description || '').toLowerCase();
  let issue = 'No critical issues detected';
  let severity = 'Low';
  let confidence = 55;
  let affected = ['Surface'];
  const recommendations = [
    'Take clearer photos from multiple angles for a more confident analysis.',
    'Inspect the area manually for any subtle changes.',
  ];
  const repairSteps = ['Document the area with a fresh photo', 'Verify with a follow-up scan'];
  const cost = { min: 0, max: 500, currency: 'INR' };
  const time = { value: 10, unit: 'minutes' };
  let causes = [{ cause: 'No significant issue', probability: 70 }];
  const prevention = ['Regular cleaning', 'Periodic visual inspection'];

  if (desc.includes('crack')) {
    issue = 'Visible wall/housing crack';
    severity = 'High';
    confidence = 80;
    affected = ['Wall', 'Plaster'];
    causes = [
      { cause: 'Structural settling', probability: 55 },
      { cause: 'Moisture damage', probability: 25 },
      { cause: 'Impact damage', probability: 20 },
    ];
    recommendations.push('Have a structural engineer assess if crack is widening.');
    repairSteps.push('Clean the crack', 'Apply filler or epoxy', 'Repaint the area');
    cost.min = 500;
    cost.max = 3000;
    time.value = 60;
  } else if (desc.includes('leak') || desc.includes('water') || desc.includes('wet')) {
    issue = 'Water leakage / dampness detected';
    severity = 'High';
    confidence = 78;
    affected = ['Pipe', 'Wall', 'Floor'];
    causes = [
      { cause: 'Pipe joint failure', probability: 50 },
      { cause: 'Seal degradation', probability: 30 },
      { cause: 'Condensation buildup', probability: 20 },
    ];
    recommendations.push('Shut off the water source if leak is active.', 'Call a plumber promptly.');
    repairSteps.push('Locate leak source', 'Replace seal or pipe section', 'Dry the area');
    cost.min = 800;
    cost.max = 5000;
    time.value = 90;
  } else if (desc.includes('rust')) {
    issue = 'Rust / corrosion observed';
    severity = 'Medium';
    confidence = 75;
    affected = ['Metal surface', 'Fasteners'];
    causes = [
      { cause: 'Prolonged moisture exposure', probability: 70 },
      { cause: 'Protective coating failure', probability: 30 },
    ];
    recommendations.push('Remove rust, apply anti-corrosion primer.', 'Improve ventilation.');
    repairSteps.push('Sand rusted area', 'Apply rust converter', 'Repaint');
    cost.min = 400;
    cost.max = 2500;
    time.value = 60;
  } else if (desc.includes('mold') || desc.includes('mould')) {
    issue = 'Mold / mildew growth detected';
    severity = 'High';
    confidence = 82;
    affected = ['Wall', 'Air quality'];
    causes = [
      { cause: 'Persistent humidity', probability: 60 },
      { cause: 'Water seepage', probability: 30 },
      { cause: 'Poor ventilation', probability: 10 },
    ];
    recommendations.push('Improve ventilation, dehumidify the area.', 'Use mold-killing cleaner.');
    repairSteps.push('Wear PPE', 'Scrub with antifungal cleaner', 'Repaint with mold-resistant paint');
    cost.min = 500;
    cost.max = 4000;
    time.value = 120;
  } else if (desc.includes('switch') || desc.includes('socket') || desc.includes('sparking')) {
    issue = 'Damaged electrical switch / outlet';
    severity = 'High';
    confidence = 80;
    affected = ['Switch', 'Wiring'];
    causes = [
      { cause: 'Loose wiring', probability: 55 },
      { cause: 'Overload damage', probability: 30 },
      { cause: 'Aged component', probability: 15 },
    ];
    recommendations.push('Cut power at the breaker before inspection.', 'Consult a licensed electrician.');
    repairSteps.push('Isolate circuit', 'Replace switch', 'Test with multimeter');
    cost.min = 300;
    cost.max = 1500;
    time.value = 45;
  }

  return shapeResult(
    {
      issue,
      category: severity === 'High' ? 'structural' : 'cosmetic',
      severity,
      confidence,
      probable_causes: causes,
      affected_components: affected,
      recommendations,
      repair_steps: repairSteps,
      estimated_cost: cost,
      estimated_time: time,
      difficulty: cost.max < 1000 ? 'Easy' : cost.max < 3000 ? 'Moderate' : 'Professional',
      prevention_tips: prevention,
      diy_possible: cost.max < 1500,
    },
    'image',
    processingTime,
    isMock
  );
};

const analyzeAudio = async ({ deviceType, deviceName, audioUrl, soundDescription, audioData }) => {
  const start = Date.now();
  const isMock = !process.env.GEMINI_API_KEY;

  const prompt = `You are an acoustic diagnostics expert. Analyze the following sound recording of a ${deviceType} (${deviceName}).

User description: ${soundDescription || 'No description'}
Audio data summary: ${JSON.stringify(audioData || {}).slice(0, 600)}

Detect any of these if present:
${AUDIO_DEFECTS.map((d) => `- ${d.replace(/_/g, ' ')}`).join('\n')}

Respond ONLY with a single JSON object (no markdown):
{
 "issue": "short name of the detected issue",
 "category": "mechanical | electrical | other",
 "severity": "Low | Medium | High | Critical",
 "confidence": 0-100,
 "probable_causes": [{ "cause": "...", "probability": 0-100 }],
 "affected_components": ["..."],
 "recommendations": ["..."],
 "repair_steps": ["..."],
 "estimated_cost": { "min": 0, "max": 0, "currency": "INR" },
 "estimated_time": { "value": 0, "unit": "minutes" },
 "difficulty": "Easy | Moderate | Hard | Professional",
 "prevention_tips": ["..."],
 "diy_possible": true|false
}`;

const raw = await callGemini(prompt);
  const parsed = raw ? safeJson(raw) : null;
  if (parsed) return shapeResult(parsed, 'audio', Date.now() - start, isMock);

  return mockAudioAnalysis({ deviceType, soundDescription, audioData }, isMock, Date.now() - start);
};

const mockAudioAnalysis = ({ deviceType, soundDescription }, isMock, processingTime) => {
  const desc = (soundDescription || '').toLowerCase();
  let issue = 'No abnormal sounds detected';
  let severity = 'Low';
  let confidence = 60;
  let affected = ['Mechanism'];
  let causes = [{ cause: 'Normal operation', probability: 70 }];
  let recommendations = ['Run the device for a few minutes and re-record if noise persists.'];
  const repairSteps = ['No action required'];
  const cost = { min: 0, max: 0, currency: 'INR' };
  const time = { value: 0, unit: 'minutes' };
  const prevention = ['Periodic lubrication', 'Keep device on a level surface'];

  if (desc.includes('grind')) {
    issue = 'Grinding sound — likely bearing wear';
    severity = 'High';
    confidence = 78;
    affected = ['Bearing', 'Motor'];
    causes = [
      { cause: 'Bearing wear', probability: 65 },
      { cause: 'Foreign debris', probability: 20 },
      { cause: 'Lubricant depletion', probability: 15 },
    ];
    recommendations.push('Stop using the device until bearing is replaced.', 'Consult a technician.');
    repairSteps.push('Disassemble housing', 'Replace bearing', 'Reassemble and test');
    cost.min = 800;
    cost.max = 4000;
    time.value = 90;
  } else if (desc.includes('buzz')) {
    issue = 'Electrical buzzing — possible loose winding or capacitor';
    severity = 'Medium';
    confidence = 70;
    affected = ['Capacitor', 'Winding'];
    causes = [
      { cause: 'Failing capacitor', probability: 55 },
      { cause: 'Loose winding', probability: 30 },
      { cause: 'Loose mounting', probability: 15 },
    ];
    recommendations.push('Power off and inspect capacitor.', 'Replace if bulged.');
    repairSteps.push('Discharge capacitor safely', 'Replace with matching spec', 'Test under load');
    cost.min = 400;
    cost.max = 1500;
    time.value = 45;
  } else if (desc.includes('click')) {
    issue = 'Clicking sound — possible relay or compressor issue';
    severity = 'Medium';
    confidence = 65;
    affected = ['Relay', 'Compressor'];
    causes = [
      { cause: 'Failing start relay', probability: 50 },
      { cause: 'Compressor valve issue', probability: 30 },
      { cause: 'Loose component', probability: 20 },
    ];
    recommendations.push('Check relay contacts.', 'Monitor compressor amp draw.');
    repairSteps.push('Test relay continuity', 'Replace if open', 'Verify operation');
    cost.min = 300;
    cost.max = 2500;
    time.value = 60;
  } else if (desc.includes('whine') || desc.includes('whining')) {
    issue = 'High-pitched whine — possible coil whine or fan bearing';
    severity = 'Low';
    confidence = 60;
    affected = ['Fan', 'Inductor'];
    causes = [
      { cause: 'Fan bearing wear', probability: 55 },
      { cause: 'Coil whine (benign)', probability: 35 },
      { cause: 'Capacitor audible noise', probability: 10 },
    ];
    recommendations.push('Replace fan if noise is loud.', 'Coil whine is usually harmless.');
    repairSteps.push('Identify source', 'Lubricate or replace fan', 'Test');
    cost.min = 200;
    cost.max = 1200;
    time.value = 30;
  } else if (desc.includes('rattle')) {
    issue = 'Rattling — loose internal component';
    severity = 'Medium';
    confidence = 70;
    affected = ['Internal mount'];
    causes = [
      { cause: 'Loose screw', probability: 60 },
      { cause: 'Broken mount', probability: 25 },
      { cause: 'Foreign object', probability: 15 },
    ];
    recommendations.push('Open housing and tighten internal fasteners.', 'Inspect for broken mounts.');
    repairSteps.push('Open device safely', 'Tighten all mounts', 'Replace broken parts');
    cost.min = 0;
    cost.max = 800;
    time.value = 30;
  } else if (desc.includes('squeak')) {
    issue = 'Squeaking — needs lubrication';
    severity = 'Low';
    confidence = 75;
    affected = ['Belt', 'Hinge'];
    causes = [
      { cause: 'Belt needs lubrication', probability: 50 },
      { cause: 'Hinge dry', probability: 30 },
      { cause: 'Belt worn', probability: 20 },
    ];
    recommendations.push('Apply appropriate lubricant to belt or hinge.');
    repairSteps.push('Identify source', 'Apply lubricant', 'Re-test');
    cost.min = 100;
    cost.max = 600;
    time.value = 20;
  } else if (desc.includes('hiss')) {
    issue = 'Hissing — possible refrigerant leak';
    severity = 'High';
    confidence = 72;
    affected = ['Refrigerant line', 'Compressor'];
    causes = [
      { cause: 'Refrigerant leak', probability: 60 },
      { cause: 'Valve leak', probability: 25 },
      { cause: 'Loose fitting', probability: 15 },
    ];
    recommendations.push('Contact HVAC technician — refrigerant is regulated.', 'Do not operate.');
    repairSteps.push('Leak detection', 'Repair leak', 'Recharge refrigerant');
    cost.min = 2000;
    cost.max = 8000;
    time.value = 120;
  }

  return shapeResult(
    {
      issue,
      category: 'mechanical',
      severity,
      confidence,
      probable_causes: causes,
      affected_components: affected,
      recommendations,
      repair_steps: repairSteps,
      estimated_cost: cost,
      estimated_time: time,
      difficulty: cost.max < 1000 ? 'Easy' : cost.max < 3000 ? 'Moderate' : 'Professional',
      prevention_tips: prevention,
      diy_possible: cost.max < 1500,
    },
    'audio',
    processingTime,
    isMock
  );
};

const analyzeVideo = async ({ deviceType, deviceName, videoUrl, description }) => {
  const start = Date.now();
  const isMock = !process.env.GEMINI_API_KEY;

  const prompt = `You are an expert maintenance technician. A user uploaded a video of their ${deviceType} (${deviceName}).

Description: ${description || 'No description provided'}

Detect any of these if visible across the video:
${VIDEO_DEFECTS.map((d) => `- ${d.replace(/_/g, ' ')}`).join('\n')}

Respond ONLY with a single JSON object (no markdown) in the same shape as for image analysis:
{
 "issue": "...",
 "category": "mechanical | electrical | structural | plumbing | other",
 "severity": "Low | Medium | High | Critical",
 "confidence": 0-100,
 "probable_causes": [{ "cause": "...", "probability": 0-100 }],
 "affected_components": ["..."],
 "recommendations": ["..."],
 "repair_steps": ["..."],
 "estimated_cost": { "min": 0, "max": 0, "currency": "INR" },
 "estimated_time": { "value": 0, "unit": "minutes" },
 "difficulty": "Easy | Moderate | Hard | Professional",
 "prevention_tips": ["..."],
 "diy_possible": true|false
}`;

const raw = await callGemini(prompt);
  const parsed = raw ? safeJson(raw) : null;
  if (parsed) return shapeResult(parsed, 'video', Date.now() - start, isMock);

  return mockVideoAnalysis({ deviceType, description }, isMock, Date.now() - start);
};

const mockVideoAnalysis = ({ deviceType, description }, isMock, processingTime) => {
  const desc = (description || '').toLowerCase();
  let issue = 'No abnormalities detected in video';
  let severity = 'Low';
  let confidence = 55;
  let affected = ['Device'];
  let causes = [{ cause: 'No visible issue', probability: 70 }];
  const recommendations = ['Re-record with closer framing if a specific concern exists.'];
  const repairSteps = ['No action required'];
  const cost = { min: 0, max: 0, currency: 'INR' };
  const time = { value: 0, unit: 'minutes' };
  const prevention = ['Periodic visual inspection', 'Keep device on a stable surface'];

  if (desc.includes('vibrat') || desc.includes('shake')) {
    issue = 'Excessive vibration / instability';
    severity = 'Medium';
    confidence = 80;
    affected = ['Mounting', 'Motor', 'Fan'];
    causes = [
      { cause: 'Unbalanced rotating mass', probability: 60 },
      { cause: 'Loose mounting', probability: 25 },
      { cause: 'Worn bearing', probability: 15 },
    ];
    recommendations.push('Tighten mounting bolts.', 'Inspect rotating components for balance.');
    repairSteps.push('Power off', 'Tighten mounts', 'Check balance');
    cost.min = 200;
    cost.max = 2000;
    time.value = 30;
  } else if (desc.includes('wobble') || desc.includes('fan')) {
    issue = 'Fan wobble detected';
    severity = 'Medium';
    confidence = 78;
    affected = ['Fan blade', 'Hub'];
    causes = [
      { cause: 'Bent fan blade', probability: 60 },
      { cause: 'Loose hub', probability: 30 },
      { cause: 'Worn bearing', probability: 10 },
    ];
    recommendations.push('Stop using until fan is replaced or rebalanced.');
    repairSteps.push('Remove fan', 'Replace or rebalance', 'Test');
    cost.min = 500;
    cost.max = 3000;
    time.value = 60;
  } else if (desc.includes('leak')) {
    issue = 'Water leak visible in video';
    severity = 'High';
    confidence = 82;
    affected = ['Pipe', 'Seal'];
    causes = [
      { cause: 'Loose fitting', probability: 50 },
      { cause: 'Cracked pipe', probability: 30 },
      { cause: 'Failed seal', probability: 20 },
    ];
    recommendations.push('Shut off water supply.', 'Replace fitting or seal.');
    repairSteps.push('Isolate supply', 'Replace part', 'Test under pressure');
    cost.min = 300;
    cost.max = 3000;
    time.value = 60;
  } else if (desc.includes('smoke')) {
    issue = 'Smoke emission — possible electrical fire risk';
    severity = 'Critical';
    confidence = 90;
    affected = ['Wiring', 'Component'];
    causes = [
      { cause: 'Overheating component', probability: 60 },
      { cause: 'Short circuit', probability: 30 },
      { cause: 'Failed motor', probability: 10 },
    ];
    recommendations.push('Disconnect power immediately.', 'Do not use until inspected.');
    repairSteps.push('Cut power', 'Inspect for damage', 'Replace failed component');
    cost.min = 1000;
    cost.max = 10000;
    time.value = 120;
  }

  return shapeResult(
    {
      issue,
      category: 'mechanical',
      severity,
      confidence,
      probable_causes: causes,
      affected_components: affected,
      recommendations,
      repair_steps: repairSteps,
      estimated_cost: cost,
      estimated_time: time,
      difficulty: cost.max < 1000 ? 'Easy' : cost.max < 3000 ? 'Moderate' : 'Professional',
      prevention_tips: prevention,
      diy_possible: cost.max < 1500,
    },
    'video',
    processingTime,
    isMock
  );
};

const analyzeSensor = async ({ deviceType, deviceName, sensorData }) => {
  const start = Date.now();
  const isMock = false; 
  const anomalies = detectSensorAnomalies(sensorData || {});
  const summary = summarizeSensor(anomalies);
  const severity = summary.severity;
  const causes = summary.causes;
  const recommendations = summary.recommendations;
  const repairSteps = summary.repairSteps;
  const cost = summary.cost;
  const time = summary.time;
  const prevention = summary.prevention;
  const affected = summary.affected;

  return shapeResult(
    {
      issue: summary.issue,
      category: 'mechanical',
      severity,
      confidence: summary.confidence,
      probable_causes: causes,
      affected_components: affected,
      recommendations,
      repair_steps: repairSteps,
      estimated_cost: cost,
      estimated_time: time,
      difficulty: cost.max < 1500 ? 'Easy' : cost.max < 5000 ? 'Moderate' : 'Professional',
      prevention_tips: prevention,
      diy_possible: cost.max < 1500,
    },
    'sensor',
    Date.now() - start,
    isMock,
    anomalies
  );
};

const SENSOR_THRESHOLDS = {
  temperature: { min: 5, max: 75, critical: 90 }, 
  humidity: { min: 20, max: 70, critical: 85 }, 
  current: { min: 0.1, max: 15, critical: 20 }, 
  voltage: { min: 200, max: 250, critical_min: 180, critical_max: 270 }, 
  vibration: { min: 0, max: 1.5, critical: 3.0 }, 
  gas: { min: 0, max: 50, critical: 200 }, 
};

const detectSensorAnomalies = (d) => {
  const out = [];
  for (const [key, t] of Object.entries(SENSOR_THRESHOLDS)) {
    const v = Number(d[key]);
    if (!Number.isFinite(v)) continue;

    if (t.critical !== undefined && v >= t.critical) {
      out.push({
        type: `${key}_critical_high`,
        severity: 'critical',
        message: `${key} critically high: ${v}`,
        value: v,
        threshold: t.critical,
      });
      continue;
    }
    if (t.critical_min !== undefined && v <= t.critical_min) {
      out.push({
        type: `${key}_critical_low`,
        severity: 'critical',
        message: `${key} critically low: ${v}`,
        value: v,
        threshold: t.critical_min,
      });
      continue;
    }
    if (v > t.max) {
      out.push({
        type: `${key}_high`,
        severity: 'high',
        message: `${key} above normal range: ${v}`,
        value: v,
        threshold: t.max,
      });
    } else if (v < t.min) {
      out.push({
        type: `${key}_low`,
        severity: 'medium',
        message: `${key} below normal range: ${v}`,
        value: v,
        threshold: t.min,
      });
    }
  }
  return out;
};

const summarizeSensor = (anomalies) => {
  if (anomalies.length === 0) {
    return {
      issue: 'All sensor readings within normal range',
      severity: 'Low',
      confidence: 90,
      causes: [{ cause: 'Normal operation', probability: 95 }],
      affected: [],
      recommendations: ['Continue regular monitoring.'],
      repairSteps: ['No action required.'],
      cost: { min: 0, max: 0, currency: 'INR' },
      time: { value: 0, unit: 'minutes' },
      prevention: ['Continue periodic sensor logs.'],
    };
  }

  const critical = anomalies.some((a) => a.severity === 'critical');
  const high = anomalies.some((a) => a.severity === 'high');

  const issues = anomalies.map((a) => a.message).join('; ');
  const causeMap = {
    temperature: { cause: 'Overheating component', probability: 80 },
    humidity: { cause: 'Excess moisture / ventilation failure', probability: 75 },
    current: { cause: 'Overload or failing motor', probability: 70 },
    voltage: { cause: 'Power supply instability', probability: 75 },
    vibration: { cause: 'Unbalance or loose mount', probability: 80 },
    gas: { cause: 'Possible gas leak', probability: 85 },
  };

  const causes = [];
  const seen = new Set();
  for (const a of anomalies) {
    const k = a.type.split('_')[0];
    if (seen.has(k)) continue;
    seen.add(k);
    if (causeMap[k]) causes.push(causeMap[k]);
  }
  if (causes.length === 0) causes.push({ cause: 'Sensor out of range', probability: 70 });

  const recommendations = [];
  if (anomalies.some((a) => a.type.startsWith('gas'))) {
    recommendations.push('Evacuate the area immediately and ventilate.');
    recommendations.push('Call emergency services if gas smell is strong.');
  } else if (anomalies.some((a) => a.type.startsWith('temperature'))) {
    recommendations.push('Power off the device and allow it to cool.');
    recommendations.push('Inspect ventilation and cooling components.');
  } else if (anomalies.some((a) => a.type.startsWith('vibration'))) {
    recommendations.push('Tighten mounting bolts.');
    recommendations.push('Inspect rotating components for balance.');
  } else if (anomalies.some((a) => a.type.startsWith('current'))) {
    recommendations.push('Reduce load or inspect for short circuits.');
  } else if (anomalies.some((a) => a.type.startsWith('voltage'))) {
    recommendations.push('Use a voltage stabilizer.');
    recommendations.push('Inspect the power source and connections.');
  } else if (anomalies.some((a) => a.type.startsWith('humidity'))) {
    recommendations.push('Improve ventilation; consider a dehumidifier.');
  }

  const repairSteps = ['Stop device operation if anomaly is critical.'];
  if (anomalies.some((a) => a.type.startsWith('gas'))) {
    repairSteps.push('Ventilate area.');
    repairSteps.push('Locate and seal leak source.');
    repairSteps.push('Call gas service professional.');
  } else if (anomalies.some((a) => a.type.startsWith('temperature'))) {
    repairSteps.push('Clean vents and fans.');
    repairSteps.push('Verify thermal paste / coolant level.');
    repairSteps.push('Replace thermal sensor if faulty.');
  } else if (anomalies.some((a) => a.type.startsWith('vibration'))) {
    repairSteps.push('Re-tighten mounts.');
    repairSteps.push('Balance rotating components.');
  } else {
    repairSteps.push('Inspect and address each anomaly per its component.');
  }

  const cost = critical
    ? { min: 1500, max: 8000, currency: 'INR' }
    : high
    ? { min: 500, max: 4000, currency: 'INR' }
    : { min: 0, max: 1500, currency: 'INR' };

  return {
    issue: `Sensor anomalies: ${issues}`,
    severity: critical ? 'Critical' : high ? 'High' : 'Medium',
    confidence: 85,
    causes,
    affected: anomalies.map((a) => a.type.split('_')[0]),
    recommendations,
    repairSteps,
    cost,
    time: { value: critical ? 120 : high ? 60 : 30, unit: 'minutes' },
    prevention: ['Monitor sensors daily', 'Schedule preventive inspections'],
  };
};

const analyzeMultimodal = async (payload) => {
  const start = Date.now();
  const { deviceType, deviceName, imageUrls, videoUrl, audioUrl, textDescription, sensorData } = payload;

  const subResults = {};
  let totalConfidence = 0;
  let count = 0;

  if (imageUrls && imageUrls.length) {
    subResults.image = await analyzeImage({ deviceType, deviceName, imageUrls, description: textDescription });
    totalConfidence += subResults.image.confidence;
    count++;
  }
  if (videoUrl) {
    subResults.video = await analyzeVideo({ deviceType, deviceName, videoUrl, description: textDescription });
    totalConfidence += subResults.video.confidence;
    count++;
  }
  if (audioUrl) {
    subResults.audio = await analyzeAudio({ deviceType, deviceName, audioUrl, soundDescription: textDescription, audioData: null });
    totalConfidence += subResults.audio.confidence;
    count++;
  }
  if (sensorData) {
    subResults.sensor = await analyzeSensor({ deviceType, deviceName, sensorData });
    totalConfidence += subResults.sensor.confidence;
    count++;
  }

  if (count === 0) {
    
    const result = await analyzeImage({ deviceType, deviceName, imageUrls: [], description: textDescription });
    return { ...result, isMultimodal: false };
  }

const arr = Object.values(subResults);
  const primary = arr.reduce((a, b) => severityRank(b.severity) > severityRank(a.severity) ? b : a);
  const allCauses = [];
  const seen = new Set();
  for (const r of arr) {
    for (const c of r.analysis.probableCauses) {
      const key = (c.cause || '').toLowerCase();
      if (seen.has(key) || !c.cause) continue;
      seen.add(key);
      
      allCauses.push({ cause: c.cause, probability: Math.round(c.probability * 0.8) });
    }
  }
  allCauses.sort((a, b) => b.probability - a.probability);
  const topCauses = allCauses.slice(0, 5);
  
  const sum = topCauses.reduce((s, c) => s + c.probability, 0) || 1;
  for (const c of topCauses) c.probability = Math.round((c.probability / sum) * 100);

  const merged = {
    ...primary.analysis,
    probableCauses: topCauses,
    confidence: Math.round(totalConfidence / count),
    issue: primary.analysis.issue + ' (multimodal)',
  };
  return {
    ...primary,
    analysis: merged,
    isMultimodal: true,
    subResults,
    processingTime: Date.now() - start,
  };
};

const severityRank = (s) => ({ Critical: 4, High: 3, Medium: 2, Low: 1 }[s] || 0);

const generateFollowUpQuestions = async ({ deviceType, deviceName, description, currentIssue }) => {
  const prompt = `You are a home maintenance expert. The user reports: "${description || currentIssue || ''}" on a ${deviceType} (${deviceName}).

Generate 3-5 intelligent follow-up questions to clarify the issue. Each must include 2-4 multiple-choice options.

Respond ONLY with a single JSON object (no markdown) in this exact shape:
{
 "questions": [
   { "question": "...", "options": ["...", "..."], "purpose": "what this clarifies" }
 ]
}`;

  const raw = await callGemini(prompt);
  const parsed = raw ? safeJson(raw) : null;
  if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
  return mockFollowUpQuestions(deviceType, description);
};

const mockFollowUpQuestions = (deviceType, description) => {
  const d = (description || '').toLowerCase();
  if (d.includes('cool') || d.includes('ac') || d.includes('air condition')) {
    return [
      { question: 'Is the outdoor unit running?', options: ['Yes, normally', 'Yes, but noisy', 'No, it is off', 'I cannot tell'], purpose: 'Detects compressor/relay issues' },
      { question: 'Any unusual noise from the unit?', options: ['No noise', 'Clicking', 'Hissing', 'Grinding'], purpose: 'Detects refrigerant or bearing issues' },
      { question: 'Is there water leakage from the indoor unit?', options: ['Yes, dripping', 'Yes, pooling', 'No', 'Not sure'], purpose: 'Detects drain blockage' },
      { question: 'When did the problem start?', options: ['Today', 'This week', 'This month', 'Long time'], purpose: 'Severity timeline' },
    ];
  }
  if (d.includes('leak') || d.includes('water')) {
    return [
      { question: 'Where is the leak coming from?', options: ['Pipe joint', 'Appliance', 'Roof/ceiling', 'Unknown'], purpose: 'Locate source' },
      { question: 'Is the leak active right now?', options: ['Yes, continuously', 'Slow drip', 'Only when used', 'Stopped'], purpose: 'Urgency' },
      { question: 'How much water is collecting?', options: ['Drops', 'Small puddle', 'Large puddle', 'Flooding'], purpose: 'Severity' },
    ];
  }
  
  return [
    { question: 'When did you first notice the issue?', options: ['Today', 'This week', 'This month', 'More than a month ago'], purpose: 'Timeline' },
    { question: 'How frequently does the issue occur?', options: ['Always', 'Often', 'Sometimes', 'Rarely'], purpose: 'Frequency' },
    { question: 'Have you attempted any fixes?', options: ['Yes, repaired', 'Yes, no effect', 'No'], purpose: 'Prior actions' },
  ];
};

const refineDiagnosisFromAnswers = async ({ deviceType, deviceName, description, answers, previousDiagnosis }) => {
  const prompt = `You are a home maintenance expert. The user has a ${deviceType} (${deviceName}).

Initial description: "${description || ''}"
Initial diagnosis: ${JSON.stringify(previousDiagnosis || {})}
User's answers to follow-up questions:
${JSON.stringify(answers || [], null, 2)}

Refine the diagnosis. Respond ONLY with a single JSON object in this exact shape:
{
 "issue": "refined issue",
 "severity": "Low | Medium | High | Critical",
 "confidence": 0-100,
 "probable_causes": [{ "cause": "...", "probability": 0-100 }],
 "affected_components": ["..."],
 "recommendations": ["..."],
 "repair_steps": ["..."],
 "estimated_cost": { "min": 0, "max": 0, "currency": "INR" },
 "estimated_time": { "value": 0, "unit": "minutes" },
 "difficulty": "Easy | Moderate | Hard | Professional",
 "prevention_tips": ["..."],
 "diy_possible": true|false
}`;

  const raw = await callGemini(prompt);
  const parsed = raw ? safeJson(raw) : null;
  if (parsed) return shapeResult(parsed, 'refined', 0, !process.env.GEMINI_API_KEY);

const isYes = (a) => typeof a?.answer === 'string' && /yes|active|always|flooding|grinding|hiss/i.test(a.answer);
  const isNo = (a) => typeof a?.answer === 'string' && /no|never|stopped/i.test(a.answer);

  const criticalSignals = answers.filter(isYes).length;
  const severity = criticalSignals >= 2 ? 'High' : criticalSignals >= 1 ? 'Medium' : 'Low';
  return shapeResult(
    {
      issue: previousDiagnosis?.issue || 'Refined diagnosis',
      category: 'mechanical',
      severity,
      confidence: 75,
      probable_causes: previousDiagnosis?.probable_causes || [{ cause: 'Combined user inputs', probability: 70 }],
      affected_components: previousDiagnosis?.affected_components || [],
      recommendations: ['Based on your answers, follow the suggested steps.'],
      repair_steps: ['Address each affected component.', 'Re-test after repair.'],
      estimated_cost: { min: 500, max: 3000, currency: 'INR' },
      estimated_time: { value: 60, unit: 'minutes' },
      difficulty: 'Moderate',
      prevention_tips: ['Periodic maintenance checks.'],
      diy_possible: true,
    },
    'refined',
    0,
    !process.env.GEMINI_API_KEY
  );
};

const generatePrediction = async ({ appliance, recentAnalyses, recentReadings }) => {
  const start = Date.now();

const severities = (recentAnalyses || []).map((a) => severityRank(a.analysis?.severity || 'Low'));
  const avgSev = severities.length ? severities.reduce((a, b) => a + b, 0) / severities.length : 0;
  const baseHealth = Math.max(0, 100 - avgSev * 15);

const tempSeries = (recentReadings || [])
    .map((r) => r.temperature)
    .filter((t) => Number.isFinite(t));
  const vibSeries = (recentReadings || [])
    .map((r) => r.vibration)
    .filter((v) => Number.isFinite(v));

  const tempTrend = trendOf(tempSeries);
  const vibTrend = trendOf(vibSeries);

  const trend = tempTrend > 0.5 || vibTrend > 0.3 ? 'declining' : tempTrend < -0.3 || vibTrend < -0.3 ? 'improving' : 'stable';
  const healthScore = Math.round(baseHealth - (trend === 'declining' ? 10 : 0));
  const failureRisk = Math.max(0, 100 - healthScore);

const predicted = [];
  if (vibTrend > 0.3) {
    predicted.push({
      component: 'Bearing / rotating mass',
      probability: Math.min(95, 60 + Math.round(vibTrend * 30)),
      estimatedDays: Math.max(5, Math.round(30 / (1 + vibTrend))),
      message: `Fan bearing may fail within ${Math.max(5, Math.round(30 / (1 + vibTrend)))} days based on rising vibration.`,
    });
  }
  if (tempTrend > 0.5) {
    predicted.push({
      component: 'Cooling system',
      probability: Math.min(95, 50 + Math.round(tempTrend * 30)),
      estimatedDays: Math.max(7, Math.round(45 / (1 + tempTrend))),
      message: `Cooling system may degrade within ${Math.max(7, Math.round(45 / (1 + tempTrend)))} days.`,
    });
  }
  if (predicted.length === 0) {
    predicted.push({
      component: 'General',
      probability: 10,
      estimatedDays: 180,
      message: 'No immediate failures predicted; continue regular monitoring.',
    });
  }

const maintenanceSchedule = [];
  if (healthScore < 60) {
    maintenanceSchedule.push({
      title: 'Comprehensive inspection',
      dueDate: new Date(Date.now() + 7 * 86400000),
      priority: 'high',
      completed: false,
    });
  } else if (healthScore < 80) {
    maintenanceSchedule.push({
      title: 'Routine check-up',
      dueDate: new Date(Date.now() + 30 * 86400000),
      priority: 'medium',
      completed: false,
    });
  } else {
    maintenanceSchedule.push({
      title: 'Quarterly maintenance',
      dueDate: new Date(Date.now() + 90 * 86400000),
      priority: 'low',
      completed: false,
    });
  }

const recommendations = [];
  if (vibTrend > 0.3) {
    recommendations.push({ priority: 'high', action: 'Lubricate bearings', reason: 'Vibration trending upward', timeframe: 'Within 7 days' });
  }
  if (tempTrend > 0.5) {
    recommendations.push({ priority: 'high', action: 'Clean heat sinks / vents', reason: 'Temperature drifting up', timeframe: 'Within 14 days' });
  }
  if (recommendations.length === 0) {
    recommendations.push({ priority: 'low', action: 'Continue routine inspection', reason: 'All metrics within range', timeframe: 'Next quarter' });
  }

  return {
    healthScore,
    failureRisk,
    trend,
    estimatedLifespan: healthScore > 80 ? '5+ years' : healthScore > 60 ? '2-3 years' : '< 1 year',
    components: [
      { name: 'Motor', health: Math.max(0, healthScore - 5), note: vibTrend > 0.3 ? 'Vibration rising' : 'Normal' },
      { name: 'Bearing', health: Math.max(0, healthScore - 10), note: vibTrend > 0.3 ? 'Worn' : 'OK' },
      { name: 'Cooling', health: Math.max(0, healthScore - (tempTrend > 0.5 ? 15 : 0)), note: tempTrend > 0.5 ? 'Drift detected' : 'Normal' },
    ],
    predictedFailures: predicted,
    maintenanceSchedule,
    recommendations,
    processingTime: Date.now() - start,
  };
};

const trendOf = (arr) => {
  if (arr.length < 2) return 0;
  
  const n = arr.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const xMean = (n - 1) / 2;
  const yMean = arr.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (arr[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  if (den === 0) return 0;
  const slope = num / den;
  
  return yMean === 0 ? slope : slope / Math.abs(yMean);
};

const shapeResult = (raw, kind, processingTime, isMock, sensorAnomalies = []) => {
  const severity = normSeverity(raw.severity);
  const probableCauses = (raw.probable_causes || []).map((c) => ({
    cause: String(c.cause || '').slice(0, 300),
    probability: clamp(c.probability, 0, 100),
  }));
  return {
    analysis: {
      issue: String(raw.issue || 'No specific issue detected').slice(0, 500),
      category: raw.category || 'other',
      severity,
      priority: severityToPriority(severity),
      confidence: clamp(raw.confidence, 0, 100),
      healthScore: raw.health_score ?? null,
      probableCauses,
      affectedComponents: (raw.affected_components || []).map((s) => String(s).slice(0, 100)),
      rootCause: raw.root_cause || raw.issue || null,
      recommendations: (raw.recommendations || []).map((s) => String(s).slice(0, 500)),
      repairSteps: (raw.repair_steps || []).map((s) => String(s).slice(0, 500)),
      estimatedCost: {
        min: clamp(raw.estimated_cost?.min, 0, 1e9),
        max: clamp(raw.estimated_cost?.max, 0, 1e9),
        currency: raw.estimated_cost?.currency || 'INR',
      },
      estimatedTime: {
        value: clamp(raw.estimated_time?.value, 0, 1e6),
        unit: raw.estimated_time?.unit || 'minutes',
      },
      difficulty: raw.difficulty || 'Moderate',
      preventionTips: (raw.prevention_tips || []).map((s) => String(s).slice(0, 500)),
      diyPossible: Boolean(raw.diy_possible),
    },
    sensorAnomalies,
    isMock,
    aiModel: 'gemini-1.5-flash',
    processingTime,
    kind,
  };
};

module.exports = {
  analyzeImage,
  analyzeVideo,
  analyzeAudio,
  analyzeSensor,
  analyzeMultimodal,
  generateFollowUpQuestions,
  refineDiagnosisFromAnswers,
  generatePrediction,
  detectSensorAnomalies,
};
