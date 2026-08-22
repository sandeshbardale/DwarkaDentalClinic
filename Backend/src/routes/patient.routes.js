const express = require('express');
const patientController = require('../controllers/patient.controller');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();
// Note: authMiddleware is applied in routes/index.js before this router

router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatient);
router.post(
  '/',
  validateRequest({ name: { required: true, label: 'Name' }, phone: { required: true, label: 'Phone' } }),
  patientController.addPatient,
);
router.put('/:id', patientController.updatePatient);
router.delete('/:id', patientController.softDeletePatient);

module.exports = router;
