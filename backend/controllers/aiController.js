const AIResponse = require('../models/AIResponse');
const { analyzeIssue } = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/errorHandler');

const analyze = async (req, res) => {
  try {
    const { text, imageUrl, applianceId } = req.body;

    if (!text && !imageUrl) {
      return sendError(res, 400, 'Validation error', 'Please provide either text description or image');
    }

const result = await analyzeIssue(text, imageUrl);

const aiResponse = await AIResponse.create({
      user: req.user._id,
      appliance: applianceId || null,
      inputText: text,
      imageUrl,
      issue: result.issue,
      severity: result.severity,
      solution: result.solution
    });

    sendSuccess(res, 200, aiResponse, 'Analysis completed successfully');
  } catch (error) {
    console.error('AI analysis error:', error);
    sendError(res, 500, 'Analysis failed', error.message);
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await AIResponse.find({ user: req.user._id })
      .populate('appliance', 'name type')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    sendSuccess(res, 200, history, 'History retrieved successfully');
  } catch (error) {
    console.error('Get history error:', error);
    sendError(res, 500, 'Failed to retrieve history', error.message);
  }
};

module.exports = {
  analyze,
  getHistory
};
