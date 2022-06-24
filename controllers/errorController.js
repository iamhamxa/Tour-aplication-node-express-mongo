const AppError = require('./../utility/appErrors');

// SEND ERRORS IN DEVELOPMENT TO CLIENT
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something Went Wrong',
      msg: err.message,
    });
  }
};

// SEND ERROR IN PRODUCTION TO THE CLIENT
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      // Programming or other unknown error: don't leak error details
    } else {
      // 1) Log error
      console.error('ERROR 💥', err);

      // 2) Send generic message
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something Went Wrong',
      msg: err.message,
    });
  }
};

// ERROR HANDLER CONTROLLER
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// HANDLE DUPLICATE ERRORS
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// HANDLE DATABASE ERRORS
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// HANDLE JSON WEB TOKEN ERRORS
const jwtTokenHandler = () =>
  new AppError('Invalid JSON TOKEN PLEASED LOGIN AGAIN', 401);

module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    // else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError') error = jwtTokenHandler(error);

    sendErrorProd(error, req, res);
  }
};
