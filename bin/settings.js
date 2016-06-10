"use strict";

const path = require('path');
let settings = require('../settings.json');


for (let key in settings) {
    if (key.substr(-3) === 'Dir' || key.substr(-4) === 'File') {
        settings[key] = path.normalize(settings[key]);
        if (!path.isAbsolute(settings[key])) {
            settings[key] = path.join(__dirname, '..', settings[key]);
        }
    }
}

settings.baseUrl = 'https://' + settings.hostname + '/';

module.exports = settings;
