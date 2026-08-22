const express = require('express');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middleware/validateRequest');
const asyncHandler = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const User = require('../models/user.model');
const ApiResponse = require('../utils/ApiResponse');

const router = express.Router();

// POST /api/auth/login — public
router.post(
  '/login',
  validateRequest({ email: { required: true, label: 'Email' }, password: { required: true, label: 'Password' } }),
  authController.login,
);

// GET /api/auth/me — validate token, return current user
router.get('/me', authController.me);

// GET /api/auth/doctors — return list of active doctors (for dropdowns)
router.get('/doctors', authMiddleware, asyncHandler(async (req, res) => {
  let doctors = await User.find({ role: 'doctor', status: 'active' })
    .select('name email specialization phone')
    .lean();

  if (doctors.length === 0) {
    const Clinic = require('../models/clinic.model');
    let clinic = await Clinic.findOne({});
    if (!clinic) {
      clinic = await Clinic.create({
        name: 'Dwarka Dental Clinic',
        email: 'info@dwarkadental.com',
        phone: '+91 98765 00000',
        address: { street: 'Sector 12', city: 'Dwarka, New Delhi', state: 'Delhi', zipCode: '110075' }
      });
    }

    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

    const seeded = await User.insertMany([
      {
        clinicId: clinic._id,
        name: 'Dr. Bhagwan Rakh',
        email: 'dr.rakh@dwarkadental.com',
        passwordHash: defaultPasswordHash,
        role: 'doctor',
        phone: '+91 98220 12345',
        specialization: 'Orthodontics & Implantology',
        status: 'active',
      },
      {
        clinicId: clinic._id,
        name: 'Dr. H M Sanap',
        email: 'dr.sanap@dwarkadental.com',
        passwordHash: defaultPasswordHash,
        role: 'doctor',
        phone: '+91 98220 54321',
        specialization: 'Endodontics & Restorative',
        status: 'active',
      }
    ]);
    doctors = seeded.map(d => d.toObject());
  }

  return new ApiResponse(200, doctors.map((d) => ({
    id: (d._id || d.id).toString(),
    name: d.name,
    email: d.email,
    specialization: d.specialization || '',
    phone: d.phone || '',
  })), 'Doctors fetched').send(res);
}));

// GET /api/auth/staff — return all staff (admin only)
router.get('/staff', authMiddleware, asyncHandler(async (req, res) => {
  const staff = await User.find({ status: 'active' })
    .select('name email role specialization phone status')
    .lean();
  return new ApiResponse(200, staff.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    specialization: u.specialization || '',
    phone: u.phone || '',
    status: u.status,
  })), 'Staff fetched').send(res);
}));

// POST /api/auth/staff — create new staff/doctor with password (Admin only)
router.post('/staff', authMiddleware, asyncHandler(async (req, res) => {
  const { name, email, role = 'receptionist', phone, specialization, password = 'Password@123' } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and Email are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(400).json({ success: false, message: 'User with this email already exists.' });
  }

  const Clinic = require('../models/clinic.model');
  let clinic = await Clinic.findOne({});
  if (!clinic) {
    clinic = await Clinic.create({
      name: 'Dwarka Dental Clinic',
      email: 'info@dwarkadental.com',
      phone: '+91 98765 00000',
      address: { street: 'Sector 12', city: 'Dwarka, New Delhi', state: 'Delhi', zipCode: '110075' }
    });
  }

  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash(password || 'Password@123', 10);

  const newUser = await User.create({
    clinicId: clinic._id,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
    phone: phone || '',
    specialization: specialization || '',
    status: 'active',
  });

  return new ApiResponse(201, {
    id: newUser._id.toString(),
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    phone: newUser.phone,
    specialization: newUser.specialization,
  }, 'Staff member created successfully').send(res);
}));

// PUT /api/auth/staff/:id — update staff/doctor member & password (Admin only)
router.put('/staff/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { name, email, role, phone, specialization, status, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (name) user.name = name.trim();
  if (email) user.email = email.toLowerCase().trim();
  if (role) user.role = role;
  if (phone !== undefined) user.phone = phone;
  if (specialization !== undefined) user.specialization = specialization;
  if (status) user.status = status;

  if (password && password.trim().length > 0) {
    const bcrypt = require('bcryptjs');
    user.passwordHash = await bcrypt.hash(password.trim(), 10);
  }

  await user.save();

  return new ApiResponse(200, {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    specialization: user.specialization,
    status: user.status,
  }, 'Staff member details updated successfully').send(res);
}));

module.exports = router;
