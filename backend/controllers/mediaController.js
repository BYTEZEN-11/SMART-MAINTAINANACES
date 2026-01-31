const MediaReport = require('../models/MediaReport');
const Appliance = require('../models/Appliance');
const { sendSuccess, sendError, tryCatch } = require('../utils/errorHandler');
const { ValidationError, NotFoundError } = require('../src/errors/ApiError');

const uploadMedia = tryCatch(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const { applianceId, description } = req.body;

let mediaType = 'document';
  if (req.file.mimetype.startsWith('image/')) {
    mediaType = 'image';
  } else if (req.file.mimetype.startsWith('video/')) {
    mediaType = 'video';
  } else if (req.file.mimetype.startsWith('audio/')) {
    mediaType = 'audio';
  }

let verifiedApplianceId = null;
  if (applianceId) {
    const owned = await Appliance.findOne({ _id: applianceId, user: req.user._id }).select('_id').lean();
    if (!owned) {

throw new NotFoundError('Appliance not found');
    }
    verifiedApplianceId = owned._id;
  }

const safeDescription = typeof description === 'string'
    ? description.slice(0, 2000)
    : undefined;

  const mediaReport = await MediaReport.create({
    user: req.user._id,
    appliance: verifiedApplianceId,
    mediaType,
    fileUrl: `/uploads/${req.file.filename}`,
    description: safeDescription,
  });

  sendSuccess(res, 201, mediaReport, 'Media uploaded successfully');
});

module.exports = {
  uploadMedia
};
