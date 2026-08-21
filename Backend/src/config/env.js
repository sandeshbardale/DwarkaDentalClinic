const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from Backend/.env
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const config = {
  MONGODB_URI: process.env.MONGODB_URI,
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Simple validation
if (!config.MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI is not set in environment. App will boot in simulation/demo mode.');
}

module.exports = config;
