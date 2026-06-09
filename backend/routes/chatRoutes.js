const express = require("express");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Message = require("../models/message");
const axios = require("axios");

const router = express.Router();
const upload = multer();

// Check API key
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in .env file");
}

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("Gemini Key:", process.env.GEMINI_API_KEY ? "Loaded" : "Missing");

// Correct model initialization
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

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
      let reply;
      //if(modelType === "ollama"){
      if(true){
        const currentMessage = { role: "user", content: prompt };
        
        const ollamaResponse = await axios.post("http://localhost:11434/api/chat", {
          model: "llama3.2:3b",
          messages: [...previousMessages, currentMessage],
          stream: false
        });
        reply = ollamaResponse.data.message.content;
      }else {

        // Convert history format for Gemini (roles must be "user" or "model")
        const geminiHistory = previousMessages.map(msg => ({
          role: msg.role === "assistant" ? "model" : msg.role,
          parts: [{ text: msg.content }]
        }));
        
        const chat = model.startChat({
          history: geminiHistory
        });

        const result = await chat.sendMessage(prompt);
        reply = result.response.text();
    }
    // Save to MongoDB
    //const savedMessage = await Message.create({
      //username,
      //userMessage: message,
      //aiResponse: reply,
    //});

    //console.log("Saved:", savedMessage);

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