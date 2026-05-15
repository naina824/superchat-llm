const axios = require("axios");
const fs = require("fs");
const Message = require("../models/Message");

const chatWithModel = async (req, res) => {
  try {
    const { message, language } = req.body;
    const file = req.file;
    const selectedLang = language || "English";

    console.log("Message:", message);

    // Enforce the selected language using structured prompt tags
    let prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a helpful AI assistant. You MUST respond ONLY in the ${selectedLang} language.<|eot_id|><|start_header_id|>user<|end_header_id|>

${file ? `Context: User uploaded a file named ${file.originalname}. ` : ""}Question: ${message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;

    let requestBody = {
      model: "llava",
      prompt,
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
    await Message.create({
      message,
      response: aiReply,
    });

    res.json({
      reply: aiReply,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { chatWithModel };