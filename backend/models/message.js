const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  userMessage: {
    type: String,
    required: true,
  },

  aiResponse: {
    type: String,
    required: true,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "Message",
  messageSchema
);
