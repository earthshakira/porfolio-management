const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const logger = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/user');
const tradesRouter = require('./routes/trades');
const portfolioRouter = require('./routes/portfolio');
const returnsRouter = require('./routes/returns');
const basicAuth = require('express-basic-auth')
const backend = require('./dal/backend');

backend.init()
const app = express();
const authMiddleware = basicAuth( {
  authorizer: backend.userAuthorizer,
  authorizeAsync: true,
} );

// view engine setup
app.use(cors({
  origin: '*',
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,PATCH",
}))

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/trade', authMiddleware,tradesRouter);
app.use('/portfolio',authMiddleware, portfolioRouter);
app.use('/returns', authMiddleware, returnsRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
