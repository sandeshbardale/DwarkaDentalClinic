const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    durationDays: { type: Number, required: true, min: 1 },
    instructions: { type: String, trim: true },
  },
  { _id: false },
);

const prescriptionSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    clinicalRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicalRecord', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [prescriptionItemSchema], required: true, validate: [(items) => items.length > 0, 'At least one prescription item is required.'] },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
