

const path = require("path");
const { test, assert, assertEqual, run } = require("./_testRunner");

const {
  classifyReading,
  classifyPayload,
  zScore,
  DEFAULT_RANGES,
} = require(path.join(__dirname, "..", "services", "anomalyDetectionService"));

console.log("\nanomalyDetectionService tests\n─────────────────────────────");

test("classifyReading returns anomaly for out-of-range temperature", () => {
  const r = classifyReading("temperature", 200);
  assert(r.isAnomaly, "should be an anomaly");
  assertEqual(r.severity, "critical");
});

test("classifyReading returns anomaly for low temperature", () => {
  const r = classifyReading("temperature", -50);
  assert(r.isAnomaly);
  assertEqual(r.severity, "warn");
});

test("classifyReading returns no anomaly for normal temperature", () => {
  const r = classifyReading("temperature", 22);
  assert(!r.isAnomaly);
});

test("classifyReading tolerates garbage input", () => {
  const r = classifyReading("temperature", "not a number");
  assert(!r.isAnomaly);
});

test("classifyPayload returns anomalies list and readings list", () => {
  const { anomalies, readings } = classifyPayload({
    temperature: 22,
    humidity: 200, 
    vibration: 0,
  });
  assertEqual(readings.length, 3);
  assertEqual(anomalies.length, 1);
  assertEqual(anomalies[0].metric, "humidity");
});

test("classifyPayload returns empty results for empty input", () => {
  const { anomalies, readings } = classifyPayload({});
  assertEqual(anomalies.length, 0);
  assertEqual(readings.length, 0);
});

test("zScore returns 0 for flat array", () => {
  assertEqual(zScore([5, 5, 5, 5]), 0);
});

test("zScore returns 0 for empty/short array", () => {
  assertEqual(zScore([]), 0);
  assertEqual(zScore([5]), 0);
});

test("DEFAULT_RANGES has expected metrics", () => {
  assert(typeof DEFAULT_RANGES.temperature === "object");
  assert(typeof DEFAULT_RANGES.humidity === "object");
  assert(typeof DEFAULT_RANGES.power === "object");
});

run();
