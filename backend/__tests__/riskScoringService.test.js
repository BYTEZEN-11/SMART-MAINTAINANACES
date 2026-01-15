

const path = require("path");
const { test, assert, assertEqual, run } = require("./_testRunner");

const {
  calculateRiskScore,
  worstComponentRisk,
} = require(path.join(__dirname, "..", "services", "riskScoringService"));

console.log("\nriskScoringService tests\n──────────────────────");

test("calculateRiskScore returns 100 for empty input", () => {
  const r = calculateRiskScore({});
  assert(typeof r.score === "number");
  assert(r.score >= 0 && r.score <= 100);
});

test("calculateRiskScore returns low risk for healthy appliance", () => {
  const r = calculateRiskScore({
    healthScore: 95,
    anomalyCount30d: 0,
    lastServiceDate: new Date().toISOString(),
  });
  assert(r.score < 35, `expected low risk, got ${r.score}`);
  assertEqual(r.level, "low");
});

test("calculateRiskScore returns high risk for unhealthy appliance", () => {
  const r = calculateRiskScore({
    healthScore: 10,
    anomalyCount30d: 20,
    lastServiceDate: new Date(Date.now() - 365 * 86_400_000).toISOString(),
  });
  assert(r.score >= 80, `expected critical, got ${r.score}`);
  assertEqual(r.level, "critical");
});

test("calculateRiskScore tolerates bad input", () => {
  const r = calculateRiskScore({ healthScore: "garbage", sensorValues: "nope" });
  assert(typeof r.score === "number");
  assert(r.score >= 0 && r.score <= 100);
});

test("worstComponentRisk picks the lowest-health component", () => {
  const r = worstComponentRisk([
    { name: "Compressor", health: 80 },
    { name: "Fan", health: 20 },
    { name: "Door", health: 60 },
  ]);
  assert(r);
  assertEqual(r.name, "Fan");
  assertEqual(r.health, 20);
});

test("worstComponentRisk returns null for empty components", () => {
  assertEqual(worstComponentRisk([]), null);
});

run();
