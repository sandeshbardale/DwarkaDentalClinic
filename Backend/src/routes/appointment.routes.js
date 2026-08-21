const express = require('express');
const appointmentController = require('../controllers/appointment.controller');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// TODO: add authMiddleware here when auth / JWT is implemented

/** GET /api/appointments */
router.get('/', appointmentController.getAppointments);

/** POST /api/appointments */
router.post(
  '/',
  validateRequest({
    patientId: { required: true, label: 'Patient' },
    doctorId: { required: true, label: 'Doctor' },
    date: { required: true, label: 'Date' },
    time: { required: true, label: 'Time' },
  }),
  appointmentController.bookAppointment,
);

/** PUT /api/appointments/:id/status */
router.put('/:id/status', appointmentController.updateAppointmentStatus);

/** DELETE /api/appointments/:id — soft-delete (Admin only) */
router.delete('/:id', appointmentController.softDeleteAppointment);

module.exports = router;
