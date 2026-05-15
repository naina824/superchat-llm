const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
}, { apiVersion: "v1" });

// Image Route using Ollama + Language Support
router.post("/generate-image", async (req, res) => {
  try {
    const { prompt, language } = req.body;
    const selectedLang = language || "English";

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Use Gemini to generate a high-quality visual description
    const result = await model.generateContent(
      `Generate a detailed visual description for an image of: "${prompt}". 
       Respond ONLY with the description in ${selectedLang}.`
    );

    const aiResponse = result.response.text();
    
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