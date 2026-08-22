const express = require('express');
const paymentController = require('../controllers/payment.controller');
const validateRequest = require('../middleware/validateRequest');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
// Note: authMiddleware applied in routes/index.js

router.get('/summary', paymentController.getRevenueSummary);
router.get('/patient/:patientId', paymentController.getByPatient);
router.get('/', paymentController.getPayments);
router.post(
  '/',
  validateRequest({
    patientId: { required: true, label: 'Patient' },
    amount: { required: true, type: 'number', label: 'Amount' },
    mode: { required: true, label: 'Payment mode' },
  }),
  paymentController.addPayment,
);
router.delete('/:id', requireRole('admin'), paymentController.softDeletePayment);

module.exports = router;
