const express = require('express');
const axios = require('axios');
const multer = require('multer');
const Message = require('../models/message'); // Match actual filename casing

const router = express.Router();
const upload = multer(); // Middleware to parse multipart/form-data (FormData)

const SYSTEM_PROMPT = "You are SuperChat AI, a helpful assistant.";

// POST route for chat interaction with Ollama
router.post("/", upload.none(), async (req, res) => {
  // Extract message and username from req.body
  const { message, username, model = "llama3.2:3b" } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Fetch last 5 interactions for this user from MongoDB to provide context
    const lastMessages = await Message.find({ username: username || 'Anonymous' })
      .sort({ timestamp: -1 })
      .limit(5);

    // Format history: oldest first, alternating between user and assistant
    const history = lastMessages.reverse().flatMap(m => [
      { role: "user", content: m.userMessage },
      { role: "assistant", content: m.aiResponse }
    ]);

    // Call Ollama Chat API with full message history
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: message }
      ],
      stream: false,
    });

    const aiResponse = response.data.message.content;

    // Save the conversation to MongoDB
    const newMessage = new Message({
      username: username || 'Anonymous',
      userMessage: message,
      aiResponse: aiResponse,
    });
    await newMessage.save();

    // Return the response using the 'reply' key as requested
    res.json({
      reply: aiResponse,
      messageId: newMessage._id, // Optionally return the saved message ID
    });
  } catch (error) {
    console.error('Error interacting with Ollama or saving message:', error);
    if (error.response) {
      // Ollama API returned an error
      return res.status(error.response.status).json({ error: error.response.data });
    }
    res.status(500).json({ error: 'Failed to get response from Ollama or save message.' });
  }
});

module.exports = router;