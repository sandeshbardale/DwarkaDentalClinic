const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { verifyToken } = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');
const User = require('../models/user.model');

/**
 * POST /api/auth/login
 * Returns: { success, user, role, token }
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return new ApiResponse(200, result, 'Login successful').send(res);
});

/**
 * GET /api/auth/me
 * Verify JWT and return current user profile.
 * Frontend calls this on refresh to validate the stored token.
 */
const me = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No token provided.');
  }
  const token = authHeader.slice(7).trim();
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token.');
  }

  const user = await User.findById(decoded.id).select('-passwordHash');
  if (!user || user.status !== 'active') {
    throw ApiError.unauthorized('User not found or inactive.');
  }

  return new ApiResponse(200, {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      specialization: user.specialization,
    },
    role: user.role,
  }, 'Authenticated').send(res);
});

module.exports = { login, me };
