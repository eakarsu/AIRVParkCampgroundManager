let rateLimit;
let ipKeyGenerator;
try {
  const mod = require('express-rate-limit');
  rateLimit = mod.rateLimit || mod.default || mod;
  ipKeyGenerator = mod.ipKeyGenerator || ((req) => req.ip);
} catch (_) {
  rateLimit = null;
  ipKeyGenerator = (req) => req.ip;
}

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
  keyGenerator: (req, res) => req.user ? `user_${req.user.id}` : ipKeyGenerator(req, res),
  message: { error: 'AI rate limit exceeded. Maximum 20 AI requests per hour.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { apiLimiter, aiRateLimiter };
