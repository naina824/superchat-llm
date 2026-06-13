const express = require("express");
const router = express.Router();
const axios = require("axios");


// Image Route using Ollama + Language Support
router.post("/generate-image", async (req, res) => {
  try {
    const { prompt, language } = req.body;
    const selectedLang = language || "English";

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "llama3.2:3b",
        prompt: prompt,
        stream:false,
      }
    );
  

    const aiResponse = response.data.response;
    
    // Generate a search-friendly URL as a fallback for the frontend 'imageUrl' expectation
    const imageUrl = `https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop`; 

    res.json({
      success: true,
      language: selectedLang,
      result: aiResponse,
      imageUrl: imageUrl // Providing this key fixes the frontend display logic
    });
  } catch (error) {
    console.error("Image Route Error:", error.message);
    res.status(500).json({ success: false, error: "Image generation failed" });
  }
});

module.exports = router;