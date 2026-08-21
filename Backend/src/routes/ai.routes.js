const express = require('express');
const multer = require('multer');
const path = require('path');
const aiController = require('../controllers/ai.controller');
const { UPLOAD_DIR } = require('../services/ai.service');

const router = express.Router();

// ─── Multer file upload configuration ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `xray-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, or PNG X-ray images are allowed.'));
  },
});

// TODO: add authMiddleware here when auth / JWT is implemented

/** POST /api/ai/upload */
router.post('/upload', upload.single('xray'), aiController.uploadAndAnalyzeXray);

/** GET /api/ai/reports/:patientId */
router.get('/reports/:patientId', aiController.getAiReportsByPatient);

module.exports = router;
