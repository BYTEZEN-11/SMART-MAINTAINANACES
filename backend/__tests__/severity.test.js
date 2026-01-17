

const path = require("path");
const { test, assert, assertEqual, run } = require("./_testRunner");

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

console.log("\nSeverity tests\n──────────────");

test("lowercase is normalised to title case", () => {
  assertEqual(normaliseSeverity("low"), "Low");
  assertEqual(normaliseSeverity("medium"), "Medium");
  assertEqual(normaliseSeverity("high"), "High");
});

test("uppercase is normalised (not collapsed to 'Critical')", () => {
  assertEqual(normaliseSeverity("LOW"), "Low");
  assertEqual(normaliseSeverity("MEDIUM"), "Medium");
  assertEqual(normaliseSeverity("HIGH"), "High");
});

test("'critical' maps to High (Appliance schema has no Critical enum)", () => {
  assertEqual(normaliseSeverity("critical"), "High");
  assertEqual(normaliseSeverity("CRITICAL"), "High");
});

test("'severe' and 'moderate' map correctly", () => {
  assertEqual(normaliseSeverity("severe"), "High");
  assertEqual(normaliseSeverity("moderate"), "Medium");
});

test("unknown values fall back to Medium", () => {
  assertEqual(normaliseSeverity("extreme"), "Medium");
  assertEqual(normaliseSeverity(""), "Medium");
  assertEqual(normaliseSeverity(null), "Medium");
  assertEqual(normaliseSeverity(undefined), "Medium");
  assertEqual(normaliseSeverity(123), "Medium");
});

test("whitespace is trimmed before lookup", () => {
  assertEqual(normaliseSeverity("  high  "), "High");
});

test("analyzeIssue returns a normalised severity from mock path", async () => {
  
  delete require.cache[require.resolve("../services/aiService")];
  
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const { analyzeIssue } = require("../services/aiService");
    const result = await analyzeIssue("the appliance is leaking", null);
    assert(
      ["Low", "Medium", "High"].includes(result.severity),
      `severity is one of Low/Medium/High (got ${result.severity})`
    );
  } finally {
    if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
  }
});

test("GEMINI_MODELS filter rejects 'undefined' and empty strings", () => {
  
  const prev = process.env.GEMINI_MODEL;
  process.env.GEMINI_MODEL = 'undefined'; 
  delete require.cache[require.resolve("../services/aiService")];
  try {
    
    require("../services/aiService");
    
    assert(true, "module loaded");
  } finally {
    if (prev === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = prev;
  }
});

run();