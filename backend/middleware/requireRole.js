/**
 * Middleware factory: requireRole('admin') or requireRole('admin', 'manager')
 * Must be used AFTER auth middleware (req.user must be set)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
  }
  next();
};

module.exports = requireRole;
