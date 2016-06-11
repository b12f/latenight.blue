'use strict';

const router = require('koa-router')();
const mount = require('koa-mount');
const koaBody = require('koa-body')();
const methods = require('./methods');
const settings = require('./settings');
const auth = require('koa-basic-auth')({ name: settings.apUser, pass: settings.apPass });

router.use(function *(next){
    try {
        yield next;
    } catch (err) {
        if (401 == err.status) {
            this.status = 401;
            this.set('WWW-Authenticate', 'Basic');
            this.body = 'nah mane';
        } else {
            throw err;
        }
    }
});

router.use(function *(next){
    // Set locals
    this.locals = {};
    this.locals.pageOptions = {
        settings: settings,
        stylesheets: [
            settings.baseUrl+'css/normalize.css',
            settings.baseUrl+'css/css.css',
            'http://fonts.googleapis.com/css?family=Oswald:400,300|Abril+Fatface&subset=latin,latin-ext'
        ],
        scripts: [],
        buildMeta: methods.buildMeta
    };
    yield next;
});

/* GET playlist. */
router.get('/playlist', function *(next) {
    this.set('Content-Type', 'application/json');
    this.body = JSON.stringify(yield methods.getPlaylist());
});
/* Post new song */
router.post(settings.apRoute, koaBody, auth, function *(next) {
    if(this.request.body.deleteID){
        let res = yield methods.delete(this.request.body.deleteID);
        if (typeof(res) === 'string') {
            this.locals.pageOptions.error = res;
        } else {
            let song = res;
            this.locals.pageOptions.success = 'Deleted '+song.title+' by '+song.artist+' successfully from queue.';
        }
    }
    else if(this.request.body.publishID){
        let res = yield methods.publish(this.request.body.publishID);
        if (typeof(res) === 'string') {
            this.locals.pageOptions.error = res;
        } else {
            let song = res;
            this.locals.pageOptions.success = 'Published '+song.title+' by '+song.artist+' as episode '+song.episode+'.';
        }
    }
    else{
        let song = {
            title: this.request.body.title,
            artist: this.request.body.artist,
            album: this.request.body.album,
            url: this.request.body.url
        }

        if((typeof(song.title)==='string' && song.title.length > 0)
        &&(typeof(song.artist)==='string' && song.artist.length > 0)
        &&(typeof(song.album)==='string' && song.album.length > 0)
        &&(typeof(song.url)==='string' && song.url.length > 0)){
            let res = yield methods.save(song);
            if (typeof(res) === 'string') {
                this.locals.pageOptions.error = res;
                this.locals.pageOptions.song = song;
            } else {
                this.locals.pageOptions.success = 'Saved '+song.title+' by '+song.artist+'.';
            }
        }
        else{
            this.locals.pageOptions.error = 'Missing or bad input.';
            this.locals.pageOptions.song = song;
        }
    }
    yield next;
});

/* GET adminpanel. */
router.all(settings.apRoute, auth, function *(next) {
    let playlist = yield methods.getPlaylist();
    let queue = yield methods.getQueue();
    this.locals.pageOptions.scripts.push(settings.baseUrl+'js/lnb_ap.js');
    this.locals.pageOptions.playlist = playlist;
    this.locals.pageOptions.queue = queue;
    this.body = yield this.render('ap', this.locals.pageOptions);
});


/* GET home page. */

let mainPageFn = function *(next) {
    this.locals.pageOptions.scripts.push('https://www.youtube.com/iframe_api');
    this.locals.pageOptions.scripts.push('https://w.soundcloud.com/player/api.js');
    this.locals.pageOptions.scripts.push(settings.baseUrl+'js/lnb.js');

    let episode = parseInt(this.params.id);
    let playlist = yield methods.getPlaylist();
    episode = methods.findEpisodeInPlaylist(episode, playlist);
    if (!episode) {
        episode = playlist[0];
        episode.isHome = true;
    }
    this.locals.pageOptions.episode = episode;
    this.body = yield this.render('index', this.locals.pageOptions);
};

router.get('/:id', mainPageFn);
router.get('/', mainPageFn);

module.exports = router;
