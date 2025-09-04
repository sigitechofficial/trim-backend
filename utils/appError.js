class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = 200;
    this.status = `${statusCode}`.startsWith('4') ? '0' : '0';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
