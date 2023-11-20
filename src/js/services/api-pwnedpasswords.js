/**
 * Service to talk to the psono REST api
 */

function call(connection_type, endpoint, body, headers) {
    const backend = "https://api.pwnedpasswords.com";

    const req = {
        method: connection_type,
        headers: {
            ...headers
        }
    };

    if (body != null) {
        req['body'] = JSON.stringify(body);
    }

    return new Promise(function (resolve, reject) {
        const onSuccess = async function (data) {
            return resolve({
                data: await data.text(),
            });
        };

        const onError = function (data) {
            return reject(data);
        };

        fetch(backend + endpoint, req).then(onSuccess, onError);
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
    const body = null;
    const headers = {};

    return call(connection_type, endpoint, body, headers);
}

const apiPwnedpasswordsService = {
    range: range,
};

export default apiPwnedpasswordsService;
