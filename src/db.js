'use strict';
const low = require('lowdb');

module.exports = function (fileName) {
    const db = low(fileName);
    db._.mixin(require('underscore-db'));
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
        return (playlist[0].episode + 1);
    }

    function add(song) {
        return db.get('songs')
            .push(song)
            .write();
    }

    function remove(id) {
        return db.get('songs')
            .remove({id: id})
            .write();
    }

    function publish(id) {
        return db.get('songs')
            .getById(id)
            .assign({
                episode: getNextEpisode()
            })
            .write();
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
            .write();
    }

    function getPlaylist() {
        return db.get('songs')
            .filter(song => {return typeof song.episode === 'number';})
            .sortBy('episode')
            .reverse()
            .value();
    }

    function getQueue() {
        return db.get('songs')
            .filter(song => {return typeof song.episode !== 'number';})
            .sortBy('title')
            .value();
    }

    function findByEpisode(episode) {
        return db.get('songs')
            .find({
                episode: parseInt(episode)
            })
            .value();
    }

    return {
        add: add,
        remove: remove,
        update: update,
        publish: publish,
        getPlaylist: getPlaylist,
        getQueue: getQueue,
        findByEpisode: findByEpisode
    };
};
