

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9]{7,15}$/;

export const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
export const isEmail          = (v) => typeof v === "string" && EMAIL_RE.test(v.trim());
export const isStrongPassword = (v) => typeof v === "string" && v.length >= 8 && /[A-Za-z]/.test(v) && /[0-9]/.test(v);
export const isPhone          = (v) => typeof v === "string" && PHONE_RE.test(v.replace(/[\s+\-()]/g, ""));

export const validateEmail = (email) => {
  if (!email) return "Email is required";
  if (!isEmail(email)) return "Please enter a valid email address";
  return "";
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return "";
};

export const validateName = (name) => {
  if (!name || !name.trim()) return "Name is required";
  if (name.trim().length < 2) return "Name is too short";
  return "";
};

export const validateConfirmPassword = (password, confirm) => {
  if (!confirm) return "Please re-enter your password";
  if (password !== confirm) return "Passwords do not match";
  return "";
};

export const validateApplianceName = (name) => {
  if (!name || !name.trim()) return "Appliance name is required";
  if (name.length > 60) return "Name must be under 60 characters";
  return "";
};

export const validateComment = (text) => {
  if (text && text.length > 1000) return "Comment must be under 1000 characters";
  return "";
};

export const runValidators = (values, rules) => {
  const errors = {};
  for (const field of Object.keys(rules)) {
    const msg = rules[field](values[field], values);
    if (msg) errors[field] = msg;
  }
  return errors;
};

export default {
  isNonEmptyString,
  isEmail,
  isStrongPassword,
  isPhone,
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
  validateApplianceName,
  validateComment,
  runValidators,
};
