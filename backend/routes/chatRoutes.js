const express = require("express");
const multer = require("multer");
const Message = require("../models/message");
const axios = require("axios");

const router = express.Router();
const upload = multer();

router.post("/", upload.single("image"),  async (req, res) => {
  console.log("File received:", req.file);
  console.log("Filename:",req.file?.originalname);
  console.log("Mimetype:",req.file?.mimetype);
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
    let chatData = {
      model: "llava",
      messages: [...previousMessages, currentMessage],
      stream: true
    };

    if(req.file) {
      const imageBase64 = req.file.buffer.toString("base64");
      chatData.messages = [...previousMessages,
        {
          role: "user",
          content: prompt,
          images: [imageBase64]
        }
      ];
      console.log("Image added for Llava");
    }

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");
    
    const ollamaResponse = await axios.post(
  "http://localhost:11434/api/chat",
  chatData,
  {
    responseType: "stream"
  }
);

let fullReply = "";

ollamaResponse.data.on("data", (chunk) => {
  const lines = chunk.toString().split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const parsed = JSON.parse(line);

      if (parsed.message?.content) {
        const content = parsed.message.content;

        fullReply += content;

        res.write(content); // send chunk to frontend
      }
    } catch (err) {
      console.error("Chunk parse error:", err);
    }
  }
});

ollamaResponse.data.on("end", async () => {
  await Message.create({
    userMessage: message,
    aiResponse: fullReply,
  });

  console.log("saved to MongoDB");

  res.end();
});

  } catch (error) {
    console.error("Detailed Backend Error:", error);

    res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
});

module.exports = router;