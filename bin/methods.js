var fs = require('fs');
var path = require('path');
var vars = require('./vars');
var playlist = [];
var methods = {
    getQueue: function(cb){
      this.scrapeFullJSON(vars.queueDir, cb);
    },
    getPlaylist: function(cb){
      this.scrapeFullJSON(vars.playlistDir, cb);
    },
    scrapeFullJSON: function(dir, cb){
        playlist = [];
          fs.readdir(dir, function(err, files){
              if(err){
                  console.log(err);
                  cb(false);
              }
              else{
                  var c = 0;
                  if(files.length===0){
                    cb([]);
                  }
                  for(var i=0; i<files.length;i++){
                      var file = files[i];
                      fs.readFile(dir+'/'+file, 'utf-8', function(err, song){
                          c++;
                          song = JSON.parse(song);
                          playlist.push(song);
                          if(c===files.length){
                              cb(methods.sortArrayByKey(playlist, "episode", true));
                          }
                      });
                  }
              }
          });
    },
    sortArrayByKey: function(array, key, reverse){
      return array.sort(function(a, b) {
          var x = a[key]; var y = b[key];
          if(reverse){
            return ((x > y) ? -1 : ((x < y) ? 1 : 0));
          }
          else{
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
          }
      });
    },
    songExists: function(song, cb){
      var methods = this;
      //Check queue
        methods.getQueue(function(queue){
            var exists = false;
            for(var i = 0; i < queue.length; i++){
                if((queue[i].title === song.title && queue[i].artist === song.artist) || (queue[i].url === song.url) ){
                    exists = queue[i].url;
                    break;
                }
            }
            if(!exists){
              // Check Playlist
              methods.getPlaylist(function(playlist){
                for(var i = 0; i < playlist.length; i++){
                    if((playlist[i].title === song.title && playlist[i].artist === song.artist) || (playlist[i].url === song.url) ){
                        exists = playlist[i].url;
                        break;
                    }
                }
                  cb(exists);
              })
            }
            else{
              cb(exists);
            }
        });
    },
    findSuitableFile: function(c, dir, cb){
        var methods = this;
        fs.exists(dir +'/'+ c + '.json', function(exists){
            if(exists){
                c++;
                methods.findSuitableFile(c, dir, cb);
            }
            else {
                cb(dir +'/'+ c + '.json', c);
            }
        });
    },
    save: function(song, cb){
        var methods = this;
        methods.songExists(song, function(exists){
            if(exists){
                cb("Song already seems to exist on url " + exists + ".", song);
            }
            else{
                fs.readdir(vars.queueDir, function(err, files){
                    if(err){
                        cb(err, song);
                    }
                    else{
                    files.sort(function(a, b){
                        return a < b ? -1 : 1;
                    });
                    if(files.length === 0){
                      var c = 0;
                    }
                    else {
                      var c = parseInt(files[files.length - 1].substr(0, files[files.length - 1].indexOf(".json"))) + 1;
                    }
                        methods.findSuitableFile(c, vars.queueDir, function(file, episode){
                          song.id = episode;
                            fs.writeFile(file, JSON.stringify(song), 'utf-8', function(err){
                                cb(err, song);
                            });
                        });
                    }

                });
            }
        });
    },
    publish: function(id, cb){
        var methods = this;

        fs.readFile(vars.queueDir+'/'+id+'.json', 'utf-8', function(err, song){
          if(err){
            cb("Song does not exist.", false);
          }
          song = JSON.parse(song);
          var c = 0;
          methods.findSuitableFile(c, vars.playlistDir, function(file, episode){
              delete song.id;
              song.episode = episode;
              playlist.push(song);
              fs.writeFile(file, JSON.stringify(song), 'utf-8', function(err){
                if(!err){
                  methods.delete(id, function(err){
                    cb(err, song);
                  });
                }
                else{
                  cb(err, song);
                }
              });
          });
        });
    },
    delete: function(id, cb){
        var methods = this;

        fs.readFile(vars.queueDir+'/'+id+'.json', 'utf-8', function(err, song){
          if(err){
            cb("Song does not exist.", false);
          }
          else{
            song = JSON.parse(song);
            fs.unlink(vars.queueDir+'/'+id+'.json', function(err){
              cb(err, song);
            });
          }
        });
    }
}

module.exports = methods;
