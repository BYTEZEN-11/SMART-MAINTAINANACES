

const { ValidationError } = require('../errors/ApiError');

const isObjectId = (v) => typeof v === 'string'
  && /^[a-fA-F0-9]{24}$/.test(v);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const checkField = (key, value, rule) => {
  
  if (value === undefined || value === null || value === '') {
    if (rule.required) {
      throw new ValidationError(`Field "${key}" is required`);
    }
    return rule.default ?? null;
  }

  switch (rule.type) {
    case 'string': {
      if (typeof value !== 'string') {
        throw new ValidationError(`Field "${key}" must be a string`);
      }
      if (rule.min !== undefined && value.length < rule.min) {
        throw new ValidationError(`Field "${key}" must be at least ${rule.min} characters`);
      }
      if (rule.max !== undefined && value.length > rule.max) {
        throw new ValidationError(`Field "${key}" must be at most ${rule.max} characters`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        throw new ValidationError(`Field "${key}" has an invalid format`);
      }
      return rule.transform ? rule.transform(value) : value;
    }
    case 'number': {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) {
        throw new ValidationError(`Field "${key}" must be a number`);
      }
      if (rule.min !== undefined && n < rule.min) {
        throw new ValidationError(`Field "${key}" must be >= ${rule.min}`);
      }
      if (rule.max !== undefined && n > rule.max) {
        throw new ValidationError(`Field "${key}" must be <= ${rule.max}`);
      }
      return rule.transform ? rule.transform(n) : n;
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      throw new ValidationError(`Field "${key}" must be a boolean`);
    }
    case 'email': {
      if (typeof value !== 'string' || !EMAIL_RE.test(value)) {
        throw new ValidationError(`Field "${key}" must be a valid email`);
      }
      const lower = value.toLowerCase();
      return rule.transform ? rule.transform(lower) : lower;
    }
    case 'objectid': {
      if (!isObjectId(value)) {
        throw new ValidationError(`Field "${key}" must be a valid ObjectId`);
      }
      return value;
    }
    case 'enum': {
      if (!Array.isArray(rule.values) || !rule.values.includes(value)) {
        throw new ValidationError(
          `Field "${key}" must be one of: ${rule.values.join(', ')}`
        );
      }
      return value;
    }
    case 'array': {
      if (!Array.isArray(value)) {
        throw new ValidationError(`Field "${key}" must be an array`);
      }
      if (rule.min !== undefined && value.length < rule.min) {
        throw new ValidationError(`Field "${key}" must have at least ${rule.min} items`);
      }
      if (rule.max !== undefined && value.length > rule.max) {
        throw new ValidationError(`Field "${key}" must have at most ${rule.max} items`);
      }
      return rule.transform ? rule.transform(value) : value;
    }
    case 'any':
      return value;
    default:
      throw new ValidationError(`Field "${key}" has unknown type "${rule.type}"`);
  }
};

const validate = (schema) => (req, res, next) => {
  try {
    for (const source of ['body', 'params', 'query']) {
      const rules = schema[source];
      if (!rules || typeof rules !== 'object') continue;
      const data = req[source] || {};
      const out = {};
      for (const [key, rule] of Object.entries(rules)) {
        out[key] = checkField(key, data[key], rule);
      }

for (const [k, v] of Object.entries(out)) {
        if (v !== null) data[k] = v;
      }
      req[source] = data;
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { validate, isObjectId, EMAIL_RE };