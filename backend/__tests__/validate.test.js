

const { test, assert, assertEqual, assertThrows, run } = require("./_testRunner");
const { validate, isObjectId, EMAIL_RE } = require("../src/middleware/validate");
const { ApiError, ValidationError } = require("../src/errors/ApiError");

const runValidator = (schema, body = {}, params = {}, query = {}) => {
  return new Promise((resolve, reject) => {
    const req = { body, params, query };
    const res = {};
    const next = (err) => {
      if (err) reject(err);
      else resolve(req);
    };
    validate(schema)(req, res, next);
  });
};

const assertRejects = async (promise, expectedMessage) => {
  let caught = null;
  try { await promise; } catch (e) { caught = e; }
  if (!caught) throw new Error("assertRejects: promise did not reject");
  if (expectedMessage && !String(caught.message).includes(expectedMessage)) {
    throw new Error(
      `assertRejects: error message ${JSON.stringify(caught.message)} does not contain ${JSON.stringify(expectedMessage)}`
    );
  }
  return caught;
};

console.log("\nValidator tests\n──────────────");

test("isObjectId accepts 24-char hex strings", () => {
  assert(isObjectId("507f1f77bcf86cd799439011"), "accepts a known good id");
  assert(!isObjectId("not-an-id"), "rejects garbage");
  assert(!isObjectId("507f1f77bcf86cd79943901"), "rejects too-short");
  assert(!isObjectId(123), "rejects non-strings");
});

test("EMAIL_RE matches simple addresses", () => {
  assert(EMAIL_RE.test("a@b.co"), "matches simple");
  assert(!EMAIL_RE.test("a@b"), "rejects no TLD");
  assert(!EMAIL_RE.test("@b.co"), "rejects no local-part");
});

test("required field is enforced", async () => {
  await assertRejects(
    runValidator({ body: { email: { type: "email", required: true } } }, {}),
    'is required'
  );
});

test("optional field falls back to default", async () => {
  const req = await runValidator(
    { body: { role: { type: "string", default: "user" } } },
    {}
  );
  assertEqual(req.body.role, "user", "default applied");
});

test("email field is lowercased", async () => {
  const req = await runValidator(
    { body: { email: { type: "email", required: true } } },
    { email: "USER@Example.COM" }
  );
  assertEqual(req.body.email, "user@example.com", "lowercased");
});

test("enum rejects out-of-range values", async () => {
  await assertRejects(
    runValidator({ body: { color: { type: "enum", values: ["red", "blue"] } } }, { color: "green" }),
    "must be one of"
  );
});

test("objectid field validates format", async () => {
  await assertRejects(
    runValidator({ body: { id: { type: "objectid", required: true } } }, { id: "nope" }),
    "ObjectId"
  );
  const req = await runValidator(
    { body: { id: { type: "objectid", required: true } } },
    { id: "507f1f77bcf86cd799439011" }
  );
  assertEqual(req.body.id, "507f1f77bcf86cd799439011", "valid id passes");
});

test("string length bounds are enforced", async () => {
  await assertRejects(
    runValidator(
      { body: { name: { type: "string", required: true, min: 2, max: 10 } } },
      { name: "a" }
    ),
    "at least 2"
  );
  await assertRejects(
    runValidator(
      { body: { name: { type: "string", required: true, min: 2, max: 10 } } },
      { name: "abcdefghijklm" }
    ),
    "at most 10"
  );
});

test("transform is applied to the parsed value", async () => {
  const req = await runValidator(
    { body: { code: { type: "string", required: true, transform: (s) => s.toUpperCase() } } },
    { code: "abc" }
  );
  assertEqual(req.body.code, "ABC", "transform applied");
});

test("ValidationError has statusCode 400", () => {
  const e = new ValidationError("bad", { field: "x" });
  assertEqual(e.statusCode, 400);
  assertEqual(e.name, "ValidationError");
  assert(e instanceof ApiError);
});

run();