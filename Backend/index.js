/**
 * Server entry point.
 * Loads config → connects to MongoDB → seeds database → starts listening.
 */
const config = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const { seedDatabase } = require('./src/config/seed');
const app = require('./src/app');

async function startServer() {
  try {
    await connectDB();
    app.locals.databaseAvailable = true;
    // Seed default clinic, users (bcrypt), and treatment categories
    await seedDatabase();
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
