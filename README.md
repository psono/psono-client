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

0. Preamble

    This whole guide is based on Ubuntu 16.04 LTS. Ubuntu 12.04+ LTS and Debian based systems should be similar if not
    even identical.
    
1. Pre-requirements

    Follow the steps of the `Install for developers` section
    
2. Update your Firefox API key
    
    Make sure that your Firefox API key is in located in `~/.psono_client/apikey_addons_mozilla_org/key.json` in the
    following format

		{
			"issuer": "user:123467:789",
			"secret": "15c686fea..."
		}
 
	(replace the values with your api credentials from addons.mozilla.org)
	
3. Execute Script

    The following script will create a new firefox and chrome update with a new version. In addition it will create
    the appropriate tags and update the develop and master branch.
    
        ./var/release.sh 

# How to build extensions 

1. Pre-requirements

    Make sure that your Firefox API key is in 
    
2. Update your Firefox API key
    
    Make sure that your Firefox API key is in located in `~/.psono_client/apikey_addons_mozilla_org/key.json` in the
    following format

		{
			"issuer": "user:123467:789",
			"secret": "15c686fea..."
		}
 
	(replace the values with your api credentials from addons.mozilla.org)

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

For unittest you have some additional dependencies.

0. Prerequirements

    Follow the steps of the `Install for developers` section
    
1. Run the tests

    directly from command line:

        karma start ./unittests/karma-chrome.conf.js
        
    if you want to use another browser like firefox you can also use ./unittests/karma-firefox.conf.js instead or for
    something more generic ./unittests/karma-generic.conf.js. If you use "generic" point the browser of your choice
    to the shown url.
        
    or more sexy with gulp:
    
        gulp unittest
        
    or if you want to watch for changes and run it automatically:
    
        gulp unittestwatch


    
# Generate javascript docs

To generate the javascript run the following command

	gulp docs

    
# Debug

### Firefox:

We assume you have jpm and firefox developer edition installed, then you can debug the firefox extension with:

        gulp
        cd ./password-manager-browser-plugins/build/firefox
        jpm run -b "path/to/developer-firefox-edition"
    
    

# Documentation

More information about the code, the used cryptography and design concepts can be found in the [Documentation](docu/DOCUMENTATION.md)
    
