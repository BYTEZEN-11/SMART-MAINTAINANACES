

const { ApiError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, PayloadTooLargeError, UnsupportedMediaTypeError, RateLimitError, ServiceUnavailableError, TimeoutError } = require('../src/errors/ApiError');

class AppError extends ApiError {
  constructor(message, statusCode = 500) {
    super(message, statusCode);
    this.name = 'AppError';
  }
}

const sendError = (res, statusCode, message, details = null) => {

if (res.headersSent) return;
  res.status(statusCode).json({
    success: false,
    message,
    ...(details !== null && details !== undefined ? { details } : {}),
  });
};

const sendSuccess = (res, statusCode, data, message = null) => {
  if (res.headersSent) return;
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const tryCatch = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (err) {
    if (err instanceof ApiError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    return next(err);
  }
};

module.exports = {
  AppError,
  sendError,
  sendSuccess,
  tryCatch,
  ApiError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  RateLimitError,
  ServiceUnavailableError,
  TimeoutError,
};