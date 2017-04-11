"use strict";

const path = require('path');
const log = require('debug');
const warn = log('theme:warn');

const themes = function (name) {
    let theme = {
        name: name
    };
    theme._rootDir = path.join(__dirname, '..', 'themes', name);
    theme._viewDir = path.join(theme._rootDir, 'views');
    theme._publicDir = path.join(theme._rootDir, 'public');

    try {
        theme._settings = require(path.join(theme._rootDir, 'settings.json'));
    } catch(err) {
        theme._settings = {};
        warn('No valid settings file found for theme ' + theme.name);
    }
    try {
        theme._fn = require(path.join(theme._rootDir, 'functions'));
    } catch(err) {
        theme._fn = {};
        warn('No valid functions file found for theme ' + theme.name);
    }

    return theme;
};


module.exports = themes;
