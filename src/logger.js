"use strict";

const settings = require('./settings');
const colors = require('colors');

/* Loglevels
 * 0: Error
 * 1: Warn
 * 2: Info
 * 3: Debug
 */

function error() {
    if (settings.get('loglevel') >= 0) {
        Array.prototype.unshift.call(arguments, 'Error:'.red);
        console.error.apply(this, arguments);
    }
}

function warn() {
    if (settings.get('loglevel') >= 1) {
        Array.prototype.unshift.call(arguments, 'Warn: '.yellow);
        console.warn.apply(this, arguments);
    }
}

function info() {
    if (settings.get('loglevel') >= 2) {
        Array.prototype.unshift.call(arguments, 'Info: '.blue);
        console.info.apply(this, arguments);
    }
}

function debug() {
    if (settings.get('loglevel') >= 3) {
        Array.prototype.unshift.call(arguments, 'Debug:'.green);
        console.log.apply(this, arguments);
    }
}


module.exports = {
    error: error,
    warn: warn,
    info: info,
    debug: debug
};
