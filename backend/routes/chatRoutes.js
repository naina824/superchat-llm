const express = require("express");
const multer = require("multer");
const Message = require("../models/message");
const axios = require("axios");

const router = express.Router();
const upload = multer();

router.post("/", upload.none(), async (req, res) => {
  try {
    const { message, language, username, modelType, history } = req.body;

    // Validate input
    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    // Parse previous conversation history sent from frontend
    let previousMessages = [];
    if (history) {
      try {
        previousMessages = JSON.parse(history);
      } catch (err) {
        console.error("Error parsing history:", err);
      }
    }

    // Create prompt
    const prompt = language
      ? `Respond in ${language}: ${message}`
      : message;

    const currentMessage = { role: "user", content: prompt };
    const ollamaResponse = await axios.post("http://localhost:11434/api/chat", {
      model: "llama3.2:3b",
      messages: [...previousMessages, currentMessage],
      stream: false
    });
    const reply = ollamaResponse.data.message.content;

    

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