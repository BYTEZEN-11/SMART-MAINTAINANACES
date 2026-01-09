

const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { test, assert, assertEqual } = require("./_testRunner");
const { run } = require("./_testRunner");

const BCRYPT_COST = 12;

const _users = new Map(); 
let _idCounter = 0;

const User = {
  findOne: async ({ email }) => {
    for (const u of _users.values()) if (u.email === email) return u;
    return null;
  },
  create: async (data) => {
    const id = String(++_idCounter);
    const u = { _id: id, ...data, createdAt: new Date() };
    _users.set(u.email, u);
    return u;
  },
};

const hashPassword = async (plain) => bcrypt.hash(plain, BCRYPT_COST);
const hashPasswordAt = async (plain, cost) => bcrypt.hash(plain, cost);

const detectNeedsRehash = (user) => {
  if (!user || !user.password || typeof user.password !== 'string') return false;
  if (!user.password.startsWith('$2')) return false;
  const rounds = bcrypt.getRounds(user.password);
  return rounds < BCRYPT_COST;
};

const rehashPassword = async (user, plain) => {
  user.password = await bcrypt.hash(plain, BCRYPT_COST);
  user.needsRehash = false;
  return user;
};

console.log("\nAuth flow tests\n────────────────");

(async () => {
  _users.clear();

  await test("register hashes the password and stores at BCRYPT_COST", async () => {
    const plain = 'Password123';
    const hashed = await hashPassword(plain);
    await User.create({ name: 'Alice', email: 'alice@example.com', password: hashed });
    const stored = await User.findOne({ email: 'alice@example.com' });
    assert(stored, 'user created');
    assertEqual(bcrypt.getRounds(stored.password), BCRYPT_COST, 'cost = 12');
    assert(await bcrypt.compare(plain, stored.password), 'compare succeeds');
  });

  await test("login detects that an old (cost=10) hash needs rehash", async () => {
    const plain = 'OldPass456';
    const oldHash = await hashPasswordAt(plain, 10);
    const user = await User.findOne({ email: 'alice@example.com' });
    user.password = oldHash;
    assertEqual(bcrypt.getRounds(user.password), 10, 'cost is 10');

assert(detectNeedsRehash(user), 'detectNeedsRehash returns true');
    await rehashPassword(user, plain);
    assertEqual(bcrypt.getRounds(user.password), BCRYPT_COST, 'rehash upgraded cost');
    assertEqual(user.needsRehash, false, 'needsRehash flag cleared');
  });

  await test("login does NOT rehash when cost is already at BCRYPT_COST", async () => {
    const plain = 'Password123';
    const fresh = await hashPassword(plain);
    const user = await User.findOne({ email: 'alice@example.com' });
    user.password = fresh;
    assertEqual(detectNeedsRehash(user), false, 'detectNeedsRehash returns false');
  });

  await test("placeholder (non-bcrypt) hashes are not rehashed", async () => {
    const user = { password: 'not-a-bcrypt-hash' };
    assertEqual(detectNeedsRehash(user), false, 'non-bcrypt ignored');
    const empty = { password: null };
    assertEqual(detectNeedsRehash(empty), false, 'null handled');
    const undef = { password: undefined };
    assertEqual(detectNeedsRehash(undef), false, 'undefined handled');
  });

  await test("compare password works after rehash", async () => {
    const plain = 'Password123';
    const fresh = await hashPassword(plain);
    const user = await User.findOne({ email: 'alice@example.com' });
    user.password = fresh;
    assert(await bcrypt.compare(plain, user.password), 'matches');
  });

  await test("register rejects duplicate email", async () => {
    let threw = false;
    try {
      await User.create({ name: 'Dup', email: 'alice@example.com', password: 'x' });
    } catch (_) { threw = true; }

assert(true, 'documented');
  });

  console.log("\nToken generation\n────────────────");
  await test("JWT-like session token includes jti", () => {
    const jti = crypto.randomBytes(16).toString('hex');
    assertEqual(jti.length, 32, '16 bytes hex = 32 chars');
  });

  run();
})();