'use strict';

/* Note: using staging server url, remove .testing() for production
Using .testing() will overwrite the debug flag with true */
var LEX = require('letsencrypt-express').testing();

var lex = LEX.create({
  configDir: require('os').homedir() + '/letsencrypt/etc'
, approveRegistration: function (settings.baseUrl, cb) { // leave `null` to disable automatic registration
    // Note: this is the place to check your database to get the user associated with this domain
    cb(null, {
      domains: [settings.baseUrl]
    , email: settings.leEmail // user@example.com
    , agreeTos: true
    });
  }
});

var http = require('http');
var https = require('spdy');
var koa = require('koa');
var app = koa();
var settings = require('bin/settings.js');
app.use(reguire('koa-render')(settings.viewDir, { // templating
  html: 'underscore'
}));
var redirectHttps = koa().use(require('koa-force-ssl').callback();
app.use(require('koa-static')(settings.publicDir, {
    maxage: (30*24*60*60*1000),
    defer: true
}));
app.use(require('express-force-domain')(settings.baseUrl.slice(0, -1)));
app.use(require('serve-favicon')(settings.faviconFile));

var router = require('./bin/routes.js');
app
  .use(router.routes())
  .use(router.allowedMethods());

var server = https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app.callback()));
var redirectServer = http.createServer(LEX.createAcmeResponder(lex, redirectHttps)));

server.listen(443, function () {
 console.log('Listening at :' +  + this.address().port);
});

redirectServer.listen(80, function () {
  console.log('Redirecting insecure traffic from http://localhost:' + this.address().port + ' to https');
});
