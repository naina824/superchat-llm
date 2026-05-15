const express = require("express");
const router = express.Router();
const axios = require("axios");

// Image Route using Ollama + Language Support
router.post("/generate-image", async (req, res) => {
  try {
    const { prompt, language } = req.body;

    // Default language
    const selectedLang = language || "English";

    // Validation
    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required"
      });
    }

    // Send request to Ollama
    const response = await axios.post(
      "http://localhost:11434/api/chat",
      {
        model: "llama3.2",
        messages: [
          {
            role: "system",
            content: `You are an AI image assistant. You must generate a detailed image description for the user's request. IMPORTANT: Your entire response MUST be in the ${selectedLang} language.`
          },
          {
            role: "user",
            content: `Generate an image description for: "${prompt}"`
          }
        ],
        stream: false
      }
    );

    const aiResponse = response.data.message.content;

    // Return response
    res.json({
      success: true,
      language: selectedLang,
      result: aiResponse
    });

  } catch (error) {
    console.error("Image Route Error:", error.message);

    res.status(500).json({
      success: false,
      error: "Image generation failed"
    });
  }
});

module.exports = router;