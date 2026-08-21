const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authController = require('../controller/authController');
const patientController = require('../controller/patientController');
const appointmentController = require('../controller/appointmentController');
const paymentController = require('../controller/paymentController');
const clinicalController = require('../controller/clinicalController');
const aiController = require('../controller/aiController');
const { sendWhatsAppReminder } = require('../utils/whatsapp');
const { Appointment } = require('../database');

const router = express.Router();

// ─── MULTER FILE UPLOAD SETUP ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, aiController.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'xray-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, or PNG X-ray images are allowed.'));
  },
});

// ─── AUTHENTICATION ROUTES ──────────────────────────────────────────────────
router.post('/auth/login', authController.login);

// ─── PATIENT ROUTES ─────────────────────────────────────────────────────────
router.get('/patients', patientController.getPatients);
router.post('/patients', patientController.addPatient);
router.put('/patients/:id', patientController.updatePatient);
router.delete('/patients/:id', patientController.softDeletePatient); // Soft delete (Admin only)

// ─── APPOINTMENT ROUTES ─────────────────────────────────────────────────────
router.get('/appointments', appointmentController.getAppointments);
router.post('/appointments', appointmentController.bookAppointment);
router.put('/appointments/:id/status', appointmentController.updateAppointmentStatus);
router.delete('/appointments/:id', appointmentController.softDeleteAppointment); // Soft delete (Admin only)

// ─── BILLING / PAYMENT ROUTES ───────────────────────────────────────────────
router.get('/payments', paymentController.getPayments);
router.post('/payments', paymentController.addPayment);
router.delete('/payments/:id', paymentController.softDeletePayment); // Soft delete (Admin only)
router.get('/payments/summary', paymentController.getRevenueSummary);

// ─── CLINICAL HISTORY ROUTES ────────────────────────────────────────────────
router.get('/clinical/:patientId', clinicalController.getClinicalRecordsByPatient);
router.post('/clinical', clinicalController.addClinicalRecord);

// ─── AI CAVITY DETECTION ROUTES ─────────────────────────────────────────────
router.post('/ai/upload', upload.single('xray'), aiController.uploadAndAnalyzeXray);
router.get('/ai/reports/:patientId', aiController.getAiReportsByPatient);

// ─── WHATSAPP REMINDER MASS DISPATCH ───────────────────────────────────────
router.post('/notifications/send-reminders', async (req, res) => {
  try {
    // Determine tomorrow's date string YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Find all scheduled/confirmed appointments for tomorrow
    const appointments = await Appointment.findAll({
      where: {
        date: tomorrowStr,
        status: ['scheduled', 'confirmed'],
        isDeleted: false,
      },
    });

    const results = [];
    const { Patient } = require('../database');
    
    for (const apt of appointments) {
      const patient = await Patient.findByPk(apt.patientId);
      if (patient && patient.phone) {
        const reminderResult = await sendWhatsAppReminder({
          phone: patient.phone,
          patientName: patient.name,
          date: apt.date,
          time: apt.time,
          doctorName: apt.doctorName,
        });
        results.push({
          patientName: patient.name,
          phone: patient.phone,
          ...reminderResult,
        });
      }
    }

    return res.json({
      success: true,
      processedCount: results.length,
      details: results,
    });
  } catch (error) {
    console.error('Trigger reminders error:', error);
    return res.status(500).json({ error: 'Failed to send tomorrow reminders.' });
  }
});

module.exports = router;
