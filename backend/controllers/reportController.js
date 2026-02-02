const MediaReport = require('../models/MediaReport');
const { sendSuccess, sendError } = require('../utils/errorHandler');

const createReport = async (req, res) => {
  try {
    const { applianceId, mediaType, fileUrl, description } = req.body;

    if (!mediaType || !fileUrl) {
      return sendError(res, 400, 'Validation error', 'Media type and file URL are required');
    }

    const report = await MediaReport.create({
      user: req.user._id,
      appliance: applianceId || null,
      mediaType,
      fileUrl,
      description
    });

sendSuccess(res, 201, report, 'Report created successfully');
  } catch (error) {
    console.error('Create report error:', error);
    sendError(res, 500, 'Failed to create report', error.message);
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await MediaReport.find({ user: req.user._id })
      .populate('appliance', 'name type')
      .sort({ createdAt: -1 })
      .lean();

sendSuccess(res, 200, reports, 'Reports retrieved successfully');
  } catch (error) {
    console.error('Get reports error:', error);
    sendError(res, 500, 'Failed to retrieve reports', error.message);
  }
};

module.exports = {
  createReport,
  getReports
};
