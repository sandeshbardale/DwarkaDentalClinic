const ApiError = require('../utils/ApiError');

/**
 * Centralized error handler — must be the last middleware in app.js.
 * Catches ApiErrors thrown by services/controllers as well as unexpected errors.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}`,
      errors: [{ field, message: `${field} already exists` }],
    });
  }

  // Known ApiError (thrown intentionally by service/controller)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Multer file-filter error
  if (err.name === 'MulterError' || err.message?.includes('Only JPEG')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [],
    });
  }

  // Unknown / unhandled error
  console.error('[ErrorHandler]', err);
  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    errors: [],
  });
}

module.exports = errorHandler;
