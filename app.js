// IMPORTING PACKAGES
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
// IMPORTING OUR MODULES
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const viewsRoutes = require('./routes/viewsRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utility/appErrors');

const app = express();

// INCLUDING PUG VIEWS ENGINE
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, './views'));

// GLOBAL MIDDLEWARES
// SERVE STATIC ROUTES
app.use(express.static(path.join(__dirname, 'public')));

// SET SECURITY HTTP HEADERS
app.use(helmet());

// STORE COOKIES
app.use(cookieParser());

// DEVELOPMENT LOGING
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  app.use((req, res, next) => {
    // console.log(req.cookies);
    next();
  });
}

// LIMIT REQUESTS FROM THE SAME API
const limiter = rateLimit({
  max: 3000,
  windowMs: 60 * 60 * 1000,
  message:
    'Too many request from this api, Your access in blocked pleas try again later',
});
app.use('/api', limiter);
app.use('/', limiter);

// BODY PARSER,READING DATA FROM THE BODY TO req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// DATA SANITIZATION AGAINST NoSQL QUERY INJECTION
app.use(mongoSanitize());

// DATA SANITIZATION AGAINST XSS
app.use(xss());

// PARAMETERS POLUTION
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'mazGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES HANDLER
app.use('/', viewsRoutes);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Handling 404 error undefined routes
// app.use('*', (req, res, next) => {
//   next(new AppError(`Can't get this ${req.originalUrl} on this server`, 404));
// });

// GLobal error handling
app.use(globalErrorHandler);

// EXPORT MODULES TO THE PUBLIC
module.exports = app;
