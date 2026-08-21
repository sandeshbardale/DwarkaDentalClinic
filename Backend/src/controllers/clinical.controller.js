const clinicalService = require('../services/clinical.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/clinical/:patientId
 */
const getClinicalRecordsByPatient = asyncHandler(async (req, res) => {
  const records = await clinicalService.getClinicalRecordsByPatient(req.params.patientId);
  return new ApiResponse(200, records, 'Clinical records fetched').send(res);
});

/**
 * POST /api/clinical
 */
const addClinicalRecord = asyncHandler(async (req, res) => {
  const record = await clinicalService.addClinicalRecord(req.body);
  return new ApiResponse(201, { record }, 'Clinical record added').send(res);
});

module.exports = { getClinicalRecordsByPatient, addClinicalRecord };
