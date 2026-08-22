const express = require('express');
const multer = require('multer');
const path = require('path');
const aiController = require('../controllers/ai.controller');
const { UPLOAD_DIR } = require('../services/ai.service');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
// Note: authMiddleware applied in routes/index.js

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `xray-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowedExt = /jpeg|jpg|png/;
    const allowedMime = /image\/(jpeg|jpg|png)/;
    if (allowedExt.test(path.extname(file.originalname).toLowerCase()) && allowedMime.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, or PNG X-ray images are allowed.'));
  },
});

/** POST /api/ai/upload — doctors, admin & receptionists */
router.post('/upload', requireRole('doctor', 'admin', 'receptionist'), upload.single('xray'), aiController.uploadAndAnalyzeXray);

/** GET /api/ai/reports/:patientId */
router.get('/reports/:patientId', aiController.getAiReportsByPatient);

/** PATCH /api/ai/reports/:id/review — doctors only */
router.patch('/reports/:id/review', requireRole('doctor', 'admin'), aiController.reviewAiReport);

module.exports = router;
