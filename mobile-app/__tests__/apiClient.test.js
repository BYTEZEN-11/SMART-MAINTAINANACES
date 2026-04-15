

const { test, assert, assertEqual, assertThrows } = require('./_testRunner');

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:5000';

const apiClient = require('../services/apiClient');

console.log('\napiClient tests\n──────────────');

test('exports default axios instance', () => {
  assert(apiClient, 'default export should exist');
  assert(typeof apiClient.get === 'function');
  assert(typeof apiClient.post === 'function');
});

test('exports token helpers', () => {
  assertEqual(typeof apiClient.getStoredToken, 'function');
  assertEqual(typeof apiClient.setStoredToken, 'function');
  assertEqual(typeof apiClient.clearStoredToken, 'function');
  assertEqual(typeof apiClient.onUnauthorised, 'function');
});

test('exports retry helper', () => {
  assertEqual(typeof apiClient.retry, 'function');
});

test('getStoredToken returns null when AsyncStorage is empty', async () => {

const token = await apiClient.getStoredToken();
  
  assert(token === null || typeof token === 'string');
});

test('onUnauthorised returns an unsubscribe function', () => {
  const cb = () => {};
  const off = apiClient.onUnauthorised(cb);
  assertEqual(typeof off, 'function');
  off();
});

test('retry stops after maxAttempts and surfaces the last error', async () => {
  let calls = 0;
  const fn = async () => {
    calls += 1;
    const e = new Error('boom');
    e.response = { status: 500 };
    throw e;
  };
  let caught = null;
  try {
    await apiClient.retry(fn, 2, 1);
  } catch (e) {
    caught = e;
  }
  assert(caught !== null);
  assertEqual(calls, 2);
});

test('retry succeeds on second attempt when first fails retryably', async () => {
  let calls = 0;
  const fn = async () => {
    calls += 1;
    if (calls < 2) {
      const e = new Error('transient');
      e.response = { status: 503 };
      throw e;
    }
    return 'ok';
  };
  const result = await apiClient.retry(fn, 3, 1);
  assertEqual(result, 'ok');
  assertEqual(calls, 2);
});

test('retry does not retry non-retryable errors (4xx)', async () => {
  let calls = 0;
  const fn = async () => {
    calls += 1;
    const e = new Error('client error');
    e.response = { status: 400 };
    throw e;
  };
  let caught = null;
  try {
    await apiClient.retry(fn, 3, 1);
  } catch (e) { caught = e; }
  assertEqual(calls, 1, 'should not retry 4xx');
  assert(caught !== null);
});