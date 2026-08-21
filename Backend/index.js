const dns = require("node:dns");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { connectDB } = require("./src/database");
const apiRouter = require("./src/router/apiRouter");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// app.use(cors({
//   origin: "http://localhost:5173",
//   credentials: true,
// })
// );

app.use(cors());
app.use(express.json());
app.get("/", (_req, res) => {
  res.json({ message: "Smart e-Dental Care API is running." });
});
app.use("/api", apiRouter);

async function startServer() {
  // Atlas is optional for a local UI demo. Keep the API available when the
  // remote database cannot be reached, and let individual routes report a
  // database error where required.
  try {
    await connectDB();
    app.locals.databaseAvailable = true;
  } catch (error) {
    app.locals.databaseAvailable = false;
    console.warn(`Starting without MongoDB: ${error.message}`);
  }

  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT} (${app.locals.databaseAvailable ? "MongoDB connected" : "demo mode"})`);
  });
}

startServer().catch((error) => console.error("Unable to start the server:", error.message));
