const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { generateToken } = require('../utils/generateToken');

/**
 * Authenticate a user against the database.
 * Uses bcrypt for password verification.
 * Returns a signed JWT and safe user object.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ user: object, role: string, token: string }}
 */
async function login(email, password) {
  const normalizedEmail = email.toLowerCase().trim();

  // Fetch user with passwordHash (selected: false by default in model)
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw ApiError.badRequest('Invalid email or password.');
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden('Account is inactive. Please contact the administrator.');
  }

  // Compare provided password with stored bcrypt hash or fallback to direct match
  let isMatch = false;
  try {
    isMatch = await bcrypt.compare(password, user.passwordHash);
  } catch (_) {}

  if (!isMatch && user.passwordHash === password) {
    isMatch = true;
  }

  if (!isMatch) {
    throw ApiError.badRequest('Invalid email or password.');
  }

  // Update last login timestamp
  User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();

  const userResponse = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    specialization: user.specialization,
  };

  // Map sub-roles (assistant, lab_technician, staff) to receptionist role for UI navigation
  const mappedRole = ['admin', 'doctor'].includes(user.role) ? user.role : 'receptionist';

  // Generate JWT token
  const token = generateToken({ id: userResponse.id, role: mappedRole, email: user.email });

  return { user: userResponse, role: mappedRole, token };
}

module.exports = { login };
