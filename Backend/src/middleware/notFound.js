const ApiError = require('../utils/ApiError');

/**
 * Catch-all 404 handler for unmatched routes.
 * Must be placed after all valid route registrations in app.js.
 */
function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
