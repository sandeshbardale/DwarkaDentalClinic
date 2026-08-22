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
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'missed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
    priority: { type: String, enum: ['normal', 'high', 'emergency'], default: 'normal' },
    notes: { type: String, trim: true },
    rescheduledFromId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: Date,
    arrivedAt: Date,
    completedAt: Date,
    // WhatsApp reminder dedup
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: Date,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

appointmentSchema.index({ clinicId: 1, appointmentNumber: 1 }, { unique: true });
appointmentSchema.index({ clinicId: 1, doctorId: 1, startAt: 1 });
appointmentSchema.index({ clinicId: 1, patientId: 1, startAt: -1 });
appointmentSchema.index({ clinicId: 1, status: 1, startAt: 1 });

appointmentSchema.pre('validate', function () {
  if (this.startAt && this.endAt && this.endAt <= this.startAt) {
    throw new Error('endAt must be after startAt.');
  }
});

module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
