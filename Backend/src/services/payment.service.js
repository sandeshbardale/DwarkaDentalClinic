const Payment = require('../models/payment.model');
const Invoice = require('../models/invoice.model');
const Patient = require('../models/patient.model');
const Clinic = require('../models/clinic.model');
const ApiError = require('../utils/ApiError');

async function getDefaultClinic() {
  let clinic = await Clinic.findOne({});
  if (!clinic) {
    clinic = await Clinic.create({
      name: 'Dwarka Dental Clinic',
      email: 'info@dwarkadental.com',
      phone: '+91 98765 00000',
      address: { street: 'Sector 12', city: 'Dwarka, New Delhi', state: 'Delhi', zipCode: '110075' }
    });
  }
  return clinic;
}

/** Fetch all non-deleted payments with filter/sort/pagination */
async function getAllPayments(query = {}) {
  const { status, patientId: qPatient, doctorId, dateFrom, dateTo, sortBy = 'paidAt', sortOrder = 'desc', page = 1, limit = 50 } = query;

  const filter = { isDeleted: false };
  const mongoose = require('mongoose');
  if (qPatient && mongoose.Types.ObjectId.isValid(qPatient)) filter.patientId = new mongoose.Types.ObjectId(qPatient);
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.paidAt = {};
    if (dateFrom) filter.paidAt.$gte = new Date(dateFrom);
    if (dateTo) filter.paidAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59));
  }

  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const pageNum = Math.max(1, parseInt(page));
  const pageLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * pageLimit;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('patientId', 'name patientNumber')
      .sort({ [sortBy === 'amount' ? 'amount' : 'paidAt']: sortDir })
      .skip(skip)
      .limit(pageLimit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return {
    data: payments.map((p) => toFrontendShape(p, p.patientId?.name || '')),
    pagination: { page: pageNum, limit: pageLimit, total, totalPages: Math.ceil(total / pageLimit) },
  };
}

/**
 * Get payments for a specific patient with outstanding calculation.
 */
async function getPaymentsByPatient(patientId) {
  const payments = await Payment.find({ patientId, isDeleted: false })
    .sort({ paidAt: -1 })
    .lean();

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

  return {
    payments: payments.map((p) => toFrontendShape(p)),
    totalPaid,
  };
}

/** Record a new payment */
async function addPayment(body, requestingUser) {
  const clinic = await getDefaultClinic();
  const { patientId, appointmentId, amount, mode, notes, date } = body;

  const patient = await Patient.findById(patientId);
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');

  const count = await Payment.countDocuments({ clinicId: clinic._id });
  const receiptNumber = `RCPT-2026-${String(count + 1).padStart(4, '0')}`;

  const invoiceCount = await Invoice.countDocuments({ clinicId: clinic._id });
  const invoiceNumber = `INV-2026-${String(invoiceCount + 1).padStart(4, '0')}`;
  const amountPaise = Math.round(parseFloat(amount) * 100);

  const invoice = await Invoice.create({
    clinicId: clinic._id,
    invoiceNumber,
    patientId: patient._id,
    ...(appointmentId ? { appointmentId } : {}),
    items: [{ description: notes || 'Payment', quantity: 1, unitPrice: amountPaise, discount: 0, amount: amountPaise }],
    subtotal: amountPaise,
    discount: 0,
    tax: 0,
    total: amountPaise,
    amountPaid: amountPaise,
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
    amount: amountPaise,
    method: mode.toLowerCase(),
    status: 'paid',
    notes: notes || '',
    paidAt: date ? new Date(date) : new Date(),
    recordedById: requestingUser ? requestingUser.id : clinic._id,
  });

  return toFrontendShape(payment.toObject(), patient.name);
}

/** Soft-delete a payment (Admin only) */
async function softDeletePayment(id) {
  const payment = await Payment.findById(id);
  if (!payment || payment.isDeleted) throw ApiError.notFound('Payment record not found.');
  payment.isDeleted = true;
  await payment.save();
}

/** Revenue summary */
async function getRevenueSummary() {
  const clinic = await getDefaultClinic();
  const result = await Payment.aggregate([
    { $match: { clinicId: clinic._id, isDeleted: false } },
    { $group: { _id: '$method', value: { $sum: '$amount' } } },
  ]);
  const totalPaise = result.reduce((sum, r) => sum + r.value, 0);
  return {
    totalPaid: totalPaise / 100,
    byMode: result.map((r) => ({ mode: r._id, value: r.value / 100 })),
  };
}

function toFrontendShape(p, patientName = '') {
  const name = patientName || (p.patientId && typeof p.patientId === 'object' ? p.patientId.name : '');
  return {
    id: p._id.toString(),
    patientId: p.patientId ? (typeof p.patientId === 'object' ? p.patientId._id.toString() : p.patientId.toString()) : null,
    patientName: name,
    appointmentId: p.appointmentId ? p.appointmentId.toString() : null,
    amount: (p.amount || 0) / 100,
    mode: p.method,
    notes: p.notes || '',
    date: p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : null,
    status: p.status,
    receiptNumber: p.receiptNumber,
    isDeleted: p.isDeleted,
  };
}

module.exports = { getAllPayments, getPaymentsByPatient, addPayment, softDeletePayment, getRevenueSummary };
