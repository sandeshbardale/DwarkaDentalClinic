const mongoose = require('mongoose');

const dentalFindingSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    clinicalRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicalRecord', required: true },
    toothNumber: { type: String, required: true, trim: true },
    surface: { type: String, enum: ['mesial', 'distal', 'occlusal', 'buccal', 'lingual', 'all'], required: true },
    condition: { type: String, enum: ['healthy', 'cavity', 'restored', 'missing', 'fractured', 'root_canal', 'implant', 'crown', 'other'], required: true },
    notes: { type: String, trim: true },
    recordedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

dentalFindingSchema.index({ clinicId: 1, patientId: 1, toothNumber: 1 });

module.exports = mongoose.models.DentalFinding || mongoose.model('DentalFinding', dentalFindingSchema);
