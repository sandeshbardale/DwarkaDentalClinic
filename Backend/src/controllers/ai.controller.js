const aiService = require('../services/ai.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');

/** POST /api/ai/upload — upload X-ray and run real ML analysis */
const uploadAndAnalyzeXray = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Please upload an X-ray image file.');
  const { patientId } = req.body;
  if (!patientId) throw ApiError.badRequest('Patient ID is required.');

  const report = await aiService.uploadAndAnalyzeXray(req.file, patientId, req.user);
  return new ApiResponse(201, { report }, 'X-ray analyzed successfully').send(res);
});

/** GET /api/ai/reports/:patientId */
const getAiReportsByPatient = asyncHandler(async (req, res) => {
  const reports = await aiService.getAiReportsByPatient(req.params.patientId);
  return new ApiResponse(200, reports, 'AI reports fetched').send(res);
});

/** PATCH /api/ai/reports/:id/review — doctor confirms or rejects AI finding */
const reviewAiReport = asyncHandler(async (req, res) => {
  if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
    throw ApiError.forbidden('Only doctors can review AI reports.');
  }
  const result = await aiService.reviewAiReport(req.params.id, req.body, req.user);
  return new ApiResponse(200, result, 'AI report reviewed').send(res);
});

module.exports = { uploadAndAnalyzeXray, getAiReportsByPatient, reviewAiReport };
