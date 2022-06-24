// GLOBAL APP ERROR HANDLING
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = this.statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
