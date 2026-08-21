const express = require('express');
const clinicalController = require('../controllers/clinical.controller');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// TODO: add authMiddleware here when auth / JWT is implemented

/** GET /api/clinical/:patientId */
router.get('/:patientId', clinicalController.getClinicalRecordsByPatient);

/** POST /api/clinical */
router.post(
  '/',
  validateRequest({
    patientId: { required: true, label: 'Patient' },
    doctorId: { required: true, label: 'Doctor' },
    diagnosis: { required: true, label: 'Diagnosis' },
    treatment: { required: true, label: 'Treatment' },
  }),
  clinicalController.addClinicalRecord,
);

module.exports = router;
