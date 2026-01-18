
const path = require("path");
const { test, assert, assertEqual, run } = require("./_testRunner");

const controller = require(path.join(__dirname, "..", "controllers", "telemetryController"));

console.log("\ntelemetryController tests\n───────────────────────");

test("controller exports the expected handlers", () => {
  assertEqual(typeof controller.ingest, "function");
  assertEqual(typeof controller.list, "function");
});

test("ingest rejects missing readings", async () => {

let statusCode = null;
  const fakeRes = {
    status: (code) => { statusCode = code; return fakeRes; },
    json: () => fakeRes,
  };
  const noopNext = () => {};
  await controller.ingest({ user: { _id: "u1" }, body: { deviceId: "d1" } }, fakeRes, noopNext);
  assertEqual(statusCode, 400);
});

test("ingest rejects missing deviceId", async () => {
  let statusCode = null;
  const fakeRes = {
    status: (code) => { statusCode = code; return fakeRes; },
    json: () => fakeRes,
  };
  const noopNext = () => {};
  await controller.ingest({ user: { _id: "u1" }, body: { readings: [] } }, fakeRes, noopNext);
  assertEqual(statusCode, 400);
});

run();
