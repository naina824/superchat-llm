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

    const modelName =
      provider === "llama" ? "llama3.2:3b" : "llava";

    const historyText = history
      .map(
        (msg) =>
          `${msg.role === "assistant" ? "Assistant" : "User"}: ${msg.content}`
      )
      .join("\n");

    let prompt = `You are a helpful AI assistant.
Respond only in ${selectedLang}.

Previous Conversation:
${historyText}

Current User Question:
${file ? `Context: User uploaded a file named ${file.originalname}. ` : ""}
${message}

Assistant:`;

    let requestBody = {
      model: modelName,
      prompt,
      stream: true,
    };

    if (file) {
      const imageBase64 = file.buffer.toString("base64");
      requestBody.images = [imageBase64];
      console.log("Image added to request");
    }

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    const response = await axios({
      method: "post",
      url: "http://127.0.0.1:11434/api/generate",
      data: requestBody,
      responseType: "stream",
    });

    let fullReply = "";

    response.data.on("data", (chunk) => {
      const lines = chunk.toString().split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const parsed = JSON.parse(line);

          if (parsed.response) {
            fullReply += parsed.response;
            res.write(parsed.response);
          }
        } catch (err) {
          console.error("Chunk parse error:", err);
        }
      }
    });

    response.data.on("end", async () => {
      try {
        await Message.create({
          userMessage: message,
          aiResponse: fullReply,
        });

        console.log("saved to MongoDB");
      } catch (dbError) {
        console.error("MongoDB save error:", dbError);
      }

      res.end();
    });

    response.data.on("error", (err) => {
      console.error("Stream error:", err);
      res.end();
    });

  } catch (error) {
    console.error("Chat controller error:", error);
    res.status(500).json({
      error: "Server error",
    });
  }
};

module.exports = { chatWithModel };