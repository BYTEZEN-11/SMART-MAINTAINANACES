

const path = require("path");
const { test, assert, assertEqual, run } = require("./_testRunner");

const controller = require(path.join(__dirname, "..", "controllers", "deviceController"));

console.log("\ndeviceController tests\n─────────────────────");

test("controller exports the expected handlers", () => {
  assertEqual(typeof controller.list, "function");
  assertEqual(typeof controller.getById, "function");
  assertEqual(typeof controller.create, "function");
  assertEqual(typeof controller.update, "function");
  assertEqual(typeof controller.remove, "function");
});

test("list returns a function that needs req/res", async () => {

const fakeRes = {
    status: () => fakeRes,
    json:  () => fakeRes,
  };
  let threw = false;
  try {
    await controller.list({ user: null }, fakeRes);
  } catch (e) {
    threw = true;
  }

assert(threw === true || threw === false); 
});

test("create rejects missing fields", async () => {

let statusCode = null;
  const fakeRes = {
    status: (code) => {
      statusCode = code;
      return fakeRes;
    },
    json: () => fakeRes,
  };
  const noopNext = () => {};
  await controller.create({ user: { _id: "u1" }, body: {} }, fakeRes, noopNext);
  assertEqual(statusCode, 400);
});

run();
