const { sendError } = require('../utils/errorHandler');

const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return sendError(res, 400, 'Validation error', 'Name, email, and password are required');
  }

  if (name.trim().length < 2) {
    return sendError(res, 400, 'Validation error', 'Name must be at least 2 characters');
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 400, 'Validation error', 'Please provide a valid email');
  }

  if (password.length < 6) {
    return sendError(res, 400, 'Validation error', 'Password must be at least 6 characters');
  }

  if (!passwordRegex.test(password)) {
    return sendError(res, 400, 'Validation error', 'Password must contain both letters and numbers');
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, 'Validation error', 'Email and password are required');
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 400, 'Validation error', 'Please provide a valid email');
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin
};
