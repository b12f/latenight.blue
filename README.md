# latenight.blue [DEPRECATED]

This is the v3 source for [latenight.blue](https://latenight.blue) and [eleventhirty.am](https://eleventhirty.am). This code aims to provide no fluff, no unnecessary extras.

## Deprecation

This code has been deprecated in favour of [lnb-server](https://github.com/b12f/lnb-server), [lnb-client](https://github.com/b12f/lnb-client) and [etam-client](https://github.com/b12f/etam-client).

# Features

Current master is v3. It sports the following new and old features:

* Multiple vHosts **New**
* Updating published content **New**
* KoaJS as the base framework
* Let's Encrypt integration **Automatic renewal**
* Theming
* Three views (index, admin, error)
* One API route (GET /playlist)
* Support for 1 (one!) data submission type
* External hosting and streaming of all relevant data via YouTube and SoundCloud **Classic**
* Publishing queue
* One admin access
* SEO friendly URLs like example.com/, example.com/23, example.com/40, or even example.com/80085 **Classic**
* No database and caching for minimal filesystem interaction **Classic**


# Try it out

Clone the repository

    git clone git@github.com:b12f/latenight.blue.git

Enter the directory and install the required node modules.

    cd latenight.blue
    npm install

Create the config file.

    cp config.js.example config.js

Edit the config to fit your needs.

    nano config.js

Start the server

    npm start

The admin panel can be found under `/ap`

If you use ports below 1024, you need to run as root. This is not recommended, I wouldn't trust myself with root level access to your system. See also "Port fix" below.

    sudo npm start

Enjoy.

## Port fix

If you wish to run this on port 80 or 443, a good practice would be to redirect the port.

    sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000

# Config options

#### sites: object[]

One object for each vhost you want to be running.

**.hostname: string**
Site hostname without http(s)://

**.site_title: string**
Site title, displayed on the homepage

**.keywords: string**
SEO keywords

**.description: object{episode: string, default: string}**
SEO description. episode for episode pages, default for homepage / error page.

**.title: object{episode: string, default: string}**
Same as above, for page title

**.theme: string**
Theme name to be used

**.apUser: string**
Admin username

**.apPass: string**
Admin password

**.databaseFile: string**
Path to the desired database File

**.scApiId: string (optional)**
SoundCloud API ID

**.gaId: string (optional)**
Google Analytics ID

#### httpPort: number (optional, default: 3080)

#### httpsPort: number (optional, default: 3443)

#### loglevel: number (optional, default: 2)
 * 0: Error
 * 1: Warn
 * 2: Info
 * 3: Debug

#### leEnabled: boolean
Let's Encrypt enabled flag

#### leEmail: string (required if leEnabled)
Email address to complete Let's Encrypt ACME callback with

# Migrating

Migrating from v2 to v3? Apart from the obvious settings changes, run

    node ./bin/migrate [playlistDir] [queueDir] [outputDbFile]

# Developing themes

Themes are stored in the /themes/[theme-name]/ folder, and have the following base structure:

    public/
    views/
        ap.html
        error.html
        index.html
    function.js
    settings.json

public/ is the theme's static root dir, all files in here will be served directly.

views/ is the view dir, in which the three view files (index.EXT, ap.EXT, error.EXT) reside.

functions.js can be used to define extra function to be used in the view templating.

settings.json stores the themes settings. Currently the only supported setting is engineMap, which should be an object mapping file extensions to view engines for [koa-views](https://github.com/queckezz/koa-views).

## View data

Views get the following data to be used for rendering:

    settings: [object site settings (config.js current site)]
    themeSettings: [object theme settings],
    themeFn: [object theme functions],
    buildMeta: [function build meta],
    playlist: [array playlist],
    queue: [array queue],
    song: [undefined OR object submitted song (ap view only)],
    episode: [undefined OR object current requested episode (index view only)],
    success: [undefined OR string success message (ap view only)],
    error: [undefined OR string error message]

# Contributing

Just fork and submit pull requests. Please stay true to the philosophy of "no fluff, no unnecessary extras" and please write code in the current style. If you feel a feature is missing open an issue, we'll see if we think it fits our philosophy.
