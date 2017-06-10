# PSONO Client - Password Manager

Master: [![Code Climate](https://codeclimate.com/github/psono/psono-client/badges/gpa.svg)](https://codeclimate.com/github/psono/psono-client) [![build status](https://images.microbadger.com/badges/image/psono/psono-client.svg)](https://hub.docker.com/r/psono/psono-client/) [![build status](https://gitlab.com/psono/psono-client/badges/master/build.svg)](https://gitlab.com/psono/psono-client/commits/master) [![coverage report](https://gitlab.com/psono/psono-client/badges/master/coverage.svg)](https://gitlab.com/psono/psono-client/commits/master)

Develop: [![build status](https://gitlab.com/psono/psono-client/badges/develop/build.svg)](https://gitlab.com/psono/psono-client/commits/develop) [![coverage report](https://gitlab.com/psono/psono-client/badges/develop/coverage.svg)](https://gitlab.com/psono/psono-client/commits/develop)

# Canonical source

The canonical source of PSONO Client is [hosted on GitLab.com](https://gitlab.com/psono/psono-client).

# Install for "normal" people :D

## as Chrome Extension

1. Download the Chrome extension from the store here:

    https://chrome.google.com/webstore/detail/psonopw/eljmjmgjkbmpmfljlmklcfineebidmlo


## as Firefox Extension

1. Download the Firefox extension from the store here:

    https://addons.mozilla.org/de/firefox/addon/psono-pw-password-manager/
    

## as Docker Web Client

The latest build of our Web Client as a docker image can be found here: https://hub.docker.com/r/psono/psono-client/
Follow belows instructions to bring it online.

1. Create config

    The client will offer a pre-filled "Server Address". Its supposed to be the address where you see 
    
        {"detail":"Authentication credentials were not provided."}
        
    To make it easier for your clients create a config similar to src/common/data/config.json in a location like /opt/docker/psono-client/config.json
    We will mount this config in the next step, "shadowing" the config in the docker image.

2. Run the docker image and expose the port

        docker run --name psono-client \
            -v /opt/docker/psono-client/config.json:/usr/share/nginx/html/config.json \
            -d -p 10101:80 psono/psono-client:latest

    If you open now http://your-ip:10100 you should see a beautiful login screen.
    If not, please make sure you have no firewall on the server blocking you.

3. Setup nginx (or apache) relay

    For a config that is suitable for production use take a look at:
    
        ./configs/nginx-docker.conf

Two things you should be aware of:
    
1) As server on the login / registration screen you have to specify the full url to the server which shows this message when you open it directly in the browser:
    
        {"detail":"Authentication credentials were not provided."}

2) As username for the registration / login, you have to specify something in the format of an email address, ending e.g
in `@example.com` where `example.com` is in your `settings.yaml` in the `ALLOWED_DOMAINS` section

# Preamble

    The following steps are verified on Ubuntu 16.04 LTS. Ubuntu 12.04+ LTS and Debian based systems should be similar if not
    even identical.

# Install for developers

To actually htdocs (not minimized) folder that can be used for development is located in
`src/common/data/`. If you want to pack chrome extensions or modify sass files and recompile the css files
you may install belows dependencies and execute below mentioned commands.

1. Install dependencies

    To install all dependencies and make a small gulp test run, run the following script

        sudo var/build-ubuntu.sh
    
    (You should  not blindly execute scripts, so check what it does before you execute it)
        
2. Test if the installation was successful

	To test we can build Chrome and Firefox extensions together with the web client

        gulp
        
    While developing you can also use the following instead, which will rebuild everything once something changes:
        
        gulp watch

# How to create a release

1. Wait for the build / tests to finish on the develop branch
2. Merge develop branch into master branch
3. Wait for the build / tests to finish on the master branch
4. Create new Tag with the version information e.g v1.0.14 and provide adequate information for the Changelog

# How to build and deploy extensions 

Build and deployment are automated in the build pipeline and distributed as artifacts, but if someone wants
to build / publish his own version of this extension, then follow the following guide.
    
1. Pre-requirements

    Follow the steps of the `Install for developers` section
    
2. (optional) Update the manifest

    If you want to publish an own version in the chrome / firefox app store, then you have to update
    the name / description / version before, otherwise you will run into naming conflicts.
    You can skip this step if you do not want to upload it to the official app stores.
    
2. Build

    To build the Chrome and Firefox extensions (and Web Client) execute the following command:
    
        gulp

    This will build the raw extension folders (which you can use to load as unpacked extension for previews in your browser)
    
3. Packaging

    The packaging is done nowadays in a simple zip file. You can do so manually, or execute:
    
        ./var/package-chrome-extension.sh
        
    or for firefox:
        
        ./var/package-firefox-extension.sh

4. Deploy

    The deployment is a simple upload to:
    
        https://chrome.google.com/webstore/developer/dashboard
        
    or for firefox:
    
        https://addons.mozilla.org/de/developers/addons
        
    This process has been automated in our build pipeline and needs some investment on your side to gather all keys and
    so on if to replicate it (if you want it). The scripts responsible here are:
    
        ./var/deploy-chrome-extension.sh
        
    or for firefox:
        
        ./var/deploy-firefox-extension.sh

# How to build and deploy the Web Client 

Build and deployment are automated in the build pipeline and distributed as docker image but if you want to 
create the package for the Web Client, then follow the following guide.
    
1. Pre-requirements

    Follow the steps of the `Install for developers` section
    
2. Build

    To build the Web Client execute the following command:
    
        gulp

    This will build the raw web client folder which you can serve with any webserver e.g. nginx

# Install for unit tests

For unittest you have some additional dependencies.

0. Prerequirements

    Follow the steps of the `Install for developers` section
    
1. Run the tests

    directly from command line:

        karma start ./unittests/karma-chrome.conf.js
        
    if you want to use another browser like firefox you can also use `./unittests/karma-firefox.conf.js` instead or for
    something more generic `./unittests/karma-generic.conf.js`. If you use "generic" point the browser of your choice
    to the shown url.
        
    or more sexy with gulp:
    
        gulp unittest
        
    or if you want to watch for changes and run it automatically:
    
        gulp unittestwatch
        
2. Coverage

    The `./unittests/karma-generic.conf.js` config automatically generates an karma coverage report in html format
    in `unittests/coverage`

    
# Generate javascript docs

To generate the javascript run the following command

	gulp docs

# Documentation

More information about the code, the used cryptography and design concepts can be found in the [Documentation](docu/DOCUMENTATION.md)
    
