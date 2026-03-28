const axios = require('axios');

const _envModel = (process.env.GEMINI_MODEL || '').trim();
const GEMINI_MODELS = [
  _envModel,
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
].filter((m) => typeof m === 'string' && m.length > 0 && m !== 'undefined');
const GEMINI_API_VERSION = (process.env.GEMINI_API_VERSION || 'v1').trim();

const SEVERITY_NORMALISE = new Map([
  ['low', 'Low'],
  ['medium', 'Medium'],
  ['high', 'High'],
  ['critical', 'Critical'],
  ['moderate', 'Medium'],
  ['severe', 'High'],
]);
const normaliseSeverity = (raw) => {
  if (typeof raw !== 'string') return 'Medium';
  return SEVERITY_NORMALISE.get(raw.trim().toLowerCase()) || 'Medium';
};

const extractBalancedJson = (src) => {
  const s = String(src || '');
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
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

const DEVICE_PROMPTS = {
  laptop: "You are an expert laptop/computer technician. Analyze hardware and software issues.",
  desktop: "You are an expert desktop computer technician. Analyze hardware components and system issues.",
  mac: "You are an expert Apple Mac technician. Analyze macOS and hardware issues.",
  phone: "You are an expert mobile phone technician. Analyze smartphone hardware and software issues.",
  tablet: "You are an expert tablet technician. Analyze tablet hardware and software issues.",
  tv: "You are an expert TV technician. Analyze display, power, and connectivity issues.",
  fridge: "You are an expert refrigerator technician. Analyze cooling, compressor, and electrical issues.",
  ac: "You are an expert air conditioner technician. Analyze cooling, compressor, and refrigerant issues.",
  'washing-machine': "You are an expert washing machine technician. Analyze motor, drum, and water system issues.",
  microwave: "You are an expert microwave technician. Analyze magnetron, power, and heating issues.",
  router: "You are an expert network technician. Analyze connectivity, signal, and hardware issues."
};

const analyzeSoundPattern = async (deviceType, soundDescription, audioData) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
    return getSoundMockResponse(deviceType, soundDescription);
  }

  try {
    const prompt = `${DEVICE_PROMPTS[deviceType] || DEVICE_PROMPTS.laptop}

Sound Analysis:
Device Type: ${deviceType}
Sound Description: ${soundDescription}
${audioData ? `Audio Frequency Data: ${JSON.stringify(audioData.frequency)}` : ''}

Analyze the sound pattern and respond ONLY with valid JSON:
{
  "issue": "specific issue identified",
  "severity": "Low|Medium|High|Critical",
  "confidence": 85,
  "affectedComponents": ["component1", "component2"],
  "rootCause": "detailed root cause",
  "solution": "step-by-step solution",
  "estimatedCost": {"min": 500, "max": 2000},
  "urgency": "immediate|within-week|within-month|routine",
  "diyPossible": true/false,
  "preventiveMeasures": ["measure1", "measure2"]
}`;

    const response = await callGeminiAPI(prompt);
    return response;
  } catch (error) {
    console.error('Sound analysis error:', error.message);
    return getSoundMockResponse(deviceType, soundDescription);
  }
};

const analyzeVibrationPattern = async (deviceType, vibrationData) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
    return getVibrationMockResponse(deviceType, vibrationData);
  }

  try {
    const avgIntensity = vibrationData.intensity || 0;
    const frequency = vibrationData.frequency || 0;

    const prompt = `${DEVICE_PROMPTS[deviceType] || DEVICE_PROMPTS.laptop}

Vibration Analysis:
Device Type: ${deviceType}
Average Intensity: ${avgIntensity}
Frequency: ${frequency} Hz
Pattern: ${vibrationData.pattern || 'irregular'}

Analyze the vibration pattern and respond ONLY with valid JSON in the same format as sound analysis.`;

    const response = await callGeminiAPI(prompt);
    return response;
  } catch (error) {
    console.error('Vibration analysis error:', error.message);
    return getVibrationMockResponse(deviceType, vibrationData);
  }
};

