"use strict";

/* Note: using staging server url, remove .testing() for production
 Using .testing() will overwrite the debug flag with true */
const LEX = require('letsencrypt-express').testing();
const settings = require('./bin/settings');

const lex = LEX.create({
    configDir: settings.leDir,
    fullchainTpl: '/live/:hostname/fullchain.pem',
    privkeyTpl: '/live/:hostname/fullchain.pem',
    approveRegistration: function (hostname, cb) { // leave `null` to disable automatic registration
    // Note: this is the place to check your database to get the user associated with this domain

        console.log(hostname);

    cb(null, {
        domains: [settings.baseUrl],
        email: settings.leEmail,
        agreeTos: true
    });
}
});

const http = require('http');
const https = require('spdy');
const koa = require('koa');
const app = koa();
app.use(require('koa-render')(settings.viewDir, { // templating
    html: 'underscore'
}));
const redirectHttps = koa().use(require('koa-force-ssl')()).callback();
app.use(require('koa-static')(settings.publicDir, {
    maxage: (30*24*60*60*1000),
    defer: true
}));

const router = require('./bin/routes.js');
app
    .use(router.routes())
    .use(router.allowedMethods());


const server = https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app.callback()));
const redirectServer = http.createServer(LEX.createAcmeResponder(lex, redirectHttps));

server.listen(443, function () {
    console.log('Listening at :' +  + this.address().port);
});

redirectServer.listen(80, function () {
    console.log('Redirecting insecure traffic from http://' + settings.hostname + ':' + this.address().port + ' to https');
});
