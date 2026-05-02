const ApiError = require('../utils/ApiError');

/**
 * Global error handler — must be the LAST middleware registered in Express
 * Express identifies it as error middleware because it has 4 arguments (err, req, res, next)
 *
 * Handles:
 *  - ApiError (operational errors with known status codes)
 *  - Prisma errors (unique constraint, not found)
 *  - JWT errors (already handled in auth middleware, but safety net here)
 *  - Unknown errors (500, message hidden in production)
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Prisma: Unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    error = ApiError.conflict(`${field} already exists`);
  }

  // Prisma: Record not found
  if (err.code === 'P2025') {
    error = ApiError.notFound('Record not found');
  }

  // Prisma: Foreign key constraint
  if (err.code === 'P2003') {
    error = ApiError.badRequest('Related record does not exist');
  }

  // If not an operational ApiError, treat as 500
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : error.message;
    error = new ApiError(statusCode, message);
  }

  // Log non-operational errors (bugs, crashes)
  if (!error.isOperational) {
    console.error('💥 NON-OPERATIONAL ERROR:', err);
  }

  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
