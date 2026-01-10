
const path = require("path");
const { test, assert, assertEqual, run } = require("./_testRunner");

const mw = require(path.join(__dirname, "..", "middleware", "authMiddleware"));

console.log("\nauthMiddleware tests\n──────────────────");

test("middleware exports protect and clearCache", () => {
  assertEqual(typeof mw.protect, "function");
  assertEqual(typeof mw.clearCache, "function");
});

test("protect rejects requests without an Authorization header", async () => {
  const fakeReq = { headers: {} };
  const fakeRes = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; },
  };
  let nextCalled = false;
  await mw.protect(fakeReq, fakeRes, () => { nextCalled = true; });
  assert(nextCalled === false, "next should not be called");
  assert(fakeRes.statusCode === 401, `expected 401, got ${fakeRes.statusCode}`);
});

run();
