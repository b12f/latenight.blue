'use strict';

const fs = require('co-fs');
const path = require('path');
const settings = require('./settings');

const methods = {
    queue: null,
    buildMeta: function (name, episode) {
        let string = settings[name].episode;
        if (!episode) {
            string = settings[name].default;
            episode = {
                artist: '',
                title: '',
                episode: ''
            };
        }

        return string
            .replace('$$ARTIST', episode.artist)
            .replace('$$SONG_TITLE', episode.title)
            .replace('$$ARTIST', episode.artist)
            .replace('$$EPISODE', episode.episode)
            .replace('$$SITE_TITLE', episode.site_title);
    },
    refreshCache: function *() {
        methods.queue = null;
        yield methods.getQueue();
        methods.playlist = null;
        yield methods.getPlaylist();
    },
    getQueue: function *(){
        if (!methods.queue) {
            methods.queue = yield this.scrapeFullJSON(settings.queueDir);
        }
        return methods.queue;
    },
    playlist: null,
    getPlaylist: function *(){
        if (!methods.playlist) {
            methods.playlist = yield this.scrapeFullJSON(settings.playlistDir);
        }
        return methods.playlist;
    },
    scrapeFullJSON: function *(dir){
        let playlist = [];

        let files = yield fs.readdir(dir);

        let c = 0;

        if(files.length===0){
            return [{
                url: '',
                title: 'No entries yet',
                artist: '',
                episode: 0,
                album: ''
            }];
        }
        for(let i = 0; i < files.length; i++){
            let file = files[i];
            let song = yield fs.readFile(path.join(dir, file), 'utf-8');
            c++;
            song = JSON.parse(song);
            playlist.push(song);
            if(c === files.length){
                return methods.sortArrayByKey(playlist, 'episode', true);
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
                exists = queue[i];
                break;
            }
        }
        if(!exists){
            let playlist = yield methods.getPlaylist();
            for(let i = 0; i < playlist.length; i++){
                if((playlist[i].title === song.title && playlist[i].artist === song.artist) || (playlist[i].url === song.url) ){
                    exists = playlist[i];
                    break;
                }
            }
        }

        return exists.url;
    },
    findSuitableFile: function *(c, dir){
        let methods = this;

        if (c > settings.findSuitableMaxNum) {
            throw 'Max file entries reached. Increase findSuitableMaxNum in settings make sure playlistDir and queueDir are read-/writable.';
        }
        try {
            yield fs.readFile(path.join(dir, c + '.json'), fs.F_OK);
        } catch(e) {
            return {
                file: path.join(dir, c + '.json'),
                episode: c
            };
        }
        c++;
        return yield methods.findSuitableFile(c, dir);
    },
    save: function *(song){
        let methods = this;
        let exists = yield methods.songExists(song);

        if(exists){
            return 'Song already seems to exist on url ' + exists + '.';
        }

        let files = yield fs.readdir(settings.queueDir);

        files.sort(function(a, b){
            return a < b ? -1 : 1;
        });
        let c = 0;
        if(files.length !== 0){
            c = parseInt(files[files.length - 1].substr(0, files[files.length - 1].indexOf('.json'))) + 1;
        }
        let sf = yield methods.findSuitableFile(c, settings.queueDir);
        song.id = sf.episode;

        yield fs.writeFile(sf.file, JSON.stringify(song), 'utf-8');

        yield methods.refreshCache();

        return song;
    },
    publish: function *(id){
        let methods = this;
        let song;
        try {
            song = yield fs.readFile(path.join(settings.queueDir, id + '.json'), 'utf-8');
        } catch (err) {
            console.log(err);
            return 'Song does not exist';
        }

        song = JSON.parse(song);
        let c = 0;
        let sf = yield methods.findSuitableFile(c, settings.playlistDir);
        delete song.id;
        song.episode = sf.episode;
        yield fs.writeFile(sf.file, JSON.stringify(song), 'utf-8');
        yield methods.delete(id);
        yield methods.refreshCache();

        return song;
    },
    delete: function *(id){
        let song;
        try {
            song = yield fs.readFile(path.join(settings.queueDir, id + '.json'), 'utf-8');
            yield fs.unlink(path.join(settings.queueDir, id + '.json'));
        } catch(err) {
            return 'Song does not exist or is not deletable';
        }

        yield methods.refreshCache();

        return JSON.parse(song);
    },
    findEpisodeInPlaylist(ep, playlist) {
        for(let i = 0; i < playlist.length; i++){
            if(playlist[i].episode === ep){
                return playlist[i];
            }
        }

        return false;
    }
};

module.exports = methods;
