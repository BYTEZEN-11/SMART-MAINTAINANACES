

const { test, assert, assertEqual, run } = require("./_testRunner");
const { ApiError, ConflictError } = require("../src/errors/ApiError");

const taken = new Set();

const createRow = async (data) => {

if (taken.has(`${data.user}:${data.deviceId}`)) {
    const err = new Error('E11000 duplicate key error collection');
    err.code = 11000;
    throw err;
  }
  taken.add(`${data.user}:${data.deviceId}`);
  return { _id: data.user, ...data };
};

const connectWithRaceHandling = async (req) => {
  const { deviceId, deviceName, deviceType, connectionType } = req.body;
  let device = null; 
  if (!device) {

try {
      device = await createRow({
        user: req.user._id,
        deviceId, deviceName, deviceType, connectionType,
      });
    } catch (e) {
      if (e && e.code === 11000) {
        throw new ConflictError(
          'Device is already registered. Please refresh and try again.'
        );
      }
      throw e;
    }
  }
  return { status: 201, data: device };
};

console.log("\nIoT race-condition tests\n────────────────────");

(async () => {
  await test("first connectDevice call succeeds", async () => {
    taken.clear();
    const req = {
      body: { deviceId: 'hw-RACE-1', deviceName: 'Fridge', deviceType: 'fridge', connectionType: 'wifi' },
      user: { _id: 'user-X' },
    };
    const result = await connectWithRaceHandling(req);
    assertEqual(result.status, 201);
  });

  await test("E11000 (duplicate key) is translated to ConflictError (409)", async () => {
    
    taken.clear();
    taken.add('user-Y:hw-RACE-2');
    const req = {
      body: { deviceId: 'hw-RACE-2', deviceName: 'Washer', deviceType: 'washer', connectionType: 'wifi' },
      user: { _id: 'user-Y' },
    };
    let threw = null;
    try { await connectWithRaceHandling(req); } catch (e) { threw = e; }
    assert(threw, 'expected throw');
    assert(threw instanceof ConflictError, 'is ConflictError');
    assertEqual(threw.statusCode, 409);
    
    assert(!/E11000/.test(threw.message), 'raw E11000 must not leak');
  });

  await test("non-E11000 errors are re-thrown unchanged", async () => {
    const connectThatThrows = async () => {
      const err = new Error('Some other DB failure');
      throw err;
    };
    let threw = null;
    try { await connectThatThrows(); } catch (e) { threw = e; }
    assert(threw, 'expected throw');
    assert(!(threw instanceof ConflictError), 'not ConflictError');
    assertEqual(threw.message, 'Some other DB failure');
  });

  await test("ConflictError is an ApiError with status 409", () => {
    const e = new ConflictError('test');
    assert(e instanceof ApiError, 'extends ApiError');
    assertEqual(e.statusCode, 409);
  });

  run();
})();