const analyzeThermalData = async (deviceType, thermalData) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
    return getThermalMockResponse(deviceType, thermalData);
  }

  try {
    const prompt = `${DEVICE_PROMPTS[deviceType] || DEVICE_PROMPTS.laptop}

Thermal Analysis:
Device Type: ${deviceType}
Temperature Readings: ${JSON.stringify(thermalData.readings)}
Hot Spots Detected: ${thermalData.hotSpots?.length || 0}
Average Temperature: ${thermalData.avgTemp}°C
Max Temperature: ${thermalData.maxTemp}°C

Analyze the thermal data and respond ONLY with valid JSON in the same format.`;

    const response = await callGeminiAPI(prompt);
    return response;
  } catch (error) {
    console.error('Thermal analysis error:', error.message);
    return getThermalMockResponse(deviceType, thermalData);
  }
};

const analyzeVisualInspection = async (deviceType, imageUrls, description) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
    return getVisualMockResponse(deviceType, description);
  }

  try {
    const prompt = `${DEVICE_PROMPTS[deviceType] || DEVICE_PROMPTS.laptop}

Visual Inspection:
Device Type: ${deviceType}
Description: ${description}

Analyze the images for:
- Physical damage (cracks, dents, breaks)
- Swollen battery
- Burnt components
- Rust/corrosion
- Leakage
- Loose connections
- Dust accumulation
- Screen issues

Respond ONLY with valid JSON in the same format.`;

    const parts = [{ text: prompt }];

if (imageUrls && imageUrls.length > 0) {
      for (const imageUrl of imageUrls.slice(0, 3)) { 
        try {
          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 8000,
            maxContentLength: 4 * 1024 * 1024
          });

          const contentType = imageResponse.headers['content-type'] || '';
          if (contentType.startsWith('image/')) {
            parts.push({
              inline_data: {
                mime_type: contentType,
                data: Buffer.from(imageResponse.data).toString('base64')
              }
            });
          }
        } catch (imgError) {
          console.error('Failed to fetch image:', imgError.message);
        }
      }
    }

    const response = await callGeminiAPI(prompt, parts);
    return response;
  } catch (error) {
    console.error('Visual analysis error:', error.message);
    return getVisualMockResponse(deviceType, description);
  }
};

const analyzeSymptoms = async (deviceType, symptoms) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
    return getSymptomMockResponse(deviceType, symptoms);
  }

  try {
    const symptomText = symptoms.map(s => `Q: ${s.question}\nA: ${s.answer}`).join('\n\n');

    const prompt = `${DEVICE_PROMPTS[deviceType] || DEVICE_PROMPTS.laptop}

Symptom Analysis:
Device Type: ${deviceType}

${symptomText}

Based on these symptoms, diagnose the issue and respond ONLY with valid JSON in the same format.`;

    const response = await callGeminiAPI(prompt);
    return response;
  } catch (error) {
    console.error('Symptom analysis error:', error.message);
    return getSymptomMockResponse(deviceType, symptoms);
  }
};

const comprehensiveDiagnostic = async (deviceType, allData) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
    return getComprehensiveMockResponse(deviceType, allData);
  }

  try {
    const prompt = `${DEVICE_PROMPTS[deviceType] || DEVICE_PROMPTS.laptop}

Comprehensive Diagnostic Analysis:
Device Type: ${deviceType}
Device Name: ${allData.deviceName}

Available Data:
${allData.soundData ? `- Sound: ${allData.soundData}` : ''}
${allData.vibrationData ? `- Vibration: ${JSON.stringify(allData.vibrationData)}` : ''}
${allData.thermalData ? `- Thermal: ${JSON.stringify(allData.thermalData)}` : ''}
${allData.visualData ? `- Visual: ${allData.visualData}` : ''}
${allData.symptoms ? `- Symptoms: ${JSON.stringify(allData.symptoms)}` : ''}
${allData.performanceData ? `- Performance: ${JSON.stringify(allData.performanceData)}` : ''}
${allData.batteryData ? `- Battery: ${JSON.stringify(allData.batteryData)}` : ''}

Perform a comprehensive analysis combining all available data and respond ONLY with valid JSON in the same format.`;

    const response = await callGeminiAPI(prompt);
    return response;
  } catch (error) {
    console.error('Comprehensive analysis error:', error.message);
    return getComprehensiveMockResponse(deviceType, allData);
  }
};

