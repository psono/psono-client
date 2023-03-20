'use strict';

const webstore_upload = require('webstore-upload');

const client_id = process.env.webstore_client_id;
const client_secret = process.env.webstore_client_secret;
const refresh_token = process.env.webstore_refresh_token;
const app_id = process.env.webstore_app_id;

const uploadOptions = {
    accounts: {
        default: {
            client_id: client_id,
            client_secret: client_secret,
            refresh_token: refresh_token
        }
    },
    extensions: {
        extension1: {
            publish: true,
            appID: app_id,
            zip: 'chrome-extension.zip'
        }
    },
    uploadExtensions : ['extension1']
};

webstore_upload(uploadOptions, 'default')
    .then(function(result) {
        console.log(result);
        return 'Upload Complete';
    })
    .catch(function(err) {
        console.error(err);
    });