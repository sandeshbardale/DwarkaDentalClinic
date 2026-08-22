/**
 * AI X-Ray Analysis Service
 *
 * Sends the uploaded X-ray image to the ML FastAPI service (ML_SERVICE_URL).
 * If the ML service is unavailable, returns an honest error — NEVER a fake result.
 *
 * Architecture:
 *   React → Node/Express → FastAPI (Python/PyTorch) → prediction → MongoDB
 */
const AiReport = require('../models/ai-report.model');
const File = require('../models/file.model');
const Patient = require('../models/patient.model');
const Clinic = require('../models/clinic.model');
const ApiError = require('../utils/ApiError');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

/** Directory where uploaded X-ray images are stored. */
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function getDefaultClinic() {
  let clinic = await Clinic.findOne({});
  if (!clinic) {
    clinic = await Clinic.create({
      name: 'Dwarka Dental Clinic',
      email: 'info@dwarkadental.com',
      phone: '+91 98765 00000',
      address: { street: 'Sector 12', city: 'Dwarka, New Delhi', state: 'Delhi', zipCode: '110075' }
    });
  }
  return clinic;
}

/**
 * Call the FastAPI ML service with the uploaded image.
 * Returns null if the service is unavailable (never returns fake data).
 *
 * @param {string} imagePath  Absolute path to uploaded image file
 * @returns {Promise<{ result: string, confidence: number, suggestions: string[], modelVersion: string }|null>}
 */
async function callMlService(imagePath) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));

    const response = await axios.post(`${ML_SERVICE_URL}/predict`, form, {
      headers: form.getHeaders(),
      timeout: 30000, // 30 second timeout
    });

    const data = response.data;
    if (!data || !data.result) {
      throw new Error('Invalid response from ML service.');
    }

    return {
      result: data.result,        // 'cavity' | 'normal' | 'uncertain'
      confidence: parseFloat(data.confidence) || 0,
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [data.suggestions || ''],
      modelVersion: data.modelVersion || '1.0.0',
    };
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.response?.status >= 500) {
      console.warn('[AI] ML service unavailable:', err.message);
      return null; // Callers must handle null — never fake the result
    }
    // Propagate unexpected errors
    throw ApiError.internal(`ML service error: ${err.message}`);
  }
}

/**
 * Upload an X-ray, call the ML service, and persist an AiReport.
 * Throws ApiError if ML service is unavailable.
 *
 * @param {object} file       Multer file object (req.file)
 * @param {string} patientId  Patient _id
 * @param {object} requestingUser  { id, role, email } from JWT
 */
async function uploadAndAnalyzeXray(file, patientId, requestingUser) {
  const clinic = await getDefaultClinic();

  const patient = await Patient.findById(patientId);
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');

  const absoluteImagePath = file.path;

  // ── Call real ML service ─────────────────────────────────────────────────
  const aiResult = await callMlService(absoluteImagePath);

  if (!aiResult) {
    // Clean up uploaded file if ML is down so storage doesn't accumulate
    // (optional — remove this block if you want to keep uploads for later retry)
    throw ApiError.internal(
      'AI service is currently unavailable. Please try again later or contact the system administrator.'
    );
  }

  // ── Persist file metadata ────────────────────────────────────────────────
  const fileDoc = await File.create({
    clinicId: clinic._id,
    patientId: patient._id,
    uploadedById: requestingUser ? requestingUser.id : clinic._id,
    fileType: 'xray',
    storageKey: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    uploadedAt: new Date(),
  });

  // ── Persist AI report ────────────────────────────────────────────────────
  const resultNormalized = ['cavity', 'normal', 'uncertain'].includes(aiResult.result.toLowerCase())
    ? aiResult.result.toLowerCase()
    : 'uncertain';

  const report = await AiReport.create({
    clinicId: clinic._id,
    patientId: patient._id,
    fileId: fileDoc._id,
    result: resultNormalized,
    suggestions: aiResult.suggestions,
    confidence: parseFloat(aiResult.confidence.toFixed(4)),
    modelVersion: aiResult.modelVersion,
  });

  return {
    id: report._id.toString(),
    patientId: patientId.toString(),
    image: `/uploads/${file.filename}`,
    result: resultNormalized,
    confidence: report.confidence,
    suggestions: aiResult.suggestions,
    modelVersion: aiResult.modelVersion,
    date: new Date().toISOString().split('T')[0],
    doctorReview: null,
    doctorNotes: null,
  };
}

/**
 * Fetch all AI reports for a patient, newest first.
 */
async function getAiReportsByPatient(patientId) {
  const AiReportModel = require('../models/ai-report.model');
  const reports = await AiReportModel.find({ patientId })
    .populate('fileId', 'storageKey originalName')
    .sort({ createdAt: -1 })
    .lean();

  return reports.map((r) => ({
    id: r._id.toString(),
    patientId: r.patientId.toString(),
    image: r.fileId ? `/uploads/${r.fileId.storageKey}` : null,
    result: r.result,
    confidence: r.confidence,
    suggestions: Array.isArray(r.suggestions) ? r.suggestions : [r.suggestions],
    modelVersion: r.modelVersion || '1.0.0',
    date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : null,
    doctorReview: r.doctorReview || null,
    doctorNotes: r.doctorNotes || null,
  }));
}

/**
 * Doctor reviews an AI report — confirm or reject finding, add notes.
 * @param {string} reportId
 * @param {object} body  { doctorReview: 'confirmed'|'rejected', doctorNotes }
 */
async function reviewAiReport(reportId, body, requestingUser) {
  const report = await AiReport.findById(reportId);
  if (!report) throw ApiError.notFound('AI report not found.');

  report.doctorReview = body.doctorReview;
  report.doctorNotes = body.doctorNotes || '';
  report.reviewedAt = new Date();
  report.reviewedById = requestingUser?.id;
  await report.save();

  return {
    id: report._id.toString(),
    doctorReview: report.doctorReview,
    doctorNotes: report.doctorNotes,
    reviewedAt: report.reviewedAt,
  };
}

module.exports = { uploadAndAnalyzeXray, getAiReportsByPatient, reviewAiReport, UPLOAD_DIR };
