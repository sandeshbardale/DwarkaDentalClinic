const mongoose = require('mongoose');

const treatmentCategorySchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    defaultDurationMinutes: { type: Number, min: 1 },
    defaultFollowUpDays: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

treatmentCategorySchema.index({ clinicId: 1, code: 1 }, { unique: true });

module.exports = mongoose.models.TreatmentCategory || mongoose.model('TreatmentCategory', treatmentCategorySchema);
