const dns = require('node:dns');
const mongoose = require('mongoose');
const config = require('./env');

// Prefer Google/Cloudflare DNS for Atlas SRV resolution
dns.setServers(['8.8.8.8', '1.1.1.1']);

/**
 * Seeds the database with a default Clinic and demo staff accounts if the
 * collections are empty. This ensures all required FKs exist on first boot.
 */
async function seedDefaultData() {
  const Clinic = require('../models/clinic.model');
  const User = require('../models/user.model');

  let clinic = await Clinic.findOne({});
  if (!clinic) {
    clinic = await Clinic.create({
      name: 'Dwarka Dental Clinic',
      phone: '9000000000',
      email: 'info@dwarkadental.com',
      address: {
        line1: 'Sector 12',
        line2: '',
        city: 'Dwarka',
        state: 'Delhi',
        postalCode: '110075',
        country: 'India',
      },
      isActive: true,
    });
    console.log('[Seed] Default clinic created:', clinic._id.toString());
  }

  // Use a stable bcrypt-style placeholder hash for demo passwords.
  // Real auth can replace this with bcrypt in the auth middleware layer.
  const DEMO_HASH = 'DEMO_PASSWORD_HASH_REPLACE_WITH_BCRYPT';

  const defaultUsers = [
    { name: 'Administrator', email: 'admin@dwarkadental.com', role: 'admin', specialization: undefined },
    { name: 'Dr. Neha Sharma', email: 'doctor@dwarkadental.com', role: 'doctor', specialization: 'General Dentistry' },
    { name: 'Priya Patel', email: 'receptionist@dwarkadental.com', role: 'receptionist', specialization: undefined },
  ];

  for (const u of defaultUsers) {
    const exists = await User.findOne({ clinicId: clinic._id, email: u.email });
    if (!exists) {
      await User.create({
        clinicId: clinic._id,
        name: u.name,
        email: u.email,
        passwordHash: DEMO_HASH,
        role: u.role,
        ...(u.specialization ? { specialization: u.specialization } : {}),
        status: 'active',
      });
      console.log(`[Seed] Default user created: ${u.email} (${u.role})`);
    }
  }

  return clinic;
}

/**
 * Connects to MongoDB Atlas, then seeds default data when needed.
 * Resolves with the clinic document so services can attach clinicId.
 */
async function connectDB() {
  if (!config.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured. Add it to Backend/.env.');
  }

  let timeoutId;
  try {
    const pendingConnection = mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
    });
    const connectionTimeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('MongoDB connection timed out after 12 seconds.'));
      }, 12_000);
    });
    const connection = await Promise.race([pendingConnection, connectionTimeout]);
    clearTimeout(timeoutId);
    console.log(`[DB] MongoDB connected: ${connection.connection.host}`);

    const clinic = await seedDefaultData();
    // Attach default clinic ID to app-wide locals (accessed in services)
    return clinic;
  } catch (error) {
    clearTimeout(timeoutId);
    mongoose.disconnect().catch(() => undefined);
    console.error('[DB] Connection failed:', error.message);
    throw error;
  }
}

module.exports = { connectDB };
