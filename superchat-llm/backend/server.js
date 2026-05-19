const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const connectDB = require("./config/db");

// Connect MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");
const imageRoute = require("./routes/imageRoute");

// API Routes
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", imageRoute);

// Test route
app.get("/", (req, res) => {
  res.send("Backend Working");
});

// Optional protected route
app.get("/protected", (req, res) => {
  res.status(200).json({
    message: "Authenticated",
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});