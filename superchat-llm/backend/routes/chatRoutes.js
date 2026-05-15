const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
const upload = multer(); // Middleware to parse multipart/form-data (FormData)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

router.post("/", upload.none(), async (req, res) => {
  try {
    const { message } = req.body;

    const result = await model.generateContent(message);

    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.log("Gemini Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;