

const Appliance = require('../models/Appliance');
const Analysis = require('../models/Analysis');
const { sendSuccess, tryCatch, ValidationError, NotFoundError } = require('../utils/errorHandler');
const { enrichWithRules } = require('../services/ruleEngine');
const { analyzeWithGemini } = require('../services/multimodalAiService');

const runDiagnostic = tryCatch(async (req, res) => {
  const { applianceId, text, imageUrl, audioUrl } = req.body;
  if (!text && !imageUrl && !audioUrl) {
    throw new ValidationError('Provide text, imageUrl, or audioUrl');
  }

  let appliance = null;
  if (applianceId) {
    appliance = await Appliance.findOne({
      _id: applianceId,
      user: req.user._id,
    }).lean();
    if (!appliance) throw new NotFoundError('Appliance not found');
  }

  const aiResult = await analyzeWithGemini({
    appliance,
    text,
    imageUrl,
    audioUrl,
  });

  const enriched = enrichWithRules(aiResult, { appliance });

  const saved = await Analysis.create({
    user: req.user._id,
    appliance: appliance?._id,
    type: imageUrl ? 'visual' : audioUrl ? 'audio' : 'text',
    input: { text, imageUrl, audioUrl },
    output: enriched,
  });

  sendSuccess(res, 201, saved, 'Diagnostic complete');
});

const getHistory = tryCatch(async (req, res) => {
  const { limit = 50 } = req.query;
  const lim = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
  const list = await Analysis.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(lim)
    .lean();
  sendSuccess(res, 200, list, 'History retrieved');
});

module.exports = { runDiagnostic, getHistory };
