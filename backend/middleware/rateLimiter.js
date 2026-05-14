let rateLimit;
try { rateLimit = require('express-rate-limit'); } catch (_) { rateLimit = null; }

const makeNoop = () => (req, res, next) => next();

const createLimiter = (options) => {
  if (!rateLimit) return makeNoop();
  return rateLimit(options);
};

const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// AI: 20 req/hour per user ID or IP
const aiRateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? `user_${req.user.id}` : req.ip,
  message: { error: 'AI rate limit exceeded. Maximum 20 AI requests per hour.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { apiLimiter, aiRateLimiter };
