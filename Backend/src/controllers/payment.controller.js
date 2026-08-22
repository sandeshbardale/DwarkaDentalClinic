const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');

/** GET /api/payments — with filter/sort/pagination */
const getPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.getAllPayments(req.query);
  return new ApiResponse(200, result, 'Payments fetched').send(res);
});

/** GET /api/payments/patient/:patientId */
const getByPatient = asyncHandler(async (req, res) => {
  const result = await paymentService.getPaymentsByPatient(req.params.patientId);
  return new ApiResponse(200, result, 'Patient payments fetched').send(res);
});

/** POST /api/payments */
const addPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.addPayment(req.body, req.user);
  return new ApiResponse(201, { payment }, 'Payment recorded').send(res);
});

/** DELETE /api/payments/:id — Admin only */
const softDeletePayment = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw ApiError.forbidden('Admin-only action.');
  await paymentService.softDeletePayment(req.params.id);
  return new ApiResponse(200, null, 'Payment record voided').send(res);
});

/** GET /api/payments/summary */
const getRevenueSummary = asyncHandler(async (req, res) => {
  const summary = await paymentService.getRevenueSummary();
  return new ApiResponse(200, summary, 'Revenue summary').send(res);
});

module.exports = { getPayments, getByPatient, addPayment, softDeletePayment, getRevenueSummary };
