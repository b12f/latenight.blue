'use strict';
const low = require('lowdb');

module.exports = function (fileName) {
    const db = low(fileName);
    db.defaults({songs: []})
        .write();

    function songExists(song) {
        let found = db.get('songs')
            .find({
                title: song.title,
                artist: song.artist,
                album: song.album
            })
            .value();

        if (found[0]) {
            return found[0].url;
        }

        let foundUrl = db.get('songs')
            .find({
                url: song.url
            })
            .value();

        if (foundUrl[0]) {
            return foundUrl[0].url;
        }
    }

    function getNextEpisode() {
        let playlist = getPlaylist();
        return (playlist[playlist.length - 1].episode + 1);
    }

    function add(song) {
        return db.get('songs')
            .push(song)
            .write();
    }

    function remove(id) {
        return db.get('songs')
            .remove({id: id})
            .value();
    }

    function publish(id) {
        return db.get('songs')
            .getById(id)
            .assign({
                episode: getNextEpisode()
            })
            .value();
    }

    function update(song) {
        return db.get('songs')
            .getById(song.id)
            .assign({
                url: song.url,
                title: song.title,
                album: song.album,
                artist: song.artist
            })
            .value();
    }

    function getPlaylist() {
        return db.get('songs')
            .filter(song => {return song.episode !== null;})
            .sortBy('episode')
            .reverse()
            .value();
    }

    function getQueue() {
        return db.get('songs')
            .filter(song => {return song.episode === null;})
            .sortBy('title')
            .value();
    }

    return {
        add: add,
        remove: remove,
        publish: publish,
        getPlaylist: getPlaylist,
        getQueue: getQueue,
        findByEpisode: function (episode) {
            db.get('posts').find({
                episode: episode
            }).value();
        }
    };
};
