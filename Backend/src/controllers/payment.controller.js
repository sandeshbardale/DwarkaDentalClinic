const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/payments
 */
const getPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getAllPayments();
  return new ApiResponse(200, payments, 'Payments fetched').send(res);
});

/**
 * POST /api/payments
 */
const addPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.addPayment(req.body);
  return new ApiResponse(201, { payment }, 'Payment recorded').send(res);
});

/**
 * DELETE /api/payments/:id — Admin only.
 * TODO: replace x-user-role check with authMiddleware once auth is implemented.
 */
const softDeletePayment = asyncHandler(async (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') throw ApiError.forbidden('Admin-only action.');
  await paymentService.softDeletePayment(req.params.id);
  return new ApiResponse(200, null, 'Payment record soft-deleted').send(res);
});

/**
 * GET /api/payments/summary
 */
const getRevenueSummary = asyncHandler(async (req, res) => {
  const summary = await paymentService.getRevenueSummary();
  return new ApiResponse(200, summary, 'Revenue summary').send(res);
});

module.exports = { getPayments, addPayment, softDeletePayment, getRevenueSummary };
