

class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.success = false;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, details);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(message, 404);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Conflict', details = null) {
    super(message, 409, details);
  }
}

class PayloadTooLargeError extends ApiError {
  constructor(message = 'Payload too large') {
    super(message, 413);
  }
}

class UnsupportedMediaTypeError extends ApiError {
  constructor(message = 'Unsupported media type') {
    super(message, 415);
  }
}

class RateLimitError extends ApiError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

class ServiceUnavailableError extends ApiError {
  constructor(message = 'Service unavailable', details = null) {
    super(message, 503, details);
  }
}

class TimeoutError extends ApiError {
  constructor(message = 'Request timeout') {
    super(message, 504);
  }
}

module.exports = {
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