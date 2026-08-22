const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dwarka-dental-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Generate a signed JWT for a user.
 * @param {{ id: string, role: string, email: string }} payload
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(
    { id: payload.id, role: payload.role, email: payload.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

/**
 * Verify a JWT and return the decoded payload.
 * @param {string} token
 * @returns {{ id: string, role: string, email: string, iat: number, exp: number }}
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
