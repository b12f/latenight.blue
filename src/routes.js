'use strict';

const Router = require('koa-router');
const mount = require('koa-mount');
const utils = require('./utils.js');
const koaBody = require('koa-body')();
const log = require('debug');
const error = log('router:error');
const warn = log('router:warn');
const info = log('router:info');
const debug = log('router:debug');

module.exports = function (siteSettings) {
    const auth = require('koa-basic-auth')({ name: siteSettings.apUser, pass: siteSettings.apPass });
    const theme = new require('./themes')(siteSettings.theme);
    const router = Router();
    const db = require('./db.js')(siteSettings.databaseFile);

    router.use(async (ctx, next) =>{
        try {
            await next();
        } catch (err) {
            if (401 == err.status) {
                ctx.status = 401;
                ctx.set('WWW-Authenticate', 'Basic');
                ctx.body = 'nah mane';
            } else {
                throw err;
            }
        }
    });

    router.use(async (ctx, next) =>{
        let playlist = db.getPlaylist();
        let queue = db.getQueue();

        // Set locals
        ctx.locals = {
            settings: siteSettings,
            themeSettings: theme._settings,
            themeFn: theme._fn,
            buildMeta: utils.buildMeta(siteSettings),
            playlist: playlist,
            queue: queue,
            song: undefined,
            episode: undefined,
            success: undefined,
            error: undefined
        };
        await next();
    });

    /* GET playlist. */
    router.get('/playlist', async (ctx, next) => {
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify(ctx.locals.playlist);
    });
    /* Post new song */
    router.post('/ap', koaBody, auth, async (ctx, next) => {
        if (ctx.request.body.deleteID){
            let res = db.remove(ctx.request.body.deleteID);
            if (typeof(res) === 'string') {
                ctx.locals.error = res;
                error(res);
            } else {
                let song = res;
                ctx.locals.success = 'Deleted '+song.title+' by '+song.artist+' successfully from queue.';
                info('Deleted '+song.title+' by '+song.artist+' successfully from queue.');

            }
        }
        else if (ctx.request.body.publishID){
            let res = db.publish(ctx.request.body.publishID);
            if (typeof(res) === 'string') {
                ctx.locals.error = res;
                error(res);
            } else {
                let song = res;
                ctx.locals.success = 'Published '+song.title+' by '+song.artist+' as episode '+song.episode+'.';
                info('Published '+song.title+' by '+song.artist+' as episode '+song.episode+'.');
            }
        }
        else if (ctx.request.body.updateID) {
            let song = {
                title: ctx.request.body.title,
                artist: ctx.request.body.artist,
                album: ctx.request.body.album,
                url: ctx.request.body.url,
                id: ctx.request.body.updateID
            }

            if((typeof(song.title)==='string' && song.title.length > 0)
            &&(typeof(song.artist)==='string' && song.artist.length > 0)
            &&(typeof(song.album)==='string' && song.album.length > 0)
            &&(typeof(song.url)==='string' && song.url.length > 0 && song.url.startsWith('https://'))){
                let res = db.update(song);
                if (typeof(res) === 'string') {
                    ctx.locals.error = res;
                    ctx.locals.song = song;
                    error(res);
                } else {
                    ctx.locals.success = 'Updated '+song.title+' by '+song.artist+' on episode ' +  + '.';
                    info('Updated '+song.title+' by '+song.artist+'.');
                }
            }
            else{
                ctx.locals.error = 'Missing or bad input.';
                ctx.locals.song = song;
            }
        }
        else {
            let song = {
                title: ctx.request.body.title,
                artist: ctx.request.body.artist,
                album: ctx.request.body.album,
                url: ctx.request.body.url
            }

            if((typeof(song.title)==='string' && song.title.length > 0)
            &&(typeof(song.artist)==='string' && song.artist.length > 0)
            &&(typeof(song.album)==='string' && song.album.length > 0)
            &&(typeof(song.url)==='string' && song.url.length > 0 && song.url.startsWith('https://'))){
                let res = db.add(song);
                if (typeof(res) === 'string') {
                    ctx.locals.error = res;
                    ctx.locals.song = song;
                    error(res);
                } else {
                    ctx.locals.success = 'Saved '+song.title+' by '+song.artist+'.';
                    info('Saved '+song.title+' by '+song.artist+'.');
                }
            }
            else{
                ctx.locals.error = 'Missing or bad input.';
                ctx.locals.song = song;
            }
        }
        ctx.locals.playlist = db.getPlaylist();
        ctx.locals.queue = db.getQueue();
        await next();
    });

    /* GET adminpanel. */
    router.all('/ap', auth, async (ctx, next) => {
        await ctx.render('ap', ctx.locals);
    });

    /* GET home page. */
    router.get('/', async (ctx, next) => {
        let episode = ctx.locals.playlist[0];

        // no episodes yet
        if (!episode) {
            episode = {
                id: null,
                episode: -1,
                title: 'No songs yet',
                artist: 'Click here',
                album: 'To add songs',
                url: '/ap'
            };
        }

        episode.isHome = true;
        ctx.locals.episode = episode;
        await ctx.render('index', ctx.locals);
    });

    /* GET episode */
    router.get('/:episode', async (ctx, next) => {
        let episode = ctx.params.episode;
        let playlist = ctx.locals.playlist;

        episode = db.findByEpisode(episode);

        if (!episode) {
            ctx.redirect('/');
        }

        ctx.locals.episode = episode;
        await ctx.render('index', ctx.locals);
    });

    return router;
}
