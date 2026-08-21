const mongoose = require('mongoose');

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.models.DoctorAvailability || mongoose.model('DoctorAvailability', doctorAvailabilitySchema);
