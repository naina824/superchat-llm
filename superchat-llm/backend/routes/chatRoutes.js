const express = require("express");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Message = require("../models/message");

const router = express.Router();
const upload = multer();

// Check API key
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in .env file");
}

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Correct model initialization
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

router.post("/", upload.none(), async (req, res) => {
  try {
    const { message, language, username } = req.body;

    // Validate input
    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    // Create prompt
    const prompt = language
      ? `Respond in ${language}: ${message}`
      : message;

    // Generate AI response
    const result = await model.generateContent(prompt);

    // Extract text safely
    const reply = result.response.text();

    // Save to MongoDB
    const savedMessage = await Message.create({
      username,
      userMessage: message,
      aiResponse: reply,
    });

    console.log("Saved:", savedMessage);

    // Send response
    res.json({
      reply,
    });

  } catch (error) {
    console.error("Detailed Backend Error:", error);

    res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
});

module.exports = router;