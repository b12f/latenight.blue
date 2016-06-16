'use strict';

const settings = require('./bin/settings');
const koa = require('koa');
const app = koa();
const router = require('./bin/routes.js');
const theme = new require('./bin/themes')(settings.theme);

// Register the templating engine
app.use(require('koa-render')(theme._viewDir, {
	map: theme._settings.engineMap
}));

// Set the static serving public dir
app.use(require('koa-static')(theme._publicDir, {
    maxage: (30*24*60*60*1000),
    defer: false
}));

// Logging
app.use(function *onRequest(next) {
    let t = +(new Date());
    yield next;
    console.log(this.request.method, this.request.url, (+(new Date() - t)));
});

// Global request error catcher
app.use(function *onError(next) {
    try {
        yield next;
    } catch (err) {
        let error = {
            message: err.message || err,
            status: err.status || 500,
            stack: err.stack || null
        }
        console.log(err, error);

        if (!settings.leakStackTraces) {
            error.stack = null;
        }

        try {
            this.status = error.status;
            this.locals.error = error;
            this.body = yield this.render('error', this.locals);
        } catch(err) {
            this.status = 500;
            this.body = '<h1>Everything went wrong</h1><p>An error occurred and then another one while trying to handle that error.</p>';
            this.app.emit('error', err, this);
        }
        this.app.emit('error', err, this);
    }
});

// Global 404 handler
app.use(function *pageNotFound(next){
    yield next;

    if (404 != this.status) return;

    // we need to explicitly set 404 here
    // so that koa doesn't assign 200 on body=
    this.status = 404;

    switch (this.accepts('html', 'json')) {
        case 'json':
        this.body = {
            message: 'Page Not Found'
        };
        break;
        default:
        this.type = 'text';
        this.body = yield this.render('error', {
            error: {
                status: 404,
                message: 'Page not found'
            }
        });
    }
});


// Register routes and methods
app
.use(router.routes())
.use(router.allowedMethods());

if (settings.useLetsEncrypt) {
    // Configure lets encrypt and set two listening servers
    /* Note: using staging server url, remove .testing() for production
    Using .testing() will overwrite the debug flag with true */
    const LEX = require('letsencrypt-express');

    const lex = LEX.create({
        configDir: settings.leDir,
        fullchainTpl: settings.leFullChainFile,
        privkeyTpl: settings.lePrivKeyFile,
        approveRegistration: function (hostname, cb) {

            cb(null, {
                domains: [settings.hostname],
                email: settings.leEmail,
                agreeTos: true
            });
        }
    });

    const http = require('http');
    const https = require('spdy');
    var redirectHttps = koa().use(require('koa-sslify')()).callback();

    const server = https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app.callback()));
    const redirectServer = http.createServer(LEX.createAcmeResponder(lex, redirectHttps));

    server.listen(settings.httpsPort, function () {
        console.log('Listening at :' +  + this.address().port);
    });

    redirectServer.listen(settings.httpPort, function () {
        console.log('Redirecting insecure traffic from http://' + settings.hostname + ':' + this.address().port + ' to https');
    });
} else {
    // Listen on http only
    app.listen(settings.httpPort);
}
