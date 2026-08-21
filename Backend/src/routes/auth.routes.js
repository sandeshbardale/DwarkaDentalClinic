const express = require('express');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// TODO: add authMiddleware here when auth / JWT is implemented
router.post(
  '/login',
  validateRequest({ email: { required: true, label: 'Email' }, password: { required: true, label: 'Password' } }),
  authController.login,
);

module.exports = router;
