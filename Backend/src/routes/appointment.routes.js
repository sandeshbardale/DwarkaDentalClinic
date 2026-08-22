const express = require('express');
const appointmentController = require('../controllers/appointment.controller');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
// Note: authMiddleware is applied in routes/index.js

router.get('/', appointmentController.getAppointments);
router.get('/patient/:patientId', appointmentController.getByPatient);
router.post('/', appointmentController.bookAppointment);
router.put('/:id/status', appointmentController.updateStatus);
router.delete('/:id', requireRole('admin'), appointmentController.softDelete);

module.exports = router;
