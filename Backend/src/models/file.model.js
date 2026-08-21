const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    clinicalRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicalRecord' },
    uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileType: { type: String, enum: ['xray', 'photo', 'prescription', 'document'], required: true },
    storageKey: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

fileSchema.index({ clinicId: 1, patientId: 1, uploadedAt: -1 });
fileSchema.index({ storageKey: 1 }, { unique: true });

module.exports = mongoose.models.File || mongoose.model('File', fileSchema);
