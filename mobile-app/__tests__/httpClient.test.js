

const { test, assert, assertEqual } = require('./_testRunner');

const isUsableUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('api.invalid.local')) return false;
  return /^https?:\/\
};

console.log('\nURL filter tests\n────────────────');

test('accepts a Render URL (the bug #2 fix)', () => {
  assert(isUsableUrl('https://ai-hma.onrender.com'));
  assert(isUsableUrl('https://ai-hma-backend.onrender.com/api'));
});

test('accepts a Vercel URL', () => {
  assert(isUsableUrl('https://ai-hma.vercel.app'));
});

test('accepts a localhost dev URL', () => {
  assert(isUsableUrl('http://localhost:5000'));
  assert(isUsableUrl('http://10.0.2.2:5000'));
});

test('rejects api.invalid.local', () => {
  assertEqual(isUsableUrl('https://api.invalid.local'), false);
});

test('rejects empty / non-string / missing scheme', () => {
  assertEqual(isUsableUrl(''), false);
  assertEqual(isUsableUrl(null), false);
  assertEqual(isUsableUrl(undefined), false);
  assertEqual(isUsableUrl('just-a-host'), false);
});

console.log('\nApiError tests\n──────────────');

const { ApiError, isConflict, isUnauthorized, isValidationError, isServerError } = require('../src/errors/ApiError');

test('ApiError carries status + data', () => {
  const e = new ApiError('boom', { status: 409, data: { foo: 1 } });
  assertEqual(e.message, 'boom');
  assertEqual(e.status, 409);
  assertEqual(e.data.foo, 1);
});

test('isConflict returns true for 409', () => {
  assertEqual(isConflict(new ApiError('x', { status: 409 })), true);
  assertEqual(isConflict(new Error('plain')), false);
});

test('isUnauthorized returns true for 401', () => {
  assertEqual(isUnauthorized(new ApiError('x', { status: 401 })), true);
});

test('isValidationError returns true for 400', () => {
  assertEqual(isValidationError(new ApiError('x', { status: 400 })), true);
});

test('isServerError returns true for 5xx', () => {
  assertEqual(isServerError(new ApiError('x', { status: 500 })), true);
  assertEqual(isServerError(new ApiError('x', { status: 503 })), true);
  assertEqual(isServerError(new ApiError('x', { status: 200 })), false);
});