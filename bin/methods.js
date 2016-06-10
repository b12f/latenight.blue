"use strict";

const fs = require('co-fs');
const path = require('path');
const settings = require('./settings');

const methods = {
    queue: null,
    getQueue: function *(){
        if (!this.queue) {
            this.queue = yield this.scrapeFullJSON(settings.queueDir);
        }
        return this.queue;
    },
    playlist: [],
    getPlaylist: function *(){
        if (!this.playlist) {
            this.playlist = yield this.scrapeFullJSON(settings.playlistDir);
        }
        return this.playlist;
    },
    scrapeFullJSON: function *(dir){
        let playlist = [];

        let files = yield fs.readdir(dir);

        let c = 0;

        if(files.length===0){
            return [];
        }
        for(let i = 0; i < files.length; i++){
            let file = files[i];
            let song = yield fs.readFile(path.join(dir, file), 'utf-8');
            c++;
            song = JSON.parse(song);
            playlist.push(song);
            if(c === files.length){
                return methods.sortArrayByKey(playlist, "episode", true);
            }
        }
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
    songExists: function *(song){
        let methods = this;
        let queue = yield methods.getQueue();

        let exists = false;

        for(let i = 0; i < queue.length; i++){
            if((queue[i].title === song.title && queue[i].artist === song.artist) || (queue[i].url === song.url) ){
                exists = queue[i].url;
                break;
            }
        }
        if(!exists){
            let playlist = yield methods.getPlaylist();
            for(let i = 0; i < playlist.length; i++){
                if((playlist[i].title === song.title && playlist[i].artist === song.artist) || (playlist[i].url === song.url) ){
                    exists = playlist[i].url;
                    break;
                }
            }
        }

        return exists;
    },
    findSuitableFile: function *(c, dir){
        let methods = this;

        if (c > settings.findSuitableMaxNum) {
            console.log('Max file entries reached. Increase findSuitableMaxNum in settings.')
        }

        try {
            yield fs.access(path.join(dir, c + '.json'), fs.F_OK);
            return {
                file: path.join(dir, c + '.json'),
                episode: c
            };
        } catch(e) {
            c++;
            return yield methods.findSuitableFile(c, dir);
        }
    },
    save: function *(song){
        let methods = this;
        let exists = yield methods.songExists(song);

        if(exists){
            return {
                err: "Song already seems to exist on url " + exists + ".",
                song: song
            };
        }
        try {
            let files = fs.readdir(settings.queueDir);

            files.sort(function(a, b){
                return a < b ? -1 : 1;
            });
            let c = 0;
            if(files.length !== 0){
                c = parseInt(files[files.length - 1].substr(0, files[files.length - 1].indexOf(".json"))) + 1;
            }
            let sf = yield methods.findSuitableFile(c, settings.queueDir);
            song.id = sf.episode;

            fs.writeFile(sf.file, JSON.stringify(song), 'utf-8');

            return song;
        } catch (err) {
            return {
                err: err,
                song: song
            };
        }
    },
    publish: function *(id){
        let methods = this;

        try {
            let song = fs.readFile(path.join(settings.queueDir, id + '.json'), 'utf-8');

            song = JSON.parse(song);
            let c = 0;
            let sf = methods.findSuitableFile(c, settings.playlistDir);
            delete song.id;
            song.episode = sf.episode;
            playlist.push(song);
            try {
                yield fs.writeFile(sf.file, JSON.stringify(song), 'utf-8');
                yield methods.delete(id);
                return {
                    err: null,
                    song: song
                };
            } catch(e) {
                console.log(e);
                return {
                    err: err,
                    song: song
                };
            }
        } catch (err) {
            return 'Song does not exist';
        }
    },
    delete: function *(id){
        try {
            let song = JSON.parse(path.join(settings.queueDir, id + '.json'), 'utf-8');
            yield fs.unlink(path.join(settings.queueDir, id + '.json'));
            return JSON.parse(song);
        } catch(err) {
            return 'Song does not exist';
        }
    }
};

module.exports = methods;
