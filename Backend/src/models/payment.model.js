const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    receiptNumber: { type: String, required: true, trim: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    amount: { type: Number, required: true, min: 1 }, // Amount is stored in paise.
    method: { type: String, enum: ['cash', 'upi', 'card', 'bank_transfer'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    transactionReference: { type: String, trim: true },
    paidAt: Date,
    notes: { type: String, trim: true },
    recordedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

paymentSchema.index({ clinicId: 1, receiptNumber: 1 }, { unique: true });
paymentSchema.index({ clinicId: 1, invoiceId: 1, paidAt: -1 });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
