var express = require('express');
var fs = require('fs');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var consolidate = require('consolidate');
var forceDomain = require('express-force-domain');
var compression = require('compression');
var vars = require('./bin/vars');

var methods = require('./bin/methods');
var routes = require('./routes/index');

var app = express();


// view engine setup
app.engine('html', consolidate.underscore);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/img/LNB.png'));
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(forceDomain(vars.homeurl.slice(0, -1)));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.log(err);
  res.render('error', {
    vars: vars,
    title: vars.title,
    message: err.message,
    error: err
  });
});


module.exports = app;
