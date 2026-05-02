const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/db');

/**
 * authenticate — verifies JWT from Authorization header
 * Attaches full user object to req.user
 * Fails fast with 401 for any invalid/expired/missing token
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Access token is required');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token has expired');
    }
    throw ApiError.unauthorized('Invalid token');
  }

  // Fetch user to ensure they still exist (account not deleted after token issued)
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, name: true, role: true, resumeUrl: true },
  });

  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  req.user = user;
  next();
});

/**
 * authorize — role-based access control
 * Usage: authorize('EMPLOYER') or authorize('EMPLOYER', 'ADMIN')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden(`Role '${req.user.role}' is not permitted for this action`);
  }
  next();
};

module.exports = { authenticate, authorize };
