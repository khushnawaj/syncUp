/**
 * ApiError — standardized error class
 * Extends native Error so it works with async error handlers
 * statusCode makes it directly mappable to HTTP responses
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;    // Array of field-level validation errors
    this.isOperational = true; // Distinguishes known errors from unexpected crashes

    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common cases
  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
