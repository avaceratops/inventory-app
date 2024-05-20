const compression = require('compression');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const express = require('express');
const helmet = require('helmet');
const logger = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const RateLimit = require('express-rate-limit');
require('dotenv').config();

const indexRouter = require('./routes/index');

const app = express();
app.set('trust proxy', 1); // needed for Railway hosting

// set up mongoose connection
// mongoose.set('strictQuery', false);
// const mongoDB = process.env.MONGODB_URI;

// main().catch((err) => debug(err));
// async function main() {
//   await mongoose.connect(mongoDB);
// }

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// set CSP headers to allow our Bootstrap and Jquery to be served
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      'script-src': ["'self'", 'code.jquery.com', 'cdn.jsdelivr.net'],
    },
  })
);

// set up rate limiter to reduce bandwidth consumption, maximum of sixty requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: (req) => req.headers['x-envoy-external-address'] || req.ip, // needed for Railway hosting
});
app.use(limiter);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, _next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { title: 'Error' });
});

module.exports = app;
