const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRouter = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded X-ray images as static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'Smart e-Dental Care API is running.', version: '2.0' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── Error handling (must be last) ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
