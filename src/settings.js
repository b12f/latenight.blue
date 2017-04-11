"use strict";

const path = require('path');
let settings = require('../config.js');

let protocol = 'http';
if (settings.useLetsEncrypt) {
    protocol = 'https';
}
settings.baseUrl = protocol + '://' + settings.hostname + '/';

module.exports = {
    get: function (key) {
        return settings[key];
    },
    set: function (key, val) {
        settings[key] = val;
    }
};