const callGeminiAPI = async (prompt, parts = null) => {
  const requestParts = parts || [{ text: prompt }];

  let response;
  let lastErr;
  for (const model of GEMINI_MODELS) {
    try {
      response = await axios.post(
        `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { contents: [{ parts: requestParts }] },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 20000,
        },
      );
      break;
    } catch (e) {
      lastErr = e;
      const status = e.response?.status;
      if (status && status >= 400 && status < 500 && status !== 404 && status !== 429) {
        throw e;
      }
    }
  }
  if (!response) throw lastErr || new Error('All Gemini models failed');

  if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }

  const raw = response.data.candidates[0].content.parts[0].text.trim();
  const cleaned = raw.replace(/```json|```/g, '').trim();

  const jsonContent = extractBalancedJson(cleaned);
  if (!jsonContent) throw new Error('No JSON found in Gemini response');
  const result = JSON.parse(jsonContent);

if (result.severity) {
    result.severity = normaliseSeverity(result.severity);
  }

  return result;
};

const getSoundMockResponse = (deviceType, description) => {
  const lowerDesc = (description || '').toLowerCase();
  
  if (lowerDesc.includes('grinding') || lowerDesc.includes('scraping')) {
    return {
      issue: 'Bearing or motor wear detected',
      severity: 'High',
      confidence: 75,
      affectedComponents: ['Motor bearing', 'Drive mechanism'],
      rootCause: 'Worn bearings causing friction and grinding noise',
      solution: 'Replace worn bearings. Lubricate moving parts. If motor is damaged, replacement may be needed.',
      estimatedCost: { min: 1000, max: 5000 },
      urgency: 'within-week',
      diyPossible: false,
      preventiveMeasures: ['Regular lubrication', 'Avoid overloading', 'Annual maintenance']
    };
  } else if (lowerDesc.includes('clicking') || lowerDesc.includes('ticking')) {
    return {
      issue: 'Mechanical component failure or hard disk issue',
      severity: 'High',
      confidence: 80,
      affectedComponents: deviceType.includes('laptop') || deviceType.includes('desktop') ? ['Hard disk', 'Fan'] : ['Relay', 'Compressor'],
      rootCause: 'Failing mechanical component or electrical relay',
      solution: deviceType.includes('laptop') ? 'Backup data immediately. Replace hard disk or check fan.' : 'Check relay and compressor. May need replacement.',
      estimatedCost: { min: 2000, max: 8000 },
      urgency: 'immediate',
      diyPossible: false,
      preventiveMeasures: ['Regular backups', 'Monitor performance', 'Professional inspection']
    };
  } else if (lowerDesc.includes('buzzing') || lowerDesc.includes('humming')) {
    return {
      issue: 'Electrical interference or loose component',
      severity: 'Medium',
      confidence: 70,
      affectedComponents: ['Power supply', 'Transformer', 'Capacitor'],
      rootCause: 'Electrical component vibration or loose connection',
      solution: 'Tighten all connections. Check for loose screws. Inspect power supply and capacitors.',
      estimatedCost: { min: 500, max: 3000 },
      urgency: 'within-month',
      diyPossible: true,
      preventiveMeasures: ['Regular inspection', 'Proper ventilation', 'Voltage stabilizer']
    };
  }
  
  return {
    issue: 'Unusual sound detected - requires inspection',
    severity: 'Medium',
    confidence: 60,
    affectedComponents: ['Unknown - needs physical inspection'],
    rootCause: 'Unable to determine from sound description alone',
    solution: 'Professional inspection recommended. Check for loose parts, debris, or worn components.',
    estimatedCost: { min: 500, max: 3000 },
    urgency: 'within-month',
    diyPossible: false,
    preventiveMeasures: ['Regular maintenance', 'Keep clean', 'Monitor for changes']
  };
};

const getVibrationMockResponse = (deviceType, vibrationData) => {
  const intensity = vibrationData.intensity || 0;
  
  if (intensity > 50) {
    return {
      issue: 'Excessive vibration - unbalanced or loose components',
      severity: 'High',
      confidence: 80,
      affectedComponents: ['Motor', 'Mounting', 'Drum/Fan'],
      rootCause: 'Unbalanced load, worn bearings, or loose mounting',
      solution: 'Check and tighten all mounting bolts. Balance load. Inspect bearings and replace if worn.',
      estimatedCost: { min: 1000, max: 4000 },
      urgency: 'within-week',
      diyPossible: true,
      preventiveMeasures: ['Proper loading', 'Level installation', 'Regular inspection']
    };
  } else if (intensity > 20) {
    return {
      issue: 'Moderate vibration detected',
      severity: 'Medium',
      confidence: 70,
      affectedComponents: ['Mounting', 'Leveling'],
      rootCause: 'Device not properly leveled or minor imbalance',
      solution: 'Adjust leveling feet. Ensure device is on stable surface. Check for proper installation.',
      estimatedCost: { min: 0, max: 500 },
      urgency: 'within-month',
      diyPossible: true,
      preventiveMeasures: ['Proper installation', 'Stable surface', 'Regular checks']
    };
  }
  
  return {
    issue: 'Normal vibration levels',
    severity: 'Low',
    confidence: 90,
    affectedComponents: [],
    rootCause: 'Normal operation',
    solution: 'No action needed. Vibration is within normal range.',
    estimatedCost: { min: 0, max: 0 },
    urgency: 'routine',
    diyPossible: true,
    preventiveMeasures: ['Continue monitoring', 'Regular maintenance']
  };
};

const getThermalMockResponse = (deviceType, thermalData) => {
  const maxTemp = thermalData.maxTemp || 0;
  
  if (maxTemp > 80) {
    return {
      issue: 'Critical overheating detected',
      severity: 'Critical',
      confidence: 90,
      affectedComponents: ['Cooling system', 'Thermal paste', 'Fans'],
      rootCause: 'Inadequate cooling, blocked vents, or thermal paste degradation',
      solution: 'Clean all vents and fans. Replace thermal paste. Check fan operation. Ensure proper ventilation.',
      estimatedCost: { min: 500, max: 3000 },
      urgency: 'immediate',
      diyPossible: true,
      preventiveMeasures: ['Regular cleaning', 'Proper ventilation', 'Thermal paste replacement every 2 years']
    };
  } else if (maxTemp > 60) {
    return {
      issue: 'Elevated temperature detected',
      severity: 'Medium',
      confidence: 75,
      affectedComponents: ['Cooling system', 'Ventilation'],
      rootCause: 'Dust accumulation or insufficient airflow',
      solution: 'Clean dust from vents and fans. Ensure adequate space around device for airflow.',
      estimatedCost: { min: 0, max: 1000 },
      urgency: 'within-month',
      diyPossible: true,
      preventiveMeasures: ['Monthly cleaning', 'Proper placement', 'Avoid blocking vents']
    };
  }
  
  return {
    issue: 'Normal temperature range',
    severity: 'Low',
    confidence: 95,
    affectedComponents: [],
    rootCause: 'Normal operation',
    solution: 'No action needed. Temperature is within normal range.',
    estimatedCost: { min: 0, max: 0 },
    urgency: 'routine',
    diyPossible: true,
    preventiveMeasures: ['Continue monitoring', 'Regular cleaning']
  };
};

const getVisualMockResponse = (deviceType, description) => {
  return {
    issue: 'Visual inspection completed',
    severity: 'Medium',
    confidence: 65,
    affectedComponents: ['Requires detailed analysis'],
    rootCause: 'Based on visual inspection',
    solution: 'Professional inspection recommended for accurate diagnosis.',
    estimatedCost: { min: 500, max: 5000 },
    urgency: 'within-month',
    diyPossible: false,
    preventiveMeasures: ['Regular inspection', 'Proper handling', 'Protective measures']
  };
};

const getSymptomMockResponse = (deviceType, symptoms) => {
  return {
    issue: 'Issue identified based on symptoms',
    severity: 'Medium',
    confidence: 70,
    affectedComponents: ['Multiple components possible'],
    rootCause: 'Based on reported symptoms',
    solution: 'Professional diagnosis recommended for accurate solution.',
    estimatedCost: { min: 1000, max: 5000 },
    urgency: 'within-week',
    diyPossible: false,
    preventiveMeasures: ['Regular maintenance', 'Monitor symptoms', 'Professional checkup']
  };
};

const getComprehensiveMockResponse = (deviceType, allData) => {
  return {
    issue: 'Comprehensive diagnostic completed',
    severity: 'Medium',
    confidence: 75,
    affectedComponents: ['Multiple systems analyzed'],
    rootCause: 'Based on comprehensive data analysis',
    solution: 'Detailed professional inspection recommended based on multiple indicators.',
    estimatedCost: { min: 1000, max: 8000 },
    urgency: 'within-week',
    diyPossible: false,
    preventiveMeasures: ['Regular comprehensive checkups', 'Preventive maintenance', 'Professional servicing']
  };
};

const analyzePerformance = async (deviceType, performanceData) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
    return getPerformanceMockResponse(deviceType, performanceData);
  }
  try {
    const prompt = `${DEVICE_PROMPTS[deviceType] || DEVICE_PROMPTS.laptop}

Performance Metrics:
Device Type: ${deviceType}
CPU Usage: ${performanceData?.cpuUsage ?? 'N/A'}%
Memory Usage: ${performanceData?.memoryUsage ?? 'N/A'}%
Disk Usage: ${performanceData?.diskUsage ?? 'N/A'}%
Response Time: ${performanceData?.responseTime ?? 'N/A'}ms
Benchmark Score: ${performanceData?.benchmarkScore ?? 'N/A'}

Analyze and respond ONLY with valid JSON in the same format.`;
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Performance analysis error:', error.message);
    return getPerformanceMockResponse(deviceType, performanceData);
  }
};

const getPerformanceMockResponse = (deviceType, data = {}) => {
  const cpu = Number(data.cpuUsage) || 0;
  const mem = Number(data.memoryUsage) || 0;
  const disk = Number(data.diskUsage) || 0;
  const resp = Number(data.responseTime) || 0;

  if (cpu > 90 || mem > 90) {
    return {
      issue: 'System overloaded - high resource usage',
      severity: 'High',
      confidence: 80,
      affectedComponents: ['CPU', 'RAM', 'System processes'],
      rootCause: `CPU at ${cpu}% and/or memory at ${mem}% - system is overburdened`,
      solution: 'Close unused applications. Disable startup programs. Consider upgrading RAM or replacing thermal paste. Run disk cleanup.',
      estimatedCost: { min: 0, max: 8000 },
      urgency: 'within-week',
      diyPossible: true,
      preventiveMeasures: ['Regular restarts', 'Limit background apps', 'Add more RAM if consistently high']
    };
  }
  if (disk > 90 || resp > 1000) {
    return {
      issue: 'Storage nearly full or slow I/O',
      severity: 'Medium',
      confidence: 75,
      affectedComponents: ['Disk', 'File system'],
      rootCause: `Disk ${disk}% full or response time ${resp}ms indicates I/O bottleneck`,
      solution: 'Free up disk space. Disable hibernation file. Run disk cleanup and defragmenter (HDD only). Consider SSD upgrade.',
      estimatedCost: { min: 0, max: 5000 },
      urgency: 'within-month',
      diyPossible: true,
      preventiveMeasures: ['Keep 15%+ free space', 'Regular cleanup', 'Move large files to external drive']
    };
  }
  return {
    issue: 'Performance within acceptable range',
    severity: 'Low',
    confidence: 90,
    affectedComponents: [],
    rootCause: 'Resource usage is healthy',
    solution: 'No action needed. Continue regular maintenance.',
    estimatedCost: { min: 0, max: 0 },
    urgency: 'routine',
    diyPossible: true,
    preventiveMeasures: ['Periodic restarts', 'Keep OS updated', 'Monitor trends']
  };
};

const analyzeBatteryHealth = async (deviceType, batteryData) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
    return getBatteryMockResponse(deviceType, batteryData);
  }
  try {
    const prompt = `${DEVICE_PROMPTS[deviceType] || DEVICE_PROMPTS.laptop}

Battery Health:
Device Type: ${deviceType}
Capacity: ${batteryData?.capacity ?? 'N/A'}%
Cycle Count: ${batteryData?.cycleCount ?? 'N/A'}
Voltage: ${batteryData?.voltage ?? 'N/A'}V
Temperature: ${batteryData?.temperature ?? 'N/A'}°C
Swollen: ${batteryData?.isSwollen ? 'YES' : 'No'}

Respond ONLY with valid JSON in the same format.`;
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Battery analysis error:', error.message);
    return getBatteryMockResponse(deviceType, batteryData);
  }
};

const getBatteryMockResponse = (deviceType, data = {}) => {
  if (data.isSwollen) {
    return {
      issue: 'CRITICAL: Swollen battery detected',
      severity: 'Critical',
      confidence: 95,
      affectedComponents: ['Battery', 'Chassis', 'Motherboard (risk)'],
      rootCause: 'Battery swelling usually indicates gas buildup from overcharge, age, or heat damage',
      solution: 'STOP using the device immediately. Do not charge. Place in a fireproof container and contact a service center for replacement. Risk of fire.',
      estimatedCost: { min: 3000, max: 12000 },
      urgency: 'immediate',
      diyPossible: false,
      preventiveMeasures: ['Avoid high temperatures', 'Use original charger', 'Replace every 2-3 years']
    };
  }
  const capacity = Number(data.capacity) || 100;
  const cycles = Number(data.cycleCount) || 0;
  const temp = Number(data.temperature) || 25;

  if (temp > 45) {
    return {
      issue: 'Battery overheating',
      severity: 'High',
      confidence: 85,
      affectedComponents: ['Battery', 'Charging circuit'],
      rootCause: `Battery running at ${temp}°C during operation`,
      solution: 'Stop heavy use. Remove case. Move to cool environment. Avoid charging while using intensive apps.',
      estimatedCost: { min: 0, max: 6000 },
      urgency: 'within-week',
      diyPossible: true,
      preventiveMeasures: ['Avoid hot environments', 'Remove case when charging', 'Use original charger']
    };
  }
  if (capacity < 60 || cycles > 1000) {
    return {
      issue: 'Battery significantly degraded',
      severity: 'High',
      confidence: 80,
      affectedComponents: ['Battery'],
      rootCause: `Capacity at ${capacity}% after ${cycles} cycles. Replacement recommended.`,
      solution: 'Replace the battery. Avoid full discharge cycles. Calibrate once a month.',
      estimatedCost: { min: 2000, max: 9000 },
      urgency: 'within-week',
      diyPossible: false,
      preventiveMeasures: ['Avoid deep discharges', 'Keep between 20-80%', 'Avoid heat']
    };
  }
  if (capacity < 80) {
    return {
      issue: 'Battery showing normal wear',
      severity: 'Medium',
      confidence: 70,
      affectedComponents: ['Battery'],
      rootCause: `Capacity at ${capacity}% - within expected wear range`,
      solution: 'Continue normal use. Recalibrate battery monthly. Replace when capacity drops below 70%.',
      estimatedCost: { min: 0, max: 5000 },
      urgency: 'routine',
      diyPossible: true,
      preventiveMeasures: ['Monthly calibration', 'Avoid heat', 'Use appropriate charger']
    };
  }
  return {
    issue: 'Battery health is good',
    severity: 'Low',
    confidence: 92,
    affectedComponents: [],
    rootCause: `Capacity at ${capacity}% after ${cycles} cycles - healthy`,
    solution: 'No action needed. Continue good charging habits.',
    estimatedCost: { min: 0, max: 0 },
    urgency: 'routine',
    diyPossible: true,
    preventiveMeasures: ['Maintain 20-80% range', 'Avoid full discharge', 'Keep cool']
  };
};

const analyzeStorageHealth = async (deviceType, storageData) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
    return getStorageMockResponse(deviceType, storageData);
  }
  try {
    const prompt = `${DEVICE_PROMPTS[deviceType] || DEVICE_PROMPTS.laptop}

Storage Health:
Device Type: ${deviceType}
Used: ${storageData?.usedSpace ?? 'N/A'} of ${storageData?.totalSpace ?? 'N/A'} GB
SMART Status: ${storageData?.smartStatus ?? 'unknown'}
Bad Sectors: ${storageData?.badSectors ?? 0}
Read Errors: ${storageData?.readErrors ?? 0}
Write Errors: ${storageData?.writeErrors ?? 0}

Respond ONLY with valid JSON in the same format.`;
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Storage analysis error:', error.message);
    return getStorageMockResponse(deviceType, storageData);
  }
};

const getStorageMockResponse = (deviceType, data = {}) => {
  const badSectors = Number(data.badSectors) || 0;
  const readErrors = Number(data.readErrors) || 0;
  const writeErrors = Number(data.writeErrors) || 0;
  const used = Number(data.usedSpace) || 0;
  const total = Number(data.totalSpace) || 1;
  const usedPct = (used / total) * 100;

  if (badSectors > 10 || readErrors + writeErrors > 5) {
    return {
      issue: 'CRITICAL: Storage device failing',
      severity: 'Critical',
      confidence: 95,
      affectedComponents: ['Storage drive', 'Data integrity'],
      rootCause: `${badSectors} bad sectors and ${readErrors + writeErrors} I/O errors indicate imminent failure`,
      solution: 'BACKUP DATA IMMEDIATELY. Replace the drive. Do not continue using.',
      estimatedCost: { min: 3000, max: 15000 },
      urgency: 'immediate',
      diyPossible: false,
      preventiveMeasures: ['Regular backups', 'Monitor SMART data', 'Replace before failure']
    };
  }
  if (badSectors > 0 || (readErrors + writeErrors) > 0) {
    return {
      issue: 'Early signs of drive failure',
      severity: 'High',
      confidence: 80,
      affectedComponents: ['Storage drive'],
      rootCause: 'Minor bad sectors or I/O errors detected',
      solution: 'Backup all data now. Plan to replace drive within 30 days. Run chkdsk/disk utility.',
      estimatedCost: { min: 0, max: 10000 },
      urgency: 'within-week',
      diyPossible: true,
      preventiveMeasures: ['Immediate backup', 'Replace soon', 'Monitor weekly']
    };
  }
  if (usedPct > 90) {
    return {
      issue: 'Storage nearly full',
      severity: 'Medium',
      confidence: 85,
      affectedComponents: ['File system performance'],
      rootCause: `Drive ${Math.round(usedPct)}% full - affects performance`,
      solution: 'Free up space immediately. Move files to external/cloud storage. Uninstall unused applications.',
      estimatedCost: { min: 0, max: 5000 },
      urgency: 'within-month',
      diyPossible: true,
      preventiveMeasures: ['Keep 15%+ free', 'Regular cleanup', 'Cloud backup']
    };
  }
  return {
    issue: 'Storage health is good',
    severity: 'Low',
    confidence: 90,
    affectedComponents: [],
    rootCause: 'No errors detected',
    solution: 'No action needed. Continue regular backups.',
    estimatedCost: { min: 0, max: 0 },
    urgency: 'routine',
    diyPossible: true,
    preventiveMeasures: ['Regular backups', 'Monitor SMART', 'Keep 15% free']
  };
};

const analyzeConnectivity = async (deviceType, connectivityData) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
    return getConnectivityMockResponse(deviceType, connectivityData);
  }
  try {
    const prompt = `${DEVICE_PROMPTS[deviceType] || DEVICE_PROMPTS.router}

Connectivity Status:
Device Type: ${deviceType}
WiFi: ${connectivityData?.wifi ? 'Working' : 'Not working'}
Bluetooth: ${connectivityData?.bluetooth ? 'Working' : 'Not working'}
Ethernet: ${connectivityData?.ethernet ? 'Connected' : 'Not connected'}
USB: ${connectivityData?.usb ? 'Working' : 'Not working'}
HDMI: ${connectivityData?.hdmi ? 'Working' : 'Not working'}
Signal Strength: ${connectivityData?.signalStrength ?? 'N/A'}%

Respond ONLY with valid JSON in the same format.`;
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Connectivity analysis error:', error.message);
    return getConnectivityMockResponse(deviceType, connectivityData);
  }
};

const getConnectivityMockResponse = (deviceType, data = {}) => {

const isFailed = (v) => v === false || v === 'failed' || v === 'down' || v === 'no';
  const failed = [];
  if (isFailed(data.wifi)) failed.push('WiFi');
  if (isFailed(data.bluetooth)) failed.push('Bluetooth');
  if (isFailed(data.ethernet)) failed.push('Ethernet');
  if (isFailed(data.usb)) failed.push('USB');
  if (isFailed(data.hdmi)) failed.push('HDMI');

  if (failed.length === 0) {
    return {
      issue: 'All connectivity interfaces working',
      severity: 'Low',
      confidence: 95,
      affectedComponents: [],
      rootCause: 'All tested interfaces respond normally',
      solution: 'No action needed. Continue routine testing.',
      estimatedCost: { min: 0, max: 0 },
      urgency: 'routine',
      diyPossible: true,
      preventiveMeasures: ['Keep drivers updated', 'Avoid physical stress on ports']
    };
  }
  const severity = failed.length >= 3 ? 'High' : 'Medium';
  return {
    issue: `Connectivity issues on ${failed.length} interface(s)`,
    severity,
    confidence: 75,
    affectedComponents: failed,
    rootCause: `Not working: ${failed.join(', ')}`,
    solution: 'Restart device. Update drivers. Test ports with another device. Check for physical damage. Try different cable.',
    estimatedCost: { min: 0, max: 4000 },
    urgency: severity === 'High' ? 'within-week' : 'within-month',
    diyPossible: true,
    preventiveMeasures: ['Update drivers regularly', 'Handle ports carefully', 'Use surge protection']
  };
};

const analyzePower = async (deviceType, powerData) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
    return getPowerMockResponse(deviceType, powerData);
  }
  try {
    const prompt = `${DEVICE_PROMPTS[deviceType] || DEVICE_PROMPTS.laptop}

Power Metrics:
Device Type: ${deviceType}
Voltage: ${powerData?.voltage ?? 'N/A'}V
Current: ${powerData?.current ?? 'N/A'}A
Power: ${powerData?.power ?? 'N/A'}W
Power Factor: ${powerData?.powerFactor ?? 'N/A'}

Respond ONLY with valid JSON in the same format.`;
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Power analysis error:', error.message);
    return getPowerMockResponse(deviceType, powerData);
  }
};

const getPowerMockResponse = (deviceType, data = {}) => {
  const voltage = Number(data.voltage) || 0;
  const pf = Number(data.powerFactor) || 1;
  const current = Number(data.current) || 0;

const voltageOff = voltage > 0 && (voltage < 200 || voltage > 250);

  if (voltageOff) {
    return {
      issue: 'Abnormal voltage detected',
      severity: 'High',
      confidence: 85,
      affectedComponents: ['Power supply', 'Electrical system'],
      rootCause: `Voltage reading ${voltage}V is outside safe operating range (200-250V)`,
      solution: 'Use a voltage stabilizer. Check wiring. Unplug during storms. Consider UPS for sensitive electronics.',
      estimatedCost: { min: 1500, max: 8000 },
      urgency: 'within-week',
      diyPossible: false,
      preventiveMeasures: ['Use voltage stabilizer', 'Install surge protector', 'Annual electrical inspection']
    };
  }
  if (pf > 0 && pf < 0.7) {
    return {
      issue: 'Low power factor - inefficient power usage',
      severity: 'Medium',
      confidence: 70,
      affectedComponents: ['Power supply', 'Capacitors'],
      rootCause: `Power factor ${pf} indicates reactive power loss`,
      solution: 'Install power factor correction capacitor. Check for failing capacitors in power supply.',
      estimatedCost: { min: 800, max: 4000 },
      urgency: 'routine',
      diyPossible: false,
      preventiveMeasures: ['Use PFC power supplies', 'Regular maintenance']
    };
  }
  if (current > 15) {
    return {
      issue: 'High current draw detected',
      severity: 'Medium',
      confidence: 75,
      affectedComponents: ['Circuit', 'Power supply'],
      rootCause: `Current draw ${current}A is above typical operating range`,
      solution: 'Reduce load. Check for short circuits. Ensure proper circuit breaker rating.',
      estimatedCost: { min: 0, max: 3000 },
      urgency: 'within-month',
      diyPossible: true,
      preventiveMeasures: ['Avoid daisy-chaining', 'Use proper rated circuits']
    };
  }
  return {
    issue: 'Power metrics within normal range',
    severity: 'Low',
    confidence: 90,
    affectedComponents: [],
    rootCause: 'Voltage, current, and power factor are healthy',
    solution: 'No action needed. Continue monitoring.',
    estimatedCost: { min: 0, max: 0 },
    urgency: 'routine',
    diyPossible: true,
    preventiveMeasures: ['Periodic checks', 'Use quality power strips']
  };
};

module.exports = {
  analyzeSoundPattern,
  analyzeVibrationPattern,
  analyzeThermalData,
  analyzeVisualInspection,
  analyzeSymptoms,
  comprehensiveDiagnostic,
  analyzePerformance,
  analyzeBatteryHealth,
  analyzeStorageHealth,
  analyzeConnectivity,
  analyzePower,
};
