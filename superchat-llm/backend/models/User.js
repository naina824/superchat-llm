const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

// Middleware to hash password before saving
userSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return;
  }
  
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
  
});

module.exports = mongoose.model("User", userSchema);