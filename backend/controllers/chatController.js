const axios = require("axios");
const fs = require("fs");
const Message = require("../models/Message");

const chatWithModel = async (req, res) => {
  try {
    const { message, language } = req.body;
    const history = JSON.parse(req.body.history || "[]");
    const provider = req.body.provider || "llava";
  
    const file = req.file;
    const selectedLang = language || "English";

    console.log("Message:", message);

     const modelName =
      provider === "llama" ? "llama3.2:3b" : "llava";
      
    // Convert the structured history array into a plain text transcript
    const historyText = history
      .map((msg) => `${msg.role === "assistant" ? "Assistant" : "User"}: ${msg.content}`)
      .join("\n");

    let prompt = `You are a helpful AI assistant.
Respond only in ${selectedLang}.

Previous Conversation:
${historyText}

Current User Question:
${file ? `Context: User uploaded a file named ${file.originalname}. ` : ""}${message}

Assistant:`;

    let requestBody = {
      model: modelName,
      prompt: prompt,
      stream: false,
    };

    if (file) {
      const imageBase64 = fs.readFileSync(file.path, "base64");
      requestBody.images = [imageBase64];
    }

    const response = await axios.post(
      "http://127.0.0.1:11434/api/generate",
      requestBody
    );

    const aiReply = response.data.response;

    // Save to MongoDB
    if(process.env.MONGO_URI){
      await Message.create({
        userMessage: message,
        aiResponse: aiReply,
      });
    }
    

    res.json({
      reply: aiReply,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { chatWithModel };