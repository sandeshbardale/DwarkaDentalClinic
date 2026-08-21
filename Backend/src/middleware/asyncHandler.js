/**
 * asyncHandler — wraps an async route handler and forwards any thrown error
 * to the next() function so it reaches the centralized errorHandler middleware.
 *
 * Usage:
 *   router.get('/patients', asyncHandler(patientController.getPatients));
 *
 * @param {Function} fn  Async Express route handler (req, res, next)
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
