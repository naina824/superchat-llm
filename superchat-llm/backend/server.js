const path = require("path");
// Force dotenv to load the .env file from the current directory (backend/)
require("dotenv").config({ 
  path: path.resolve(__dirname, ".env") 
});
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");
const imageRoute = require("./routes/imageRoute");

// Mounting routes
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/image", imageRoute);

// Optional: Fix the 404 for the session check on app load
app.get("/protected", (req, res) => {
  res.status(200).json({ message: "Authenticated" });
});

app.get("/", (req, res) => {
  res.send("Backend Working");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});