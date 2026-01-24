const Appliance = require('../models/Appliance');
const { sendSuccess, sendError, tryCatch } = require('../utils/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../src/errors/ApiError');

const addAppliance = tryCatch(async (req, res) => {
  const { name, type, brand, modelNumber, purchaseDate, serviceDate, location, severity, notes } = req.body;

  const applianceData = {
    user: req.user._id,
    name,
    type,
    brand,
    modelNumber,
    purchaseDate,
    serviceDate,
    location,
    severity,
    notes
  };

if (req.file) {
    applianceData.image = `/uploads/${req.file.filename}`;
  }

  const appliance = await Appliance.create(applianceData);

  sendSuccess(res, 201, appliance, 'Appliance added successfully');
});

const getAppliances = tryCatch(async (req, res) => {
  const appliances = await Appliance.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  sendSuccess(res, 200, appliances, 'Appliances retrieved successfully');
});

const getAppliance = tryCatch(async (req, res) => {
  const appliance = await Appliance.findById(req.params.id).lean();

  if (!appliance) {
    throw new NotFoundError('Appliance not found');
  }

if (appliance.user.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You do not have permission to view this appliance');
  }

  sendSuccess(res, 200, appliance, 'Appliance retrieved successfully');
});

const updateAppliance = tryCatch(async (req, res) => {
  const appliance = await Appliance.findById(req.params.id);

  if (!appliance) {
    throw new NotFoundError('Appliance not found');
  }

if (appliance.user.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You do not have permission to update this appliance');
  }

  const { name, type, brand, modelNumber, purchaseDate, serviceDate, location, severity, notes } = req.body;

if (name !== undefined) appliance.name = typeof name === 'string' ? name.trim() : name;
  if (type !== undefined) appliance.type = type;
  if (brand !== undefined) appliance.brand = brand;
  if (modelNumber !== undefined) appliance.modelNumber = modelNumber;
  if (purchaseDate !== undefined) {
    const d = new Date(purchaseDate);
    if (isNaN(d.getTime())) {
      throw new ValidationError('purchaseDate is not a valid date', 400);
    }
    appliance.purchaseDate = d;
  }
  if (serviceDate !== undefined) {
    const d = new Date(serviceDate);
    if (isNaN(d.getTime())) {
      throw new ValidationError('serviceDate is not a valid date', 400);
    }
    appliance.serviceDate = d;
  }
  if (location !== undefined) appliance.location = location;
  if (severity !== undefined) appliance.severity = severity;
  if (notes !== undefined) appliance.notes = notes;

if (req.file) {
    appliance.image = `/uploads/${req.file.filename}`;
  }

  await appliance.save();

  sendSuccess(res, 200, appliance, 'Appliance updated successfully');
});

const deleteAppliance = tryCatch(async (req, res) => {
  const appliance = await Appliance.findById(req.params.id);

  if (!appliance) {
    throw new NotFoundError('Appliance not found');
  }

if (appliance.user.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You do not have permission to delete this appliance');
  }

  await appliance.deleteOne();

  sendSuccess(res, 200, { id: req.params.id }, 'Appliance deleted successfully');
});

module.exports = {
  addAppliance,
  getAppliances,
  getAppliance,
  updateAppliance,
  deleteAppliance
};
