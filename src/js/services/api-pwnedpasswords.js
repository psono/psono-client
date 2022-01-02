/**
 * Service to talk to the psono REST api
 */

import axios from "axios";

function call(connection_type, endpoint, data, headers) {
    const backend = "https://api.pwnedpasswords.com";

    const req = {
        method: connection_type,
        url: backend + endpoint,
        data: data,
    };

    req.headers = headers;

    return new Promise(function (resolve, reject) {
        const onSuccess = function (data) {
            return resolve(data);
        };

        const onError = function (data) {
            return reject(data);
        };

        axios(req).then(onSuccess, onError);
    });
}

/**
 * Ajax GET request to get a list pf pwned password hashes based on the first 5 digits of the sha1 hash of a password
 *
 * @param {string} hash_chars The first 5 digits of the sha1 of a password
 *
 * @returns {Promise} Returns a list of sha1 hashes
 */
function range(hash_chars) {
    const endpoint = "/range/" + hash_chars;
    const connection_type = "GET";
    const data = null;
    const headers = null;

    return call(connection_type, endpoint, data, headers);
}

const apiPwnedpasswordsService = {
    range: range,
};

export default apiPwnedpasswordsService;
