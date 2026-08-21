const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * POST /api/auth/login
 * Authenticate a user. Falls back to demo accounts when DB is unavailable.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password, req.app.locals.databaseAvailable);
  return new ApiResponse(200, result, 'Login successful').send(res);
});

module.exports = { login };
