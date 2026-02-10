

const { randomUUID } = require('crypto');

const SAFE = (v, max = 256) => {
  if (v == null) return null;
  return String(v).slice(0, max);
};

const logger = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', reqId);
  req.id = reqId;

  const start = Date.now();

  res.on('finish', () => {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      requestId: reqId,
      method: req.method,
      url: SAFE(req.originalUrl, 512),
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip: SAFE(req.ip, 64),
      userAgent: SAFE(req.headers['user-agent'], 256),
      userId: req.user?._id ? String(req.user._id) : null,
      env: process.env.NODE_ENV || 'development',
    });
    if (res.statusCode >= 500) {
      console.error(line);
    } else {
      console.log(line);
    }
  });

  next();
};

module.exports = logger;