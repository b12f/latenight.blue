'use strict';

const path = require('path');
const Koa = require('koa');
const log = require('debug');
const globals = require('./settings.js');
const error = log('app:error');
const warn = log('app:warn');
const info = log('app:info');
const debug = log('app:debug');
const kStatic = require('koa-static');

module.exports = function (settings) {
    const app = new Koa();
    const router = require('./routes.js')(settings);
    const theme = require('./themes.js')(settings.theme);
    const render = require('koa-views');
    debug('Initializing vhost app', settings.hostname);

    // Register the templating engine
    debug('Using view dir', theme._viewDir);
    app.use(render(theme._viewDir, {
    	map: theme._settings.engineMap
    }));

    // Set the static serving public dir
    debug('Using public dir', theme._publicDir);
    app.use(kStatic(theme._publicDir, {
        maxage: (30*24*60*60*1000),
        defer: false
    }));

    // Global request error catcher
    app.use(async (ctx, next) => {
        try {
            ctx.locals = {};
            await next();
        } catch (err) {
            err = {
                message: err.message || err,
                status: err.status || 500,
                stack: err.stack || null
            };
            error(err, error);

            if (!globals.get('env') === 'dev') {
                err.stack = null;
            }

            try {
                ctx.status = err.status;
                ctx.locals.error = err;
                await ctx.render('error', ctx.locals);
            } catch(err) {
                ctx.status = 500;
                ctx.body = '<h1>Everything went wrong</h1><p>An error occurred and then another one while trying to handle that error.</p>';
                ctx.app.emit('error', err, ctx);
            }
            ctx.app.emit('error', err, ctx);
        }
    });

    // Global 404 handler
    app.use(async (ctx, next) => {
        await next();

        if (404 != ctx.status) return;

        // we need to explicitly set 404 here
        // so that koa doesn't assign 200 on body=
        ctx.status = 404;

        switch (ctx.accepts('html', 'json')) {
            case 'json':
            ctx.body = {
                message: 'Page Not Found'
            };
            break;
            default:
            ctx.type = 'text';
            await ctx.render('error', {
                error: {
                    status: 404,
                    message: 'Page Not found'
                }
            });
        }
    });


    // Register routes and methods
    app
    .use(router.routes())
    .use(router.allowedMethods());

    return app;
}
