/**
 * Custom API Error class.
 * Thrown by services/controllers; caught by errorHandler middleware.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode  HTTP status code (400, 404, 500…)
   * @param {string} message     Human-readable error message
   * @param {Array}  errors      Optional array of field-level validation errors
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static forbidden(message = 'Access denied') {
    return new ApiError(403, message);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
