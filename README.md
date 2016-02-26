# latenight.blue

This is the source for [latenight.blue](http://latenight.blue). Lnb is a carefully curated collection of minimalist music. It aims to provide no fluff, no unnecessary extras.

# Try it out
Clone the repository

    git clone git@github.com:b12f/latenight.blue.git

Enter the directory and install the required node modules.

    cd latenight.blue
    npm install

Create the variables file.

    mv bin/vars.js.example bin/vars.js

Edit vars.js to fit your needs.

    nano bin/vars.js

Start the server

    npm start

Enjoy.

## Port fix

If you wish to run this on port 80, best practice would be to redirect the port.

    sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000