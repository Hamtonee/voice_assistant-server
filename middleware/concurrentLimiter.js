let activeUsers = 0;
const MAX_CONCURRENT_USERS = 50;

/**
 * Middleware to limit the number of concurrent users accessing the server.
 * Returns 429 if the number exceeds MAX_CONCURRENT_USERS.
 */
export default function concurrentLimiter(req, res, next) {
  // If limit exceeded, block the request
  if (activeUsers >= MAX_CONCURRENT_USERS) {
    return res.status(429).json({
      error: "🚦 Server is busy. Please try again shortly.",
    });
  }

  // Increment active user count
  activeUsers++;

  // Decrement when request is finished
  res.on('finish', () => {
    activeUsers = Math.max(0, activeUsers - 1);
  });

  next();
}
