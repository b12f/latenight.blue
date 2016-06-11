# latenight.blue

This is the source for [latenight.blue](http://latenight.blue). Lnb is a carefully curated collection of minimalist music. It aims to provide no fluff, no unnecessary extras.

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
