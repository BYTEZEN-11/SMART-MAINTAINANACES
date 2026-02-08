const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { sendError } = require('../utils/errorHandler');

const CACHE_CAP = 500;
const CACHE_TTL_MS = 5 * 60 * 1000; 
const userCache = new Map();

const getCachedUser = (id) => {
  const hit = userCache.get(String(id));
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    userCache.delete(String(id));
    return null;
  }
  
  userCache.delete(String(id));
  userCache.set(String(id), hit);
  return hit.user;
};

const setCachedUser = (id, user) => {
  userCache.set(String(id), { user, expiresAt: Date.now() + CACHE_TTL_MS });
  if (userCache.size > CACHE_CAP) {
    
    const oldest = userCache.keys().next().value;
    if (oldest !== undefined) userCache.delete(oldest);
  }
};

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 401, 'Not authorized', 'No token provided. Please login again.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return sendError(res, 401, 'Not authorized', 'Invalid or expired token. Please login again.');
    }

    if (!decoded || !decoded.id || !decoded.jti) {
      return sendError(res, 401, 'Not authorized', 'Token missing required claims.');
    }

const session = await Session.findOne({
      jti: decoded.jti,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });
    if (!session) {
      return sendError(res, 401, 'Not authorized', 'Session has been revoked, expired, or never existed. Please login again.');
    }

let user = getCachedUser(decoded.id);
    if (!user) {
      user = await User.findById(decoded.id).select('-password').lean();
      if (!user) {
        return sendError(res, 401, 'Not authorized', 'User not found. Please login again.');
      }
      setCachedUser(decoded.id, user);
    }

    req.user = user;
    req.session = session;
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return sendError(res, 500, 'Server error', 'Authentication failed');
  }
};

const clearCache = () => userCache.clear();

module.exports = { protect, clearCache, _userCache: userCache };
