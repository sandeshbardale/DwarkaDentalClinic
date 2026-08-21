const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    appointmentNumber: { type: String, required: true, trim: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    treatmentCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'TreatmentCategory' },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
    notes: { type: String, trim: true },
    rescheduledFromId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    confirmedAt: Date,
    completedAt: Date,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

appointmentSchema.index({ clinicId: 1, appointmentNumber: 1 }, { unique: true });
appointmentSchema.index({ clinicId: 1, doctorId: 1, startAt: 1 });
appointmentSchema.index({ clinicId: 1, patientId: 1, startAt: -1 });
appointmentSchema.index({ clinicId: 1, status: 1, startAt: 1 });
appointmentSchema.pre('validate', function validateAppointmentTimes(next) { if (this.startAt && this.endAt && this.endAt <= this.startAt) return next(new Error('endAt must be after startAt.')); next(); });

module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
