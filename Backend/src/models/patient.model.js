const mongoose = require('mongoose');

// Address stored as a plain string to match frontend form input and PatientDetailPage rendering.
// NOTE: The databaseDesign.md specifies a structured address object, but because the current
// frontend sends a flat address string and displays it as text, we use a plain string here.
// Migrate to a structured schema when the frontend form is updated.
const emergencyContactSchema = new mongoose.Schema({ name: { type: String, trim: true }, relation: { type: String, trim: true }, phone: { type: String, trim: true } }, { _id: false });

const patientSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    patientNumber: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    emergencyContact: emergencyContactSchema,
    chiefComplaint: { type: String, trim: true },
    medicalHistory: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    allergies: [{ type: String, trim: true }],
    medicalAlerts: [{ type: String, trim: true }],
    generalMedicalHistory: { type: String, trim: true },
    assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['new', 'follow_up', 'completed', 'inactive'], default: 'new' },
    registeredAt: { type: Date, default: Date.now },
    lastVisitAt: Date,
    nextFollowUpAt: Date,
    totalVisits: { type: Number, min: 0, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

patientSchema.index({ clinicId: 1, patientNumber: 1 }, { unique: true });
patientSchema.index({ clinicId: 1, phone: 1 });

module.exports = mongoose.models.Patient || mongoose.model('Patient', patientSchema);
