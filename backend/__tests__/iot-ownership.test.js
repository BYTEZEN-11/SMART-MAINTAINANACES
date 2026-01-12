

const path = require('path');
const { test, assert, assertEqual, assertThrows, run } = require("./_testRunner");
const { ApiError, ConflictError } = require("../src/errors/ApiError");

let _findOneArg = null;
let _findOneStub = async (filter) => {
  _findOneArg = filter;
  if (filter.deviceId && filter.user) {
    
    return null;
  }
  return null;
};

const fakeDeviceStore = new Map(); 

const ConnectedDevice = {
  findOne: async (filter) => {
    if (filter.deviceId) {
      const row = fakeDeviceStore.get(filter.deviceId);
      if (!row) return null;
      if (filter.user && filter.user.toString() !== row.user.toString()) return null;
      return { ...row, _id: row.user, toObject() { return { ...row }; } };
    }
    return null;
  },
  create: async (data) => {
    fakeDeviceStore.set(data.deviceId, { ...data });
    return { ...data, _id: data.user, toObject() { return { ...data }; } };
  },
  update: async (deviceId, patch) => {
    const row = fakeDeviceStore.get(deviceId);
    if (!row) return null;
    Object.assign(row, patch);
    fakeDeviceStore.set(deviceId, row);
    return { ...row, toObject() { return { ...row }; } };
  },
};

const connectDevice = async (req) => {
  const { deviceId, deviceName, deviceType, connectionType } = req.body;
  let device = await ConnectedDevice.findOne({ deviceId, user: req.user._id });
  if (!device) {
    const existing = await ConnectedDevice.findOne({ deviceId });
    if (existing) {
      throw new ConflictError(
        'Device is already registered to another account. ' +
        'Please ask the original owner to disconnect the device first, or contact support.'
      );
    }
    device = await ConnectedDevice.create({
      user: req.user._id,
      deviceId, deviceName, deviceType, connectionType,
    });
  } else {
    device = await ConnectedDevice.update(deviceId, { deviceName });
  }
  return { status: 201, data: device };
};

const { calculateHealthMetrics } = require('../controllers/iotController');

console.log("\nIoT ownership tests\n────────────────────");

(async () => {
  fakeDeviceStore.clear();

  await test("first connectDevice from a user creates a row", async () => {
    const req = {
      body: { deviceId: 'hw-001', deviceName: 'Smart Plug', deviceType: 'smart_plug', connectionType: 'wifi' },
      user: { _id: 'user-A' },
    };
    const result = await connectDevice(req);
    assertEqual(result.status, 201);
    assertEqual(fakeDeviceStore.get('hw-001').user, 'user-A');
  });

  await test("second connectDevice from SAME user updates the row", async () => {
    const req = {
      body: { deviceId: 'hw-001', deviceName: 'Smart Plug v2', deviceType: 'smart_plug', connectionType: 'wifi' },
      user: { _id: 'user-A' },
    };
    const result = await connectDevice(req);
    assertEqual(result.status, 201);
    assertEqual(fakeDeviceStore.get('hw-001').deviceName, 'Smart Plug v2');
  });

  await test("connectDevice from a DIFFERENT user throws ConflictError (409)", async () => {
    const req = {
      body: { deviceId: 'hw-001', deviceName: 'Other', deviceType: 'smart_plug', connectionType: 'wifi' },
      user: { _id: 'user-B' },
    };
    let threw = null;
    try { await connectDevice(req); } catch (e) { threw = e; }
    assert(threw, 'expected throw');
    assert(threw instanceof ConflictError, 'is ConflictError');
    assertEqual(threw.statusCode, 409);
    assertEqual(fakeDeviceStore.get('hw-001').user, 'user-A', 'original owner preserved');
  });

  console.log("\ncalculateHealthMetrics tests\n────────────────────");

  await test("returns default 100 health on empty input", () => {
    const m = calculateHealthMetrics([]);
    assertEqual(m.overallHealth, 100);
    assertEqual(m.powerEfficiency, 100);
    assertEqual(m.temperatureStatus, 'normal');
    assertEqual(m.vibrationStatus, 'normal');
    assertEqual(m.anomalyCount, 0);
  });

  await test("reads flat columns from the canonical SensorReading shape", () => {
    const points = [
      { temperature: 50, power: 200, vibration: 1.5, anomalies: [] },
      { temperature: 55, power: 220, vibration: 2.0, anomalies: [] },
    ];
    const m = calculateHealthMetrics(points);
    assertEqual(parseFloat(m.averageTemperature), 52.5, 'avg temp = (50+55)/2');
    assertEqual(parseFloat(m.averagePower), 210, 'avg power = (200+220)/2');
    assertEqual(parseFloat(m.averageVibration), 1.75, 'avg vibration = (1.5+2)/2');
  });

  await test("falls back to legacy nested readings.* shape", () => {
    const points = [
      { readings: { power: { consumption: 100 }, temperature: { value: 30 }, vibration: { magnitude: 0.5 } } },
    ];
    const m = calculateHealthMetrics(points);
    assertEqual(parseFloat(m.averagePower), 100, 'legacy power path');
    assertEqual(parseFloat(m.averageTemperature), 30, 'legacy temp path');
    assertEqual(parseFloat(m.averageVibration), 0.5, 'legacy vibration path');
  });

  await test("flags high vibration status", () => {
    const m = calculateHealthMetrics([{ vibration: 6.0 }]);
    assertEqual(m.vibrationStatus, 'high');
  });

  await test("counts anomalies on points", () => {
    const m = calculateHealthMetrics([
      { anomalies: ['a', 'b'] },
      { anomalies: ['c'] },
    ]);
    assertEqual(m.anomalyCount, 3);
  });

  console.log("\nConflictError hierarchy\n────────────────────");
  await test("ConflictError is an ApiError", () => {
    const e = new ConflictError('test');
    assert(e instanceof ApiError, 'extends ApiError');
    assertEqual(e.statusCode, 409);
  });

  run();
})();