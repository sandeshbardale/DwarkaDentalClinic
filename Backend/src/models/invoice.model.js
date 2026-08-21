const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    treatmentCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'TreatmentCategory' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }, // Amounts are stored in paise.
    discount: { type: Number, min: 0, default: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    invoiceNumber: { type: String, required: true, trim: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    treatmentPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'TreatmentPlan' },
    items: { type: [invoiceItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 }, // Amounts are stored in paise.
    discount: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, min: 0, default: 0 },
    balanceDue: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['draft', 'issued', 'partially_paid', 'paid', 'cancelled'], default: 'draft' },
    issuedAt: Date,
    dueAt: Date,
  },
  { timestamps: true },
);

invoiceSchema.index({ clinicId: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
