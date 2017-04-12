"use strict";

const path = require('path');
let settings = require('../config.js');

let protocol = 'http';
if (settings.useLetsEncrypt) {
    protocol = 'https';
}
for (var i = 0; i < settings.sites.length; i++) {
    settings.sites[i].baseUrl = protocol + '://' + settings.sites[i].hostname + '/';
}

if (!settings.loglevel) {
    settings.loglevel = 2;
}

if (!settings.env) {
    settings.env = 'prod';
}

module.exports = {
    get: function (key) {
        return settings[key];
    },
    set: function (key, val) {
        settings[key] = val;
    }
};
