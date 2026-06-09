const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);

    // Do NOT stop server
    console.log("⚠️ Backend will continue without MongoDB");
  }
};

module.exports = connectDB;