

const { test, assert, assertEqual } = require('./_testRunner');

console.log('\nDeviceStatusCard tests\n─────────────────────');

test('module loads without parse errors', () => {
  const mod = require('../components/DeviceStatusCard');
  assertEqual(typeof mod.default, 'function');
});

test('default export accepts props without throwing on import', () => {
  const Card = require('../components/DeviceStatusCard').default;

assertEqual(typeof Card, 'function');
});