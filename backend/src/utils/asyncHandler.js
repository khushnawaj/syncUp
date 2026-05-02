/**
 * asyncHandler — wraps async route handlers to eliminate try/catch boilerplate
 * Catches rejected promises and forwards to Express error middleware via next()
 *
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
