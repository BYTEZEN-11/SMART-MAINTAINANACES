const service = require('../services/desktopAgentService');
const { sendSuccess, sendError } = require('../utils/errorHandler');

exports.ingestLogs = async (req, res, next) => {
  try {
    const { deviceId, source, payload, agentVersion } = req.body;
    if (!deviceId) return sendError(res, 400, 'deviceId required');
    const log = await service.ingestBatch(req.user._id, { deviceId, source, payload, agentVersion });
    return sendSuccess(res, 201, log, 'Log ingested');
  } catch (e) { next(e); }
};

exports.getLatestLogs = async (req, res, next) => {
  try {
    const { deviceId } = req.query;
    if (!deviceId) return sendError(res, 400, 'deviceId required');
    const out = await service.getLatestHealth(req.user._id, deviceId, 24);
    return sendSuccess(res, 200, out, 'Logs');
  } catch (e) { next(e); }
};

exports.getHealth = async (req, res, next) => {
  try {
    const { deviceId } = req.query;
    if (!deviceId) return sendError(res, 400, 'deviceId required');
    const out = await service.getLatestHealth(req.user._id, deviceId, 1);
    return sendSuccess(res, 200, out, 'Health');
  } catch (e) { next(e); }
};

exports.getPairCode = async (req, res, next) => {
  try {
    const pairCode = service.generatePairCode(req.user._id);
    
    return sendSuccess(res, 200, { pairCode, expiresIn: '10m' }, 'Pair code generated');
  } catch (e) { next(e); }
};

exports.consumePairCode = async (req, res, next) => {
  try {
    const { pairCode, deviceId } = req.body || {};
    if (!pairCode || typeof pairCode !== 'string') {
      return sendError(res, 400, 'pairCode required');
    }
    if (!deviceId || typeof deviceId !== 'string') {
      return sendError(res, 400, 'deviceId required');
    }
    const userId = service.consumePairCode(pairCode.trim().toUpperCase());
    if (!userId) {
      return sendError(res, 401, 'Invalid or expired pair code');
    }
    return sendSuccess(res, 200, { userId, deviceId }, 'Pair code consumed');
  } catch (e) { next(e); }
};

const ConnectedDevice = require('../models/ConnectedDevice');
exports.verifyDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const device = await ConnectedDevice.findOne({ deviceId, user: req.user._id });
    if (!device) {
      return sendError(res, 404, 'Device not registered to this user');
    }
    return sendSuccess(res, 200, { deviceId: device.deviceId, status: device.status }, 'Device verified');
  } catch (e) { next(e); }
};