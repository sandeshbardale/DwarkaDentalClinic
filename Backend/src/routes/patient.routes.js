const express = require('express');
const patientController = require('../controllers/patient.controller');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// TODO: add authMiddleware here when auth / JWT is implemented

/** GET /api/patients — list all patients */
router.get('/', patientController.getPatients);

/** POST /api/patients — register a new patient */
router.post(
  '/',
  validateRequest({ name: { required: true, label: 'Name' }, phone: { required: true, label: 'Phone' } }),
  patientController.addPatient,
);

/** PUT /api/patients/:id — update patient details */
router.put('/:id', patientController.updatePatient);

/** DELETE /api/patients/:id — soft-delete (Admin only) */
router.delete('/:id', patientController.softDeletePatient);

module.exports = router;
