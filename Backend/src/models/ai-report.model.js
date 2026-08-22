const mongoose = require('mongoose');

const aiReportSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
    result: { type: String, enum: ['cavity', 'normal', 'uncertain'], required: true },
    suggestions: [{ type: String, trim: true }],
    confidence: { type: Number, required: true, min: 0, max: 1 },
    modelVersion: { type: String, required: true, trim: true },
    reviewedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    doctorReview: { type: String, enum: ['confirmed', 'rejected', null], default: null },
    doctorNotes: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = mongoose.models.AiReport || mongoose.model('AiReport', aiReportSchema);
