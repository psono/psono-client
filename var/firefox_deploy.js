'use strict';

const child_process = require('child_process');
const jwt = require('jsonwebtoken');

const jwt_issuer = process.env.mozilla_jwt_issuer;
const jwt_secret = process.env.mozilla_jwt_secret;
const version = process.env.mozilla_version;
const mozilla_addon_id = process.env.mozilla_addon_id;

let issuedAt = Math.floor(Date.now() / 1000);
let payload = {
    iss: jwt_issuer,
    jti: Math.random().toString(),
    iat: issuedAt,
    exp: issuedAt + 60
};

let token = jwt.sign(payload, jwt_secret, {
    algorithm: 'HS256'  // HMAC-SHA256 signing algorithm
});

child_process.execSync('curl "https://addons.mozilla.org/api/v4/addons/'+mozilla_addon_id+'/versions/'+ version +'/" -g -XPUT -F "upload=@firefox-extension.zip" -H "Authorization: JWT '+ token +'"');

issuedAt = Math.floor(Date.now() / 1000);
payload = {
    iss: jwt_issuer,
    jti: Math.random().toString(),
    iat: issuedAt,
    exp: issuedAt + 60
};
token = jwt.sign(payload, jwt_secret, {
    algorithm: 'HS256'  // HMAC-SHA256 signing algorithm
});

child_process.execSync('curl "https://addons.mozilla.org/api/v5/addons/addon/'+mozilla_addon_id+'/versions/'+ version +'/" -g -XPATCH -F "source=@source.zip" -F "license=Apache-2.0" -H "Authorization: JWT '+ token +'"');


