import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function ResetPassword({ currentTheme }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Extract token from URL path: /reset-password/:token
  const token = window.location.pathname.replace(/\/$/, "").split("/").pop();

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      });
      setMessage(res.data.message);
      // Automatically redirect to login/home after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may be invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 style={{ color: currentTheme?.accent || "#D2B48C" }}>New Password</h1>
        <p>Please enter and confirm your new password below.</p>

        {message && <p style={{ color: "green", fontWeight: "bold", marginBottom: "20px" }}>{message}</p>}
        {error && <p style={{ color: "#ff4d4d", fontSize: "0.85rem", marginBottom: "20px" }}>{error}</p>}

        {!message && (
          <form onSubmit={handleResetSubmit}>
            <div className="password-input-wrapper" style={{ position: "relative", width: "100%" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", paddingRight: "45px" }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: "1.2rem", userSelect: "none" }}
              >
                {showPassword ? "👁️" : "🙈"}
              </span>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit" style={{ backgroundColor: currentTheme?.accent || "#D2B48C" }} disabled={isLoading}>
              {isLoading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}
        <div className="auth-toggle">
          <button onClick={() => window.location.href = "/"} className="auth-toggle-btn">Back to Login</button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;