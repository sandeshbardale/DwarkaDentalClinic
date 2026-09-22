/**
 * Seed Script — Dwarka Dental Clinic
 * Creates a clinic record and default admin/doctor/receptionist users.
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Models ───────────────────────────────────────────────────────────────────
const Clinic = require('./src/models/clinic.model');
const User   = require('./src/models/user.model');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI not set in .env');
  process.exit(1);
}

async function seed() {
  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connected.');

  // ── 1. Upsert clinic ──────────────────────────────────────────────────────
  let clinic = await Clinic.findOne({ email: 'clinic@dwarkadental.com' });
  if (!clinic) {
    clinic = await Clinic.create({
      name:  'Dwarka Dental Clinic',
      phone: '+91 98765 00000',
      email: 'clinic@dwarkadental.com',
      address: {
        line1:      'Sector 12, Dwarka',
        city:       'New Delhi',
        state:      'Delhi',
        postalCode: '110078',
        country:    'India',
      },
      isActive: true,
    });
    console.log('🏥  Clinic created:', clinic._id);
  } else {
    console.log('🏥  Clinic already exists:', clinic._id);
  }

  const clinicId = clinic._id;

  // ── 2. Define default users ───────────────────────────────────────────────
  const users = [
    {
      name:           'Dr. Admin',
      email:          'admin@dwarkadental.com',
      password:       'admin123',
      role:           'admin',
      phone:          '+91 98765 00001',
      specialization: 'Clinic Management',
    },
    {
      name:           'Dr. Neha Sharma',
      email:          'doctor@dwarkadental.com',
      password:       'doctor123',
      role:           'doctor',
      phone:          '+91 98765 00002',
      specialization: 'General Dentistry',
    },
    {
      name:           'Dr. Rohan Mehta',
      email:          'rohan@dwarkadental.com',
      password:       'rohan123',
      role:           'doctor',
      phone:          '+91 98765 00004',
      specialization: 'Endodontics & RCT',
    },
    {
      name:  'Priya Patel',
      email: 'receptionist@dwarkadental.com',
      password: 'receptionist123',
      role:  'receptionist',
      phone: '+91 98765 00003',
    },
  ];

  // ── 3. Upsert each user ───────────────────────────────────────────────────
  for (const u of users) {
    const existing = await User.findOne({ clinicId, email: u.email });
    const passwordHash = await bcrypt.hash(u.password, 10);

    if (existing) {
      await User.updateOne({ _id: existing._id }, { passwordHash, name: u.name, status: 'active' });
      console.log(`🔄  Updated  : ${u.email} (${u.role})`);
    } else {
      await User.create({
        clinicId,
        name:           u.name,
        email:          u.email,
        passwordHash,
        role:           u.role,
        phone:          u.phone,
        specialization: u.specialization || undefined,
        status:         'active',
      });
      console.log(`✨  Created  : ${u.email} (${u.role})`);
    }
  }

  console.log('\n🎉  Seed complete! Login credentials:');
  console.log('─────────────────────────────────────────────────────────────');
  users.forEach(u =>
    console.log(`  ${u.role.padEnd(14)} │ ${u.email.padEnd(38)} │ ${u.password}`)
  );
  console.log('─────────────────────────────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
