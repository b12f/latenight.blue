/*var vars = {
  homeurl: 'http://latenight.blue/',
  title: 'latenight.blue',
  apPassword: '?!thisisaprettylongpassword',
  adminUser: 'adminoflnb',
  development: false,
  playlistDir: './data/playlist',
  queueDir: './data/queue',
}*/
const path = require('path');

let settings = {
  hostname: 'localhost:3000',
  title: 'latenight.blue',
  keywords: '',
  faviconFile: '',
  apPass: '?!thisisaprettylongpassword',
  apUser: 'adminoflnb',

  leEmail: 'hello@benjaminbaedorf.com',
  leDir: '/home/lnb/'

  playlistDir: './data/playlist/',
  queueDir: './data/queue/',
  publicDir: './public/'
}


    for (let key in settings) {
        if (key.substr(-3) === 'Dir' || key.substr(-4) === 'File') {
            settings[key] = path.normalize();
            if (!path.isAbsolute(settings[key])) {
                settings[key] = path.join(__dirname, settings[key]);
            }
        }
    }

    settings.baseUrl = 'https://' + settings.hostname + '/';

module.exports = settings;
