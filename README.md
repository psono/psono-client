https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials

# Install for "normal" people :D

## Chrome

1. Download the crx file here:

    https://browserplugins.chickahoona.com/packed/chrome/sanso.PW.crx
    
2. Rename ***sanso.PW.crx*** to ***something.zip***

3. Unpack ***something.zip*** into a folder of your choice ***"folder/of/your/choice"***
    
4. Open following url in your browser:

    chrome://chrome/extensions/
    
5. Click "Open unpacked extension" at the top left and choose ***"folder/of/your/choice"***

The extension should now be loaded


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
        
