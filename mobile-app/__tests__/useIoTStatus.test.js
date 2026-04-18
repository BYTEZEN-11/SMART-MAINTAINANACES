

const { test, assert, assertEqual } = require('./_testRunner');

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:5000';

const api = require('../services/api');

console.log('\nuseIoTStatus tests\n─────────────────');

test('api client has the methods the hook uses', () => {
  assertEqual(typeof api.get, 'function');
  assertEqual(typeof api.post, 'function');
});

test('hook module is loadable (no syntax errors)', () => {
  
  const mod = require('../hooks/useIoTStatus');
  assertEqual(typeof mod.default, 'function');
  assertEqual(typeof mod.useIoTStatus, 'function');
});

test('useIoTStatus returns a callable React hook function', () => {
  const { useIoTStatus } = require('../hooks/useIoTStatus');
  
  assertEqual(useIoTStatus.length, 1); 
});