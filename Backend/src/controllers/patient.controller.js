const patientService = require('../services/patient.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');

/** GET /api/patients — supports search, filter, sort, pagination */
const getPatients = asyncHandler(async (req, res) => {
  const result = await patientService.getAllPatients(req.query);
  return new ApiResponse(200, result, 'Patients fetched').send(res);
});

/** GET /api/patients/:id */
const getPatient = asyncHandler(async (req, res) => {
  const patient = await patientService.getPatientById(req.params.id);
  return new ApiResponse(200, { patient }, 'Patient fetched').send(res);
});

/** POST /api/patients */
const addPatient = asyncHandler(async (req, res) => {
  const result = await patientService.createPatient(req.body);
  return new ApiResponse(201, result, 'Patient registered successfully').send(res);
});

/** PUT /api/patients/:id */
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await patientService.updatePatient(req.params.id, req.body);
  return new ApiResponse(200, { patient }, 'Patient updated').send(res);
});

/** DELETE /api/patients/:id — Admin only */
const softDeletePatient = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw ApiError.forbidden('Admin-only action.');
  await patientService.softDeletePatient(req.params.id);
  return new ApiResponse(200, null, 'Patient soft-deleted successfully').send(res);
});

module.exports = { getPatients, getPatient, addPatient, updatePatient, softDeletePatient };
