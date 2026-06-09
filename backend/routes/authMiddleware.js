const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    // Check if header exists
    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // Extract token
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    // Check token
    if (!token) {
      return res.status(401).json({
        message: "Invalid token format",
      });
    }

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET is missing in environment variables"
      );
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Save user data in request
    req.user = decoded;

    next();

  } catch (error) {
    console.error("JWT Error:", error.message);

    return res.status(401).json({
      message: "Unauthorized access",
    });
  }
};

module.exports = authMiddleware;