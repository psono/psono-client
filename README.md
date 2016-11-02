# PSONO Server - Password Manager

Master: [![build status](https://gitlab.com/psono/psono-client/badges/master/build.svg)](https://gitlab.com/psono/psono-client/commits/master) [![coverage report](https://gitlab.com/psono/psono-client/badges/master/coverage.svg)](https://gitlab.com/psono/psono-client/commits/master)
Develop: [![build status](https://gitlab.com/psono/psono-client/badges/develop/build.svg)](https://gitlab.com/psono/psono-client/commits/develop) [![coverage report](https://gitlab.com/psono/psono-client/badges/develop/coverage.svg)](https://gitlab.com/psono/psono-client/commits/develop)

# Install for "normal" people :D

## Chrome

1. Download the crx file here:

    https://gitlab.com/psono/psono-client/builds/artifacts/master/download?job=chrome-extension
    
2. Unpack the ***.zip*** into a folder of your choice ***"folder/of/your/choice"***
    
4. Open following url in your browser:

    chrome://chrome/extensions/
    
5. Click "Open unpacked extension" at the top left and choose ***"folder/of/your/choice/build/chrome"***

The extension should now be loaded


## Firefox

1. Click on the following link:

    https://gitlab.com/psono/psono-client/builds/artifacts/master/download?job=firefox-extension
    
    (You will be asked (at the top left) if you want to allow this extension to be installed which you have to permit)
    

## Docker

1. Login to the gitlab registry

        docker login -u USERNAME registry.gitlab.com
    
    (replace USERNAME with your username and enter your password when prompted)

2. Create config

    The client will offer a pre-filled "Server Address". Its supposed to be the address where you see 
    
        {"detail":"Authentication credentials were not provided."}
        
    To make it easier for your clients create a config similar to src/common/data/config.json in a location like /opt/docker/psono-client/config.json
    We will mount this config in the next step, "shadowing" the config in the docker image.

3. Run the docker image and expose the port

        docker run --name psono-client \
            -v /opt/docker/psono-client/config.json:/usr/share/nginx/html/config.json \
            -d -p 10101:80 registry.gitlab.com/psono/psono-client:develop

    If you open now http://your-ip:10100 you should see a beautiful login screen.
    If not, please make sure you have no firewall on the server blocking you.
    
# Register / Login

Two things you should be aware of:
    
1) As server on the login / registration screen you have to specify the full url to the server which shows this message when you open it directly in the browser:
    
        {"detail":"Authentication credentials were not provided."}

2) As username for the registration / login, you have to specify something in the format of an email address, ending e.g in `@example.com` where example.com is in your settings.yaml in the `ALLOWED_DOMAINS` section


# Install for developers

1. Install dependencies

        sudo apt-get update
        sudo apt-get install nodejs
        sudo apt-get install npm
        sudo ln -s /usr/bin/nodejs /usr/bin/node
        sudo npm install
        
2. Build Chrome and Firefox extensions

        gulp
        
    While developing you can also use the following instead, which will rebuild everything once something changes:
        
        gulp watch

3. Pack Chrome extension for release

        gulp crx

    (make sure to run gulp without parameter first)
    
    After this command you will find in ./dist/chrome/psono.PW.crx (and ./dist/chrome/psono.PW.update.xml)
        
4. Pack Firefox extension for release

        gulp xpi

    (make sure to run gulp without parameter first)
    
    After this command you will find ./dist/firefox/psono.PW.xpi (and the unsigned version
    ./dist/firefox/psono.PW.unsigned.xpi)
    
    If you do not want to create an official signed version and only want to create the unsigned version you can do:
    
        gulp xpiunsigned
        
    Only ./dist/firefox/psono.PW.unsigned.xpi will be created.
        
5. (optional) Pack chrome and firefox for release
        
    The "All In One" command is:
    
        gulp dist
        
    This command will execute gulp, gulp crx and gulp xpi


# Install for unit tests

1. Install dependencies

        sudo npm install
        sudo npm install -g karma-cli
        sudo npm install -g coffee-script
        
    If you want unit tests, that run in Chrome / Firefox, you also have to install both browsers
    
2. Run the tests

    directly from command line:

        karma start ./unittests/karma-chrome.conf.js
        
    if you want to use another browser like firefox you can also use ./unittests/karma-firefox.conf.js instead or for
    something more generic ./unittests/karma-generic.conf.js. If you use "generic" point the browser of your choice
    to the shown url.
        
    or more sexy with gulp:
    
        gulp unittest
        
    or if you want to watch for changes and run it automatically:
    
        gulp unittestwatch
    

# Documentation

More information about the code, the used cryptography and design concepts can be found in the [Documentation](docu/DOCUMENTATION.md)
    
