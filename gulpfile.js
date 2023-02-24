'use strict';

var gulp = require('gulp');
var run = require('gulp-run');
var jwt = require('jsonwebtoken');
var webstore_upload = require('webstore-upload');


/**
 * Deploys the Chrome Extension to the Chrome Web Store
 */
gulp.task('chrome-deploy', function(cb) {

    var client_id = process.env.webstore_client_id;
    var client_secret = process.env.webstore_client_secret;
    var refresh_token = process.env.webstore_refresh_token;
    var app_id = process.env.webstore_app_id;

    var uploadOptions = {
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

    cb();
});

/**
 * Deploys the Firefox Extension to the Firefox Web Store
 */
gulp.task('firefox-deploy', function(cb) {

    var jwt_issuer = process.env.mozilla_jwt_issuer;
    var jwt_secret = process.env.mozilla_jwt_secret;
    var version = process.env.mozilla_version;
    var mozilla_addon_id = process.env.mozilla_addon_id;

    var issuedAt = Math.floor(Date.now() / 1000);
    var payload = {
        iss: jwt_issuer,
        jti: Math.random().toString(),
        iat: issuedAt,
        exp: issuedAt + 60
    };

    var token = jwt.sign(payload, jwt_secret, {
        algorithm: 'HS256'  // HMAC-SHA256 signing algorithm
    });

    run('curl "https://addons.mozilla.org/api/v4/addons/'+mozilla_addon_id+'/versions/'+ version +'/" -g -XPUT --form "upload=@firefox-extension.zip" -H "Authorization: JWT '+ token +'"').exec();

    cb();
});
