

export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const isUnauthorized = (err) => err?.status === 401;
export const isConflict = (err) => err?.status === 409;
export const isValidationError = (err) => err?.status === 400;
export const isServerError = (err) => err?.status >= 500;