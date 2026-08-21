const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

/** Demo users for simulation/fallback mode (no database). */
const DEMO_USERS = [
  { _id: 'demo-admin', name: 'Administrator', email: 'admin@dwarkadental.com', password: 'admin123', role: 'admin' },
  { _id: 'demo-doctor', name: 'Dr. Neha Sharma', email: 'doctor@dwarkadental.com', password: 'doctor123', role: 'doctor', specialization: 'General Dentistry' },
  { _id: 'demo-receptionist', name: 'Priya Patel', email: 'receptionist@dwarkadental.com', password: 'recep123', role: 'receptionist' },
];

/**
 * Authenticate a user.
 * Supports demo accounts in both database mode and simulation/fallback mode.
 *
 * @param {string}  email
 * @param {string}  password
 * @param {boolean} dbAvailable  Whether MongoDB is connected
 * @returns {{ user: object, role: string, demoMode?: boolean }}
 */
async function login(email, password, dbAvailable) {
  const normalizedEmail = email.toLowerCase().trim();

  if (!dbAvailable) {
    const demoUser = DEMO_USERS.find(
      (u) => u.email === normalizedEmail && u.password === password,
    );
    if (!demoUser) {
      throw ApiError.badRequest('Invalid email or password.');
    }
    const { password: _p, ...safeUser } = demoUser;
    return { user: safeUser, role: demoUser.role, demoMode: true };
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw ApiError.badRequest('Invalid email or password.');
  }

  // NOTE: passwordHash comparison placeholder — replace with bcrypt.compare(password, user.passwordHash) when full auth is enabled.
  // TODO: add authMiddleware / bcrypt comparison here when full auth is implemented.
  if (user.passwordHash === 'DEMO_PASSWORD_HASH_REPLACE_WITH_BCRYPT') {
    const validDemoPasswords = ['admin123', 'doctor123', 'recep123'];
    if (!validDemoPasswords.includes(password)) {
      throw ApiError.badRequest('Invalid email or password.');
    }
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden('Account is inactive. Please contact the administrator.');
  }

  const userResponse = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    specialization: user.specialization,
  };

  return { user: userResponse, role: user.role };
}

module.exports = { login };
