const mongoose = require('mongoose');

const clinicalRecordSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    visitDate: { type: Date, required: true },
    chiefComplaint: { type: String, trim: true },
    diagnosis: { type: String, trim: true },
    treatment: { type: String, trim: true },
    clinicalNotes: { type: String, trim: true },
    prescription: { type: String }, // Stringified JSON array of prescription items
    doctorName: { type: String, trim: true }, // Denormalised for display performance
    followUpDate: Date,
    followUpInstructions: { type: String, trim: true },
    status: { type: String, enum: ['draft', 'completed', 'edited'], default: 'draft' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

clinicalRecordSchema.index({ clinicId: 1, patientId: 1, visitDate: -1 });

module.exports = mongoose.models.ClinicalRecord || mongoose.model('ClinicalRecord', clinicalRecordSchema);
