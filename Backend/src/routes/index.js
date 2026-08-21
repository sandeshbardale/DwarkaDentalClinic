const express = require('express');
const Appointment = require('../models/appointment.model');
const Patient = require('../models/patient.model');
const { sendWhatsAppReminder } = require('../utils/whatsapp');

const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const appointmentRoutes = require('./appointment.routes');
const paymentRoutes = require('./payment.routes');
const clinicalRoutes = require('./clinical.routes');
const aiRoutes = require('./ai.routes');

const router = express.Router();

// TODO: mount authMiddleware globally here when JWT auth is implemented
// router.use(authMiddleware);

// ─── Domain sub-routers ───────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/clinical', clinicalRoutes);
router.use('/ai', aiRoutes);

// ─── WhatsApp reminder mass dispatch ─────────────────────────────────────────
// Kept inline as it's a cross-domain operation (appointments + patients + notifications)
// that would be refactored into a notifications service in a later iteration.
router.post('/notifications/send-reminders', async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Find all scheduled/confirmed appointments for tomorrow
    const tomorrowStart = new Date(`${tomorrowStr}T00:00:00.000Z`);
    const tomorrowEnd = new Date(`${tomorrowStr}T23:59:59.999Z`);

    const appointments = await Appointment.find({
      startAt: { $gte: tomorrowStart, $lte: tomorrowEnd },
      status: { $in: ['scheduled', 'confirmed'] },
      isDeleted: false,
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
        results.push({ patientName: patient.name, phone: patient.phone, ...reminderResult });
      }
    }

    return res.json({ success: true, processedCount: results.length, details: results });
  } catch (error) {
    console.error('[Reminders] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send reminders.' });
  }
});

module.exports = router;
