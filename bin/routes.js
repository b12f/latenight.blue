"use strict";

const router = require('koa-router')();
const mount = require('koa-mount');
const koaBody = require('koa-body')();
const methods = require('./methods');
const settings = require('./settings');
const path = require('path');
const fs = require('fs');
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

router.use(function (next){
    // Set locals
    this.locals.pageOptions = {
        settings: settings,
        stylesheets: [
            settings.baseUrl+"css/normalize.css",
            "http://fonts.googleapis.com/css?family=Oswald:400,300|Abril+Fatface&subset=latin,latin-ext",
            settings.baseUrl+"css/css.css"
        ],
        scripts: []
    };
});

/* GET playlist. */
router.get('/playlist', function *(next) {
    this.set('Content-Type', 'application/json');
    this.body = JSON.stringify(methods.getPlaylist());
});
/* Post new song */
router.post(settings.apRoute, koaBody, auth, function *(next) {
    if(this.request.body.deleteID){
        try {
            let song = yield methods.delete(this.request.body.deleteID);
            this.locals.pageOptions.success = "Deleted "+song.title+" by "+song.artist+" successfully from queue.";
        } catch (err) {
            this.locals.pageOptions.error = err.message;
            this.locals.pageOptions.song = err.song;
        }
    }
    else if(this.request.body.publishID){
        try {
            let song = methods.publish(this.request.body.publishID);
            this.locals.pageOptions.success = "Published "+song.title+" by "+song.artist+" as episode "+song.episode+".";
        } catch(err) {
            this.locals.pageOptions.error = err.message;
            this.locals.pageOptions.song = err.song;
        }
    }
    else{
        let song = {
            title: this.request.body.title,
            artist: this.request.body.artist,
            album: this.request.body.album,
            url: this.body.url
        }
        if((typeof(song.title)==="string" && song.title.length > 0)
            &&(typeof(song.artist)==="string" && song.artist.length > 0)
            &&(typeof(song.album)==="string" && song.album.length > 0)
            &&(typeof(song.url)==="string" && song.url.length > 0)){
            try {
                let song = yield methods.save(song);
                this.locals.pageOptions.success = "Saved "+song.title+" by "+song.artist+".";
            } catch (err) {
                this.locals.pageOptions.error = err.message;
                this.locals.pageOptions.song = err.song;
            }
        }
        else{
            this.locals.pageOptions.error = "Missing or bad input.";
            this.locals.pageOptions.song = song;
        }
    }

});

/* GET adminpanel. */
router.all(settings.apRoute, auth, function *(next) {
    let playlist = yield methods.getPlaylist();
    let queue = yield methods.getQueue();
    this.locals.pageOptions.scripts.push(settings.homeurl+'js/complete.ly.1.0.1.js');
    this.locals.pageOptions.scripts.push(settings.homeurl+"js/lnb_ap.js");
    this.locals.pageOptions.playlist = playlist;
    this.locals.pageOptions.queue = queue;
    this.body = yield this.render('ap', this.locals.pageOptions);
});


/* GET home page. */

router.get(['/:id(\\d+)/', '/'], function *(next) {
    this.locals.pageOptions.scripts.push('https://www.youtube.com/iframe_api');
    this.locals.pageOptions.scripts.push('https://w.soundcloud.com/player/api.js');
    this.locals.pageOptions.scripts.push(settings.homeurl+"js/lnb.js");

    let episode = parseInt(this.params.id);
    let playlist = methods.getPlaylist();
    this.locals.pageOptions.episode = playlist[0];
    if(!isNaN(episode) && typeof episode === "number" ){
        if(0 <= episode < playlist.length){
            let found = false;
            for(let i = 0; i < playlist.length; i++){
                if(playlist[i].episode === episode){
                    found = true;
                    this.locals.pageOptions.episode = playlist[i];
                    break;
                }
            }
            this.body = yield this.render('index', this.locals.pageOptions);
            return;
        }
    }
    this.body = yield this.render('index', this.locals.pageOptions);
});

module.exports = router;
