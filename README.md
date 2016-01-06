https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials

# Install for "normal" people :D

## Chrome

1. Donwnload the crx file here:

    https://browserplugins.chickahoona.com/packed/chrome/sanso.PW.crx
    
    
2. Open following url in your browser:

    chrome://chrome/extensions/
    
3. Drag and drop the downloaded crx file onto this page




## Firefox

TODO

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
        
4. Pack Firefox extension for release

        TODO
        
