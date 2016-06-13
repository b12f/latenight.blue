# latenight.blue

This is the source for [latenight.blue](http://latenight.blue). Lnb is a carefully curated collection of minimalist music. It aims to provide no fluff, no unnecessary extras. It is superfast because it does almost nothing.

# Features

Current master is v2-beta and in development, v2 will sport the following new and old features:

* KoaJS as the base framework **New**
* Let's Encrypt integration **New**
* Theming **New**
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

Create the variables file.

    cp settings.json.example settings.json

Edit the settings to fit your needs.

    nano settings.json

Start the server

    npm start

If you use ports below 1024, you need to run as root. This is not recommended, I wouldn't trust myself with root level access to your system. See also "Port fix" below.

    sudo npm start

Enjoy.

## Port fix

If you wish to run this on port 80 or 443, best practice would be to redirect the port.

    sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000

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

settings.json stores the themes settings. Currently the only supported setting is engineMap, which should be an object mapping file extensions to view engines for [koa-render](https://github.com/queckezz/koa-render).

## View data

Views get the following data to be used for rendering:

    settings: [object app settings]
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

Just fork and submit pull requests. Please stay true to the philosophy of "no fluff, no unnecessary extras" and please write code in the current style.
