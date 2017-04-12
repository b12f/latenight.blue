'use strict';

const Router = require('koa-router');
const mount = require('koa-mount');
const utils = require('./utils.js');
const koaBody = require('koa-body');
const log = require('./logger.js');

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
    router.post('/ap', koaBody(), auth, async (ctx, next) => {
        if (ctx.request.body.deleteID){
            let res = db.remove(ctx.request.body.deleteID);
            log.debug(res);
            if (res.length === 0) {
                ctx.locals.error = 'Song to delete not found.';
                log.warn('Tried to delete song ID ' + ctx.request.body.deleteID + ' not found.');
            } else {
                let song = res[0];
                ctx.locals.success = 'Deleted '+song.title+' by '+song.artist+' successfully from queue.';
                log.info('Deleted '+song.title+' by '+song.artist+' successfully from queue.');

            }
        }
        else if (ctx.request.body.publishID){
            let res = db.publish(ctx.request.body.publishID);
            log.debug(res);
            if (!res) {
                ctx.locals.error = 'Song to publish not found.';
                log.warn('Tried to publish song ID ' + ctx.request.body.publishID + ' not found.');
            } else {
                let song = res;
                ctx.locals.success = 'Published '+song.title+' by '+song.artist+' as episode '+song.episode+'.';
                log.info('Published '+song.title+' by '+song.artist+' as episode '+song.episode+'.');
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
                log.debug(res);
                if (!res) {
                    ctx.locals.error = 'Could not update';
                    log.warn('Could not update song', song);
                    ctx.locals.song = song;
                } else {
                    song = res;
                    ctx.locals.success = 'Updated '+song.title+' by '+song.artist+' on episode ' +  + '.';
                    log.info('Updated '+song.title+' by '+song.artist+'.');
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
                url: ctx.request.body.url,
                episode: null
            }

            if((typeof(song.title)==='string' && song.title.length > 0)
            &&(typeof(song.artist)==='string' && song.artist.length > 0)
            &&(typeof(song.album)==='string' && song.album.length > 0)
            &&(typeof(song.url)==='string' && song.url.length > 0 && song.url.startsWith('https://'))){
                let res = db.add(song);
                log.debug(res);
                if (!res) {
                    ctx.locals.error = 'Could not save';
                    log.warn('Could not save song', song);
                    ctx.locals.song = song;
                } else {
                    ctx.locals.success = 'Saved '+song.title+' by '+song.artist+'.';
                    log.info('Saved '+song.title+' by '+song.artist+'.');
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
