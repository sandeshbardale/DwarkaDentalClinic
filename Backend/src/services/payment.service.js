const Payment = require('../models/payment.model');
const Invoice = require('../models/invoice.model');
const Patient = require('../models/patient.model');
const Clinic = require('../models/clinic.model');
const ApiError = require('../utils/ApiError');

async function getDefaultClinic() {
  const clinic = await Clinic.findOne({});
  if (!clinic) throw ApiError.internal('Clinic not found.');
  return clinic;
}

/**
 * Fetch all non-deleted payments, returning amounts in rupees.
 * Schema stores amounts in paise (× 100); we divide on the way out.
 */
async function getAllPayments() {
  const payments = await Payment.find({ isDeleted: false })
    .sort({ paidAt: -1 })
    .lean();
  return payments.map(toFrontendShape);
}

/**
 * Record a new payment.
 * @param {object} body  { patientId, appointmentId, amount (rupees), mode, notes, date }
 */
async function addPayment(body) {
  const clinic = await getDefaultClinic();
  const { patientId, appointmentId, amount, mode, notes, date } = body;

  const patient = await Patient.findById(patientId);
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');

  // Generate receipt number
  const count = await Payment.countDocuments({ clinicId: clinic._id });
  const receiptNumber = `RCPT-2026-${String(count + 1).padStart(4, '0')}`;

  // Create a stub invoice so the required invoiceId FK is satisfied.
  // A full invoice flow can replace this when billing is expanded.
  const invoiceCount = await Invoice.countDocuments({ clinicId: clinic._id });
  const invoiceNumber = `INV-2026-${String(invoiceCount + 1).padStart(4, '0')}`;
  const invoice = await Invoice.create({
    clinicId: clinic._id,
    invoiceNumber,
    patientId: patient._id,
    ...(appointmentId ? { appointmentId } : {}),
    items: [{ description: notes || 'Payment', quantity: 1, unitPrice: Math.round(parseFloat(amount) * 100), discount: 0, amount: Math.round(parseFloat(amount) * 100) }],
    subtotal: Math.round(parseFloat(amount) * 100),
    discount: 0,
    tax: 0,
    total: Math.round(parseFloat(amount) * 100),
    amountPaid: Math.round(parseFloat(amount) * 100),
    balanceDue: 0,
    status: 'paid',
    issuedAt: new Date(),
    dueAt: new Date(),
  });

  const payment = await Payment.create({
    clinicId: clinic._id,
    receiptNumber,
    invoiceId: invoice._id,
    patientId: patient._id,
    amount: Math.round(parseFloat(amount) * 100), // Store in paise
    method: mode.toLowerCase(),
    status: 'paid',
    notes: notes || '',
    paidAt: date ? new Date(date) : new Date(),
    recordedById: clinic._id, // Stub until auth provides userId
  });

  return toFrontendShape(payment.toObject(), patient.name);
}

/**
 * Soft-delete a payment (Admin only).
 */
async function softDeletePayment(id) {
  const payment = await Payment.findById(id);
  if (!payment || payment.isDeleted) throw ApiError.notFound('Payment record not found.');
  payment.isDeleted = true;
  await payment.save();
}

/**
 * Revenue summary: total paid and breakdown by payment method.
 * Returns amounts in rupees.
 */
async function getRevenueSummary() {
  const clinic = await getDefaultClinic();

  const result = await Payment.aggregate([
    { $match: { clinicId: clinic._id, isDeleted: false } },
    {
      $group: {
        _id: '$method',
        value: { $sum: '$amount' },
      },
    },
  ]);

  const totalPaisee = result.reduce((sum, r) => sum + r.value, 0);

  return {
    totalPaid: totalPaisee / 100,
    byMode: result.map((r) => ({
      mode: r._id,
      value: r.value / 100,
    })),
  };
}

// ─── Shape helper ─────────────────────────────────────────────────────────────

function toFrontendShape(p, patientName = '') {
  return {
    id: p._id.toString(),
    patientId: p.patientId.toString(),
    patientName,
    appointmentId: p.appointmentId ? p.appointmentId.toString() : null,
    amount: (p.amount || 0) / 100, // paise → rupees
    mode: p.method,
    notes: p.notes || '',
    date: p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : null,
    status: p.status,
    isDeleted: p.isDeleted,
  };
}

module.exports = {
  getAllPayments,
  addPayment,
  softDeletePayment,
  getRevenueSummary,
};
