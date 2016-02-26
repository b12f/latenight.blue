var express = require('express');
var router = express.Router();
var methods = require('../bin/methods');
var path = require('path');
var fs = require('fs');
var vars = require('../bin/vars');
var basicAuth = require('basic-auth');

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === vars.adminUser && user.pass === vars.adminPassword) {
    return next();
  } else {
    return unauthorized(res);
  };
};
router.use(function(req, res, next){
    // Set locals
    res.locals.pageOptions = {
        vars: vars,
        stylesheets: [
            vars.homeurl+"css/normalize.css",
            "http://fonts.googleapis.com/css?family=Oswald:400,300|Abril+Fatface&subset=latin,latin-ext",
            vars.homeurl+"css/css.css"
        ],
        scripts: []
    };
    next();
});

/* GET playlist. */
router.get('/playlist', function(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    methods.getPlaylist(function(playlist){
        res.send(JSON.stringify(playlist));
    });
});
/* Post new song */
router.post(vars.apRoute, auth, function(req, res, next) {
  console.log(req.body.deleteID);
    if(req.body.deleteID){
        methods.delete(req.body.deleteID, function(err, song){
            if(err) {
                res.locals.pageOptions.error = err;
                res.locals.pageOptions.song = song;
            }
            else {
                res.locals.pageOptions.success = "Deleted "+song.title+" by "+song.artist+" successfully from queue.";
            }
            next('route');
        });
    }
    else if(req.body.publishID){
        methods.publish(req.body.publishID, function(err, song){
            if(err) {
                res.locals.pageOptions.error = err;
                res.locals.pageOptions.song = song;
            }
            else {
                res.locals.pageOptions.success = "Published "+song.title+" by "+song.artist+" as episode "+song.episode+".";
            }
            next('route');
        });
    }
    else{
      var song = {
          title: req.body.title,
          artist: req.body.artist,
          album: req.body.album,
          url: req.body.url
      }
      if((typeof(song.title)==="string" && song.title.length > 0)
          &&(typeof(song.artist)==="string" && song.artist.length > 0)
          &&(typeof(song.album)==="string" && song.album.length > 0)
          &&(typeof(song.url)==="string" && song.url.length > 0)){
          methods.save(song, function(err, song){
              if(err){
                  res.locals.pageOptions.error = err;
                  res.locals.pageOptions.song = song;
              }
              else{
                  res.locals.pageOptions.success = "Saved "+song.title+" by "+song.artist+".";
              }
              next('route');
          });
      }
      else{
          res.locals.pageOptions.error = "Missing or bad input.";
          res.locals.pageOptions.song = song;
          next('route');
      }
    }

});

/* GET adminpanel. */
router.all('/ap', auth, function(req, res, next) {
  methods.getPlaylist(function(playlist){
    methods.getQueue(function(queue){
      res.locals.pageOptions.scripts.push(vars.homeurl+'js/complete.ly.1.0.1.js');
      res.locals.pageOptions.scripts.push(vars.homeurl+"js/lnb_ap.js");
      res.locals.pageOptions.playlist = playlist;
      res.locals.pageOptions.queue = queue;
      res.render('ap', res.locals.pageOptions);
    });
  });
});


/* GET home page. */

router.get(['/:id(\\d+)/', '/'], function(req, res, next) {
  res.locals.pageOptions.scripts.push('https://www.youtube.com/iframe_api');
  res.locals.pageOptions.scripts.push(vars.homeurl+"js/lnb.js");

  var episode = parseInt(req.params.id);
  if(!isNaN(episode) && typeof episode === "number" ){
    methods.getPlaylist(function(playlist){
      if(0 <= episode < playlist.length){
        var found = false;
          for(var i = 0; i < playlist.length; i++){
            if(playlist[i].episode===episode){
              found = true;
              res.locals.pageOptions.episode = playlist[i];
              break;
            }
          }
        res.render('index', res.locals.pageOptions);
      }
    });
  }
  else {
    res.render('index', res.locals.pageOptions);
  }
});

module.exports = router;
