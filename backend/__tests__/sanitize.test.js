

const path = require("path");
const { test, assert, assertEqual, assertThrows, run } = require("./_testRunner");

const { analyzeIssue } = require(path.join(__dirname, "..", "services", "aiService"));

console.log("\nSanitize tests\n──────────────");

test("analyzeIssue returns a sanitized object", async () => {
  const result = await analyzeIssue("there is a leak", null);
  assert(result.issue && typeof result.issue === "string", "issue is a string");
  assert(!/<\/?[a-z]/i.test(result.issue), "no HTML tags");
  assert(!/\bon\w+=/i.test(result.issue), "no on*= attrs");
});

test("analyzeIssue caps severity to one of the known values", async () => {
  const result = await analyzeIssue("weird smell", null);
  assert(["Low", "Medium", "High"].includes(result.severity), "severity normalized");
});

test("analyzeIssue handles empty input", async () => {
  const result = await analyzeIssue("", null);
  assert(result && result.severity, "has severity");
});

test("analyzeIssue handles null input", async () => {
  const result = await analyzeIssue(null, null);
  assert(result && result.severity, "has severity");
});

test("analyzeIssue does not throw on long input", async () => {
  const long = "noise ".repeat(2000);
  const result = await analyzeIssue(long, null);
  assert(result, "got result");
});

run();
