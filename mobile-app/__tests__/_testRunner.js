

let _tests = [];

const test = (name, fn) => _tests.push({ name, fn });

const format = (val) => {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'string') return JSON.stringify(val);
  if (typeof val === 'function') return '[Function]';
  try { return JSON.stringify(val); } catch { return String(val); }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message || 'Assertion failed');
};

const assertEqual = (actual, expected, message) => {
  const a = format(actual);
  const e = format(expected);
  if (a !== e) throw new Error((message || 'assertEqual failed') + `: expected ${e}, got ${a}`);
};

const assertThrows = (fn, messageContains) => {
  let caught = null;
  try { fn(); } catch (e) { caught = e; }
  if (!caught) throw new Error('assertThrows: function did not throw');
  if (messageContains && !String(caught.message).includes(messageContains)) {
    throw new Error(
      `assertThrows: error message ${JSON.stringify(caught.message)} does not contain ${JSON.stringify(messageContains)}`
    );
  }
};

const assertDeepEqual = (actual, expected, message) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error((message || 'assertDeepEqual failed') + `\n  expected: ${e}\n  got:      ${a}`);
};

const run = async () => {
  let passed = 0;
  let failed = 0;
  const failures = [];
  for (const t of _tests) {
    try {
      await t.fn();
      passed++;
      console.log(`  ✓ ${t.name}`);
    } catch (err) {
      failed++;
      failures.push({ name: t.name, error: err });
      console.log(`  ✗ ${t.name}`);
      console.log(`    ${err.message}`);
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
};

module.exports = { test, assert, assertEqual, assertThrows, assertDeepEqual, run };