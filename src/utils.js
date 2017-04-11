'use strict';

const fs = require('co-fs');
const path = require('path');

const utils = {
    buildMeta: function (settings) {
        return function buildMeta(name, episode) {
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
                .replace('$$SITE_TITLE', settings.site_title);
        }
    }
};

module.exports = utils;
