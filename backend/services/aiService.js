const axios = require("axios")

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

const responseCache = new Map()
const CACHE_TTL = 10 * 60 * 1000 

const _envModel = (process.env.GEMINI_MODEL || '').trim();
const GEMINI_MODELS = [
  _envModel,
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
].filter((m) => typeof m === 'string' && m.length > 0 && m !== 'undefined');
const GEMINI_API_VERSION = (process.env.GEMINI_API_VERSION || 'v1beta').trim();

const ALLOWED_SEVERITIES = ['Low', 'Medium', 'High'];

const SEVERITY_NORMALISE = new Map([
  ['low', 'Low'],
  ['medium', 'Medium'],
  ['high', 'High'],
  ['critical', 'High'],   
  ['moderate', 'Medium'],
  ['severe', 'High'],
]);
const normaliseSeverity = (raw) => {
  if (typeof raw !== 'string') return 'Medium';
  const key = raw.trim().toLowerCase();
  return SEVERITY_NORMALISE.get(key) || 'Medium';
};

const SCRIPT_RE = /<script[\s\S]*?>[\s\S]*?<\/script>/gi
const ON_EVENT_RE = /\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi
const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i

const CONTROL_CHARS_RE = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]", "g")

const sanitizeString = (value) => {
  if (value === null || value === undefined) return ""
  if (typeof value !== "string") return String(value)
  return value
    .replace(SCRIPT_RE, "")
    .replace(ON_EVENT_RE, "")
    .replace(HTML_TAG_RE, "")
    .replace(CONTROL_CHARS_RE, "")
    .trim()
}

const sanitizeDiagnosisFields = (obj) => {
  if (!obj || typeof obj !== "object") return obj
  const out = { ...obj }
  for (const k of Object.keys(out)) {
    if (typeof out[k] === "string") {
      
      out[k] = sanitizeString(out[k]).slice(0, 2000)
    } else if (Array.isArray(out[k])) {
      out[k] = out[k]
        .map((v) => (typeof v === "string" ? sanitizeString(v).slice(0, 500) : v))
        .filter(Boolean)
    }
  }
  return out
}

const analyzeIssue = async (text, imageUrl) => {
  const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey.includes('your-') || apiKey.includes('Demo') || apiKey.length < 20) {
    console.warn("WARNING: Gemini API key not configured, using mock response");
    return getMockResponse(text);
  }

const cacheKey = !imageUrl ? `text:${(text || "").toLowerCase().trim()}` : null
  if (cacheKey) {
    const cached = responseCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) return cached.result
  }

  try {
    const prompt = `You are an expert home appliance technician. Analyze the following issue and respond ONLY with valid JSON in this exact format: { "issue": "...", "severity": "low|medium|high", "solution": "..." }

User's description: ${text || "No description provided"}

Be concise. Provide issue summary, severity, and practical solution.`

    const parts = [{ text: prompt }]

if (imageUrl) {
      try {
        const imageResponse = await axios.get(imageUrl, {
          responseType: "arraybuffer",
          timeout: 8000,
          maxContentLength: 4 * 1024 * 1024, 
        })

const contentType = imageResponse.headers["content-type"] || ""
        if (!contentType.startsWith("image/")) {
          console.warn("Invalid content type for image:", contentType)
        } else {
          parts.push({
            inline_data: {
              mime_type: contentType,
              data: Buffer.from(imageResponse.data).toString("base64"),
            },
          })
        }
      } catch (imgError) {
        console.error("Failed to fetch image:", imgError.message)
        
      }
    }

let response;
    let lastErr;
    for (const model of GEMINI_MODELS) {
      try {
        response = await axios.post(
          `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          { contents: [{ parts }] },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 20000, 
          }
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
      throw new Error("Invalid response from Gemini API: missing text content")
    }

    const raw = response.data.candidates[0].content.parts[0].text.trim()
    const cleaned = raw.replace(/```json|```/g, "").trim()

    let result
    try {
      const jsonContent = extractBalancedJson(cleaned);
      if (!jsonContent) throw new Error("No JSON found");
      result = JSON.parse(jsonContent);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response:", raw);
      throw new Error("Invalid format from AI service");
    }

if (!result.issue || !result.severity || !result.solution) {
      throw new Error("Gemini response missing required fields")
    }

result.severity = normaliseSeverity(result.severity);

result = sanitizeDiagnosisFields(result)

if (cacheKey) {
      responseCache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL })
    }

    return result
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message)
    return getMockResponse(text)
  }
}

const getMockResponse = (text) => {
  const lowerText = (text || "").toLowerCase()

  if (lowerText.includes("noise") || lowerText.includes("sound")) {
    return sanitizeDiagnosisFields({ issue: "Unusual noise detected", severity: "Medium", solution: "Check for loose parts or debris. Ensure the appliance is on a level surface. Contact a technician if noise persists." })
  } else if (lowerText.includes("leak") || lowerText.includes("water")) {
    return sanitizeDiagnosisFields({ issue: "Water leakage detected", severity: "High", solution: "Turn off immediately. Check hoses and door seals. Contact a technician for repair." })
  } else if (lowerText.includes("not cooling") || lowerText.includes("not cold")) {
    return sanitizeDiagnosisFields({ issue: "Cooling system not functioning", severity: "High", solution: "Clean air filters and vents. Ensure proper ventilation. Refrigerant may need recharging." })
  } else if (lowerText.includes("not heating")) {
    return sanitizeDiagnosisFields({ issue: "Heating element not working", severity: "High", solution: "Check power supply and circuit breaker. Contact a technician if heating element needs replacement." })
  } else if (lowerText.includes("smell") || lowerText.includes("odor")) {
    return sanitizeDiagnosisFields({ issue: "Unusual odor from appliance", severity: "Medium", solution: "Clean thoroughly. Check for burnt components. Contact technician if smell persists." })
  }

  return sanitizeDiagnosisFields({
    issue: "Appliance maintenance required",
    severity: "Medium",
    solution: "Perform a standard check-up. Inspect connections, clean filters, and ensure proper ventilation. Consult the manual for specific maintenance steps."
  })
}

const analyzeWithGemini = async (prompt, imageUrl = null) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.includes('your-') || apiKey.includes('Demo') || apiKey.length < 20) {
    console.warn("WARNING: Gemini API key not configured");
    return JSON.stringify({
      text: "I understand. Let me help you troubleshoot this issue. Can you provide more details about the problem?",
      stage: "gathering",
      collectedInfo: {},
      suspectedIssues: [],
      diagnosis: null
    });
  }

  try {
    const parts = [{ text: prompt }];

    if (imageUrl) {
      try {
        const imageResponse = await axios.get(imageUrl, {
          responseType: "arraybuffer",
          timeout: 8000,
          maxContentLength: 4 * 1024 * 1024,
        });

        const contentType = imageResponse.headers["content-type"] || "";
        if (contentType.startsWith("image/")) {
          parts.push({
            inline_data: {
              mime_type: contentType,
              data: Buffer.from(imageResponse.data).toString("base64"),
            },
          });
        }
      } catch (imgError) {
        console.error("Failed to fetch image:", imgError.message);
      }
    }

let response;
    let lastErr;
    for (const model of GEMINI_MODELS) {
      try {
        response = await axios.post(
          `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${apiKey}`,
          { contents: [{ parts }] },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 20000,
          }
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
      throw new Error("Invalid response from Gemini API");
    }

    return response.data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = { analyzeIssue, analyzeWithGemini, extractBalancedJson }
