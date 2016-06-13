"use strict";

const path = require('path');
let settings = require('../config.json');

for (let key in settings) {
    if (key.substr(-3) === 'Dir' || key.substr(-4) === 'File') {
        settings[key] = path.normalize(settings[key]);
        if (!path.isAbsolute(settings[key])) {
            settings[key] = path.join(__dirname, '..', settings[key]);
        }
    }
}

let protocol = 'http';
if (settings.useLetsEncrypt) {
    protocol = 'https';
}
settings.baseUrl = protocol + '://' + settings.hostname + '/';

module.exports = settings;
