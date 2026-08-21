const aiService = require('../services/ai.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * POST /api/ai/upload
 * Upload an X-ray image and run AI cavity detection.
 */
const uploadAndAnalyzeXray = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Please upload an X-ray image file.');
  const { patientId } = req.body;
  if (!patientId) throw ApiError.badRequest('Patient ID is required.');

  const report = await aiService.uploadAndAnalyzeXray(req.file, patientId);
  return new ApiResponse(201, { report }, 'X-ray analyzed successfully').send(res);
});

/**
 * GET /api/ai/reports/:patientId
 */
const getAiReportsByPatient = asyncHandler(async (req, res) => {
  const reports = await aiService.getAiReportsByPatient(req.params.patientId);
  return new ApiResponse(200, reports, 'AI reports fetched').send(res);
});

module.exports = { uploadAndAnalyzeXray, getAiReportsByPatient };
