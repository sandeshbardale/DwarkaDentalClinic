const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const appointmentRoutes = require('./appointment.routes');
const paymentRoutes = require('./payment.routes');
const clinicalRoutes = require('./clinical.routes');
const aiRoutes = require('./ai.routes');
const categoryRoutes = require('./treatment-category.routes');

const router = express.Router();

// ─── Public routes ────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ─── Protected routes — all require valid JWT ─────────────────────────────────
router.use('/categories', categoryRoutes); // has own authMiddleware inside
router.use('/patients', authMiddleware, patientRoutes);
router.use('/appointments', authMiddleware, appointmentRoutes);
router.use('/payments', authMiddleware, paymentRoutes);
router.use('/clinical', authMiddleware, clinicalRoutes);
router.use('/ai', authMiddleware, aiRoutes);

// ─── Admin: Dashboard aggregation stats ───────────────────────────────────────
const Appointment = require('../models/appointment.model');
const Patient = require('../models/patient.model');
const Payment = require('../models/payment.model');
const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

router.get('/stats/dashboard', authMiddleware, asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const [totalPatients, todayApts, missedApts, upcomingApts, completedApts] = await Promise.all([
    Patient.countDocuments({ isDeleted: false }),
    Appointment.countDocuments({ isDeleted: false, startAt: { $gte: todayStart, $lte: todayEnd }, status: { $nin: ['cancelled'] } }),
    Appointment.countDocuments({ isDeleted: false, startAt: { $lt: now }, status: { $in: ['scheduled', 'confirmed'] } }),
    Appointment.countDocuments({ isDeleted: false, startAt: { $gt: todayEnd }, status: { $in: ['scheduled', 'confirmed'] } }),
    Appointment.countDocuments({ isDeleted: false, status: 'completed' }),
  ]);

  // Revenue today
  const todayRevResult = await Payment.aggregate([
    { $match: { isDeleted: false, paidAt: { $gte: todayStart, $lte: todayEnd } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const todayRevenue = todayRevResult[0] ? todayRevResult[0].total / 100 : 0;

  // Total outstanding (all unpaid invoices simplified to: total payments received)
  const totalRevResult = await Payment.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalRevenue = totalRevResult[0] ? totalRevResult[0].total / 100 : 0;

  // Category breakdown aggregation
  const treatmentCategoryService = require('../services/treatment-category.service');
  const allCategories = await treatmentCategoryService.getCategories({ status: 'active' });

  const categoryAgg = await Appointment.aggregate([
    { $match: { isDeleted: false, treatmentCategoryId: { $exists: true, $ne: null } } },
    { $group: { _id: '$treatmentCategoryId', count: { $sum: 1 } } },
  ]);

  const catMap = Object.fromEntries(categoryAgg.map(c => [c._id.toString(), c.count]));

  const categoryBreakdown = allCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    code: cat.code,
    count: catMap[cat.id] || 0,
  })).sort((a, b) => b.count - a.count);

  return new ApiResponse(200, {
    totalPatients,
    todayAppointments: todayApts,
    missedAppointments: missedApts,
    upcomingAppointments: upcomingApts,
    completedAppointments: completedApts,
    todayRevenue,
    totalRevenue,
    categoryBreakdown,
  }, 'Dashboard stats fetched').send(res);
}));

// ─── WhatsApp reminder dispatch ────────────────────────────────────────────────
const { sendWhatsAppReminder } = require('../utils/whatsapp');

router.post('/notifications/send-reminders', authMiddleware, asyncHandler(async (req, res) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const tomorrowStart = new Date(`${tomorrowStr}T00:00:00.000Z`);
  const tomorrowEnd = new Date(`${tomorrowStr}T23:59:59.999Z`);

  const appointments = await Appointment.find({
    startAt: { $gte: tomorrowStart, $lte: tomorrowEnd },
    status: { $in: ['scheduled', 'confirmed'] },
    isDeleted: false,
    reminderSent: { $ne: true }, // dedup — skip already-sent reminders
  }).lean();

  const results = [];
  for (const apt of appointments) {
    const patient = await Patient.findById(apt.patientId).lean();
    if (patient && patient.phone) {
      const startAt = new Date(apt.startAt);
      const reminderResult = await sendWhatsAppReminder({
        phone: patient.phone,
        patientName: patient.name,
        date: startAt.toISOString().split('T')[0],
        time: startAt.toTimeString().slice(0, 5),
        doctorName: 'Doctor',
      });
      // Mark reminder as sent to prevent duplicates
      await Appointment.findByIdAndUpdate(apt._id, { reminderSent: true, reminderSentAt: new Date() });
      results.push({ patientName: patient.name, phone: patient.phone, ...reminderResult });
    }
  }

  return new ApiResponse(200, { processedCount: results.length, details: results }, 'Reminders dispatched').send(res);
}));

module.exports = router;
