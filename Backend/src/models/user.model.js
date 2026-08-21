const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'doctor', 'receptionist'], required: true, default: 'receptionist' },
    phone: { type: String, trim: true },
    specialization: { type: String, trim: true },
    qualifications: [{ type: String, trim: true }],
    experienceYears: { type: Number, min: 0 },
    salary: { type: Number, min: 0, select: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

userSchema.index({ clinicId: 1, email: 1 }, { unique: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
