const patientService = require('../services/patient.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/patients
 * Return all non-deleted patients.
 */
const getPatients = asyncHandler(async (req, res) => {
  const patients = await patientService.getAllPatients();
  return new ApiResponse(200, patients, 'Patients fetched').send(res);
});

/**
 * POST /api/patients
 * Register a new patient, optionally book their first appointment.
 */
const addPatient = asyncHandler(async (req, res) => {
  const result = await patientService.createPatient(req.body);
  return new ApiResponse(201, result, 'Patient registered successfully').send(res);
});

/**
 * PUT /api/patients/:id
 * Update an existing patient's details.
 */
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await patientService.updatePatient(req.params.id, req.body);
  return new ApiResponse(200, { patient }, 'Patient updated').send(res);
});

/**
 * DELETE /api/patients/:id
 * Soft-delete a patient. Admin only (enforced via x-user-role header for now).
 * TODO: replace x-user-role check with authMiddleware once auth is implemented.
 */
const softDeletePatient = asyncHandler(async (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') throw ApiError.forbidden('Admin-only action.');
  await patientService.softDeletePatient(req.params.id);
  return new ApiResponse(200, null, 'Patient soft-deleted successfully').send(res);
});

module.exports = { getPatients, addPatient, updatePatient, softDeletePatient };
