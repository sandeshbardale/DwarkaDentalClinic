const mongoose = require("mongoose");
const models = require("./models");

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured. Add it to Backend/.env.");
  }

  let timeoutId;
  try {
    const pendingConnection = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
    });
    const connectionTimeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("MongoDB connection timed out after 12 seconds. Check your DNS, network, and Atlas IP Access List."));
      }, 12_000);
    });
    const connection = await Promise.race([pendingConnection, connectionTimeout]);
    clearTimeout(timeoutId);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    clearTimeout(timeoutId);
    mongoose.disconnect().catch(() => undefined);
    console.error("Database connection failed:", error.message);
    throw error;
  }
}

module.exports = { connectDB, mongoose, ...models };
