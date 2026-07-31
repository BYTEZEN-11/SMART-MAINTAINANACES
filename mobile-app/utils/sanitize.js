

const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i;

const CONTROL_CHARS_RE = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]",
  "g"
);
const SCRIPT_RE = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
const ON_EVENT_RE = /\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

export const sanitizeText = (input) => {
  if (input === null || input === undefined) return "";
  if (typeof input !== "string") {
    return String(input);
  }
  return input
    .replace(SCRIPT_RE, "")
    .replace(ON_EVENT_RE, "")
    .replace(HTML_TAG_RE, "")
    .replace(CONTROL_CHARS_RE, "")
    .trim();
};

export const sanitizeDeep = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return sanitizeText(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeDeep(v);
    }
    return out;
  }
  return null;
};

export const sanitizeDiagnosis = (diagnosis) => {
  if (!diagnosis || typeof diagnosis !== "object") return diagnosis;
  const stringFields = [
    "issue",
    "severity",
    "rootCause",
    "solution",
    "urgency",
    "diyPossible",
  ];
  const out = { ...diagnosis };
  for (const f of stringFields) {
    if (typeof out[f] === "string") out[f] = sanitizeText(out[f]);
  }
  if (Array.isArray(out.affectedComponents)) {
    out.affectedComponents = out.affectedComponents
      .map((s) => (typeof s === "string" ? sanitizeText(s) : s))
      .filter(Boolean);
  }
  if (Array.isArray(out.preventiveMeasures)) {
    out.preventiveMeasures = out.preventiveMeasures
      .map((s) => (typeof s === "string" ? sanitizeText(s) : s))
      .filter(Boolean);
  }
  return out;
};

export const sanitizeChatMessage = (msg, maxLength = 4000) => {
  const cleaned = sanitizeText(msg);
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength) + "…";
};

export default {
  sanitizeText,
  sanitizeDeep,
  sanitizeDiagnosis,
  sanitizeChatMessage,
};
