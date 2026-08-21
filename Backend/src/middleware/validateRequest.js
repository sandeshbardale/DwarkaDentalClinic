const ApiError = require('../utils/ApiError');

/**
 * validateRequest — creates a middleware that validates req.body against a
 * simple rules map before the request reaches the controller.
 *
 * Rules map format:
 *   { fieldName: { required: true, type: 'string'|'number', label: 'Display Name' } }
 *
 * Usage:
 *   router.post('/patients', validateRequest({ name: { required: true }, phone: { required: true } }), controller);
 *
 * @param {Object} rules  Map of field names to validation rules
 * @returns {Function}    Express middleware
 */
function validateRequest(rules) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];
      const label = rule.label || field;

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${label} is required` });
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rule.type === 'number' && isNaN(Number(value))) {
          errors.push({ field, message: `${label} must be a number` });
        }
        if (rule.type === 'string' && typeof value !== 'string') {
          errors.push({ field, message: `${label} must be a string` });
        }
      }
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation failed', errors));
    }

    next();
  };
}

module.exports = validateRequest;
