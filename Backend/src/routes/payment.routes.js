const express = require('express');
const paymentController = require('../controllers/payment.controller');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// TODO: add authMiddleware here when auth / JWT is implemented

/** GET /api/payments/summary — must appear before /:id routes */
router.get('/summary', paymentController.getRevenueSummary);

/** GET /api/payments */
router.get('/', paymentController.getPayments);

/** POST /api/payments */
router.post(
  '/',
  validateRequest({
    patientId: { required: true, label: 'Patient' },
    amount: { required: true, type: 'number', label: 'Amount' },
    mode: { required: true, label: 'Payment mode' },
  }),
  paymentController.addPayment,
);

/** DELETE /api/payments/:id — soft-delete (Admin only) */
router.delete('/:id', paymentController.softDeletePayment);

module.exports = router;
