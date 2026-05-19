const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const message = require("../models/message");

const router = express.Router();
const upload = multer(); // Middleware to parse multipart/form-data (FormData)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
}, { apiVersion: "v1" }); // Explicitly use v1 to fix the 404 error

router.post("/", upload.none(), async (req, res) => {
  try {
    const { message, userMessage, language } = req.body;

    // Optional: Use the language preference from the frontend to guide the AI
    const prompt = language ? `[System: Respond in ${language}] ${userMessage}` : userMessage;


    const result = await model.generateContent(prompt);

    const reply = result.response.text();
    const savedmessage = await message.create({
      userMessage: userMessage,
      aiResponse: reply,

    })
    console.log("Saved:", savedmessage);

    res.json({ reply });
  } catch (error) {
    console.log("Gemini Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;