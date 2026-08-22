const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const config = {
  MONGODB_URI: process.env.MONGODB_URI,
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'dwarka-dental-jwt-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
};

if (!config.MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI is not set in environment.');
}

if (config.JWT_SECRET === 'dwarka-dental-jwt-secret-change-in-production') {
  console.warn('WARNING: Using default JWT_SECRET. Set JWT_SECRET in .env for production.');
}

module.exports = config;
