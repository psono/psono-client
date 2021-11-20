/**
 * Service to talk to the psono REST api
 */

function call(connection_type, endpoint, data, headers) {

    var backend = 'https://api.pwnedpasswords.com';

    const req = {
        method: connection_type,
        url: backend + endpoint,
        data: data
    };

    req.headers = headers;

    return $q(function(resolve, reject) {

        const onSuccess = function(data) {
            return resolve(data);
        };

        const onError = function(data) {
            return reject(data);
        };

        $http(req)
            .then(onSuccess, onError);

    });
};

/**
 * Ajax GET request to get a list pf pwned password hashes based on the first 5 digits of the sha1 hash of a password
 *
 * @param {string} hash_chars The first 5 digits of the sha1 of a password
 *
 * @returns {Promise} Returns a list of sha1 hashes
 */
var range = function (hash_chars) {

    var endpoint = '/range/' + hash_chars;
    var connection_type = "GET";
    var data = null;
    var headers = {
        'If-Modified-Since': undefined,
        'Cache-Control': undefined,
        'Pragma': undefined
    };

    return call(connection_type, endpoint, data, headers);
};


const service = {
    range: range
};

export default service;