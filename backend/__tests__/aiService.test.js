

const path = require("path");
const { test, assert, assertEqual, run } = require("./_testRunner");

const { analyzeIssue } = require(path.join(__dirname, "..", "services", "aiService"));

console.log("\naiService tests\n───────────────");

test("analyzeIssue returns a mock response when no API key is set", async () => {
  
  const original = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const result = await analyzeIssue("there is a water leak in the fridge", null);
    assert(typeof result === "object", "result should be an object");
    assert(typeof result.issue === "string" && result.issue.length > 0, "issue should be a non-empty string");
    assertEqual(result.severity, "High", "leak should be high severity");
    assert(typeof result.solution === "string", "solution should be a string");
  } finally {
    if (original !== undefined) process.env.GEMINI_API_KEY = original;
  }
});

test("analyzeIssue strips HTML and event handlers from AI output", async () => {

const result = await analyzeIssue("random noise coming from the AC", null);
  const json = JSON.stringify(result);
  assert(!/<script/i.test(json), "should not contain <script");
  assert(!/on\w+=/i.test(json), "should not contain on*= attributes");
});

test("analyzeIssue returns object even with empty input", async () => {
  const result = await analyzeIssue("", null);
  assert(result && typeof result === "object", "expected object");
  assert(result.issue, "expected a default issue");
});

run();
