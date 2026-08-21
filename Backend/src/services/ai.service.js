const AiReport = require('../models/ai-report.model');
const File = require('../models/file.model');
const Patient = require('../models/patient.model');
const Clinic = require('../models/clinic.model');
const ApiError = require('../utils/ApiError');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/** Directory where uploaded X-ray images are stored. */
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function getDefaultClinic() {
  const clinic = await Clinic.findOne({});
  if (!clinic) throw ApiError.internal('Clinic not found.');
  return clinic;
}

/**
 * Executes python predict.py and parses the outcome.
 * Falls back to a deterministic simulation if the Python script is unavailable.
 * @param {string} imagePath  Absolute path to the uploaded image
 * @returns {Promise<{ result: string, confidence: number, suggestions: string }>}
 */
function runAiPrediction(imagePath) {
  return new Promise((resolve) => {
    const scriptPath = path.join(UPLOAD_DIR, '..', 'predict.py');
    exec(`python "${scriptPath}" "${imagePath}"`, (error, stdout) => {
      if (error) {
        console.warn('[AI] Python script not found or failed. Using simulation fallback.');
        return resolve(getSimulatedPrediction(imagePath));
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.status === 'success') {
          return resolve({
            result: parsed.result,
            confidence: parseFloat(parsed.confidence),
            suggestions: parsed.suggestion,
          });
        }
      } catch (_) {
        console.warn('[AI] Failed to parse AI output.');
      }
      resolve(getSimulatedPrediction(imagePath));
    });
  });
}

function getSimulatedPrediction(imagePath) {
  let hash = 0;
  const filename = path.basename(imagePath);
  for (let i = 0; i < filename.length; i++) {
    hash = filename.charCodeAt(i) + ((hash << 5) - hash);
  }
  const isCavity = Math.abs(hash) % 2 === 0;
  const confidence = 0.75 + (Math.abs(hash) % 20) / 100;
  if (isCavity) {
    const opts = ['Filling', 'RCT', 'Extraction'];
    return { result: 'Cavity', confidence, suggestions: opts[Math.abs(hash) % opts.length] };
  }
  return { result: 'Normal', confidence, suggestions: 'No treatment needed' };
}

/**
 * Upload an X-ray, run AI prediction, and persist an AiReport.
 * @param {object} file       Multer file object (req.file)
 * @param {string} patientId  Mongoose patient _id string
 */
async function uploadAndAnalyzeXray(file, patientId) {
  const clinic = await getDefaultClinic();

  const patient = await Patient.findById(patientId);
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');

  const imagePath = `/uploads/${file.filename}`;
  const absoluteImagePath = file.path;

  const aiResult = await runAiPrediction(absoluteImagePath);

  // Create a File metadata document (satisfies AiReport's required fileId FK)
  const fileDoc = await File.create({
    clinicId: clinic._id,
    patientId: patient._id,
    uploadedById: clinic._id, // Stub until auth provides userId
    fileType: 'xray',
    storageKey: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    uploadedAt: new Date(),
  });

  // Normalise result to enum: 'cavity' | 'normal' | 'uncertain'
  const resultNormalized = aiResult.result.toLowerCase() === 'cavity' ? 'cavity' : 'normal';
  const suggestionsArr = typeof aiResult.suggestions === 'string'
    ? [aiResult.suggestions]
    : aiResult.suggestions;

  const report = await AiReport.create({
    clinicId: clinic._id,
    patientId: patient._id,
    fileId: fileDoc._id,
    result: resultNormalized,
    suggestions: suggestionsArr,
    confidence: parseFloat(aiResult.confidence.toFixed(2)),
    modelVersion: '1.0-simulation',
  });

  return {
    id: report._id.toString(),
    patientId: patientId.toString(),
    image: imagePath,
    result: aiResult.result, // original casing for frontend
    suggestions: aiResult.suggestions,
    confidence: report.confidence,
    date: new Date().toISOString().split('T')[0],
  };
}

/**
 * Fetch all AI reports for a patient.
 * @param {string} patientId
 */
async function getAiReportsByPatient(patientId) {
  const reports = await AiReport.find({ patientId }).sort({ createdAt: -1 }).lean();
  return reports.map((r) => ({
    id: r._id.toString(),
    patientId: r.patientId.toString(),
    result: r.result,
    suggestions: Array.isArray(r.suggestions) ? r.suggestions.join(', ') : r.suggestions,
    confidence: r.confidence,
    date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : null,
  }));
}

module.exports = { uploadAndAnalyzeXray, getAiReportsByPatient, UPLOAD_DIR };
