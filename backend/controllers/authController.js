const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const admin = require('firebase-admin');
const User = require('../models/User');
const Session = require('../models/Session');
const { sendSuccess, sendError } = require('../utils/errorHandler');
const notificationService = require('../services/notificationService');
const authMiddleware = require('../middleware/authMiddleware');

const _syncFails = new Map();
const SYNC_FAIL_WINDOW_MS = 15 * 60 * 1000;
const SYNC_FAIL_MAX = 20;
const _recordSyncFail = (key) => {
  const now = Date.now();
  const arr = (_syncFails.get(key) || []).filter((t) => now - t < SYNC_FAIL_WINDOW_MS);
  arr.push(now);
  _syncFails.set(key, arr);
  return arr.length > SYNC_FAIL_MAX;
};

let _fbInited = false;
const ensureFirebase = () => {
  if (_fbInited) return true;
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) return false;
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    }
    _fbInited = true;
    return true;
  } catch (e) {
    console.warn('[auth] firebase init failed:', e.message);
    return false;
  }
};

const generateToken = (id, extra = {}) => {
  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign({ id, jti, ...extra }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { token, jti };
};

const createSession = async ({ userId, jti, ip, userAgent }) => {
  await Session.create({
    userId,
    jti,
    ip: (ip || '').slice(0, 64),
    userAgent: (userAgent || '').slice(0, 256),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revoked: false,
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, 'Registration failed', 'All fields are required');
    }
    if (password.length < 6) {
      return sendError(res, 400, 'Registration failed', 'Password must be at least 6 characters');
    }

    const userExists = await User.findOne({ email }).select('_id').lean();
    if (userExists) {
      return sendError(res, 400, 'Registration failed', 'User already exists with this email');
    }

    const user = await User.create({ name, email, password });
    const { token, jti } = generateToken(user._id);
    await createSession({
      userId: user._id,
      jti,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendSuccess(res, 201, {
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    }, 'User registered successfully');
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, 500, 'Registration failed', 'Registration failed');
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 401, 'Login failed', 'Invalid email or password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Login failed', 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Login failed', 'Invalid email or password');
    }

if (typeof user.detectNeedsRehash === 'function' && user.detectNeedsRehash()) {
      await user.rehashPassword(password).catch(() => {});
    }

    const { token, jti } = generateToken(user._id);
    await createSession({
      userId: user._id,
      jti,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendSuccess(res, 200, {
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 500, 'Login failed', 'Login failed');
  }
};

const syncAccount = async (req, res) => {
  const ipKey = `sync:${req.ip}`;
  if (_recordSyncFail(ipKey)) {
    return sendError(res, 429, 'Too many attempts', 'Too many sync attempts, please try again later');
  }

  try {
    const { firebaseToken, name } = req.body;

    if (!firebaseToken || typeof firebaseToken !== 'string') {
      return sendError(res, 400, 'Sync failed', 'Firebase ID token is required');
    }

    if (!ensureFirebase()) {

return sendError(res, 503, 'Sync unavailable', 'Firebase authentication is not configured on this server');
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(firebaseToken, true );
    } catch (e) {
      return sendError(res, 401, 'Sync failed', 'Invalid or expired Firebase token');
    }

    if (!decoded.uid) {
      return sendError(res, 401, 'Sync failed', 'Firebase token missing uid');
    }

let user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      
      const email = (decoded.email && String(decoded.email).toLowerCase()) ||
        `${decoded.uid}@firebase.placeholder`;
      user = await User.create({
        firebaseUid: decoded.uid,
        email,
        name: name || decoded.name || email.split('@')[0],
        emailVerified: Boolean(decoded.email_verified),

password: crypto.randomBytes(24).toString('hex'),
        authProvider: 'firebase',
      });
    } else if (name && name !== user.name) {
      user.name = name;
      await user.save();
    }

    const { token, jti } = generateToken(user._id, { via: 'firebase' });
    await createSession({
      userId: user._id,
      jti,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendSuccess(res, 200, {
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    }, 'Account synced successfully');
  } catch (error) {
    console.error('Sync error:', error);
    sendError(res, 500, 'Sync failed', 'Sync failed');
  }
};

const logout = async (req, res) => {
  try {
    if (req.session) {
      req.session.revoked = true;
      req.session.revokedAt = new Date();
      await req.session.save();
    }

if (req.user && req.user._id && typeof authMiddleware.clearCache === 'function') {

const cache = authMiddleware._userCache;
      if (cache && typeof cache.delete === 'function') {
        cache.delete(String(req.user._id));
      }
    }
    sendSuccess(res, 200, null, 'Logged out');
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 500, 'Logout failed', 'Logout failed');
  }
};

module.exports = {
  register,
  login,
  syncAccount,
  logout,
};
