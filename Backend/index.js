/**
 * server.js — Entry point.
 * Loads config, connects to MongoDB, then starts listening.
 * The Express app setup lives in src/app.js.
 */
const config = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const app = require('./src/app');

async function startServer() {
  // Atlas is optional for a local UI demo. Keep the API available when the
  // remote database cannot be reached and let individual routes report a
  // database error where needed.
  try {
    await connectDB();
    app.locals.databaseAvailable = true;
  } catch (error) {
    app.locals.databaseAvailable = false;
    console.warn(`[Server] Starting without MongoDB: ${error.message}`);
  }

  app.listen(config.PORT, () => {
    const dbStatus = app.locals.databaseAvailable ? 'MongoDB connected' : 'demo mode (no DB)';
    console.log(`[Server] Listening on port ${config.PORT} — ${dbStatus}`);
  });
}

startServer().catch((err) => console.error('[Server] Fatal startup error:', err.message));
