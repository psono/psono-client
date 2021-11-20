/**
 * Service to talk to the psono REST api
 */

import converterService from './converter';

function call(fileserver_url, method, endpoint, data, headers, transformRequest, responseType) {

    if (!transformRequest) {
        transformRequest = $http.defaults.transformRequest;
    }

    const req = {
        method: method,
        url: fileserver_url + endpoint,
        data: data,
        transformRequest: transformRequest,
        responseType: responseType
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
 * Ajax POST request to upload a file chunk
 *
 * @param {string} fileserver_url The url of the target fileserver
 * @param {string} file_transfer_id The file transfer id
 * @param {Blob} chunk The content of the chunk to upload
 * @param {string} ticket The ticket to authenticate the upload
 * @param {string} ticket_nonce The nonce of the ticket
 *
 * @returns {Promise} promise
 */
function upload(fileserver_url, file_transfer_id, chunk, ticket, ticket_nonce) {

    var endpoint = '/upload/';
    var method = "POST";
    var data = new FormData();
    data.append('file_transfer_id', file_transfer_id);
    data.append('chunk', chunk);
    data.append('ticket', ticket);
    data.append('ticket_nonce', ticket_nonce);
    var headers = {
        'Content-Type': undefined
    };

    return call(fileserver_url, method, endpoint, data, headers, angular.identity);
};

/**
 * Ajax POST request to download a file chunk
 *
 * @param {string} fileserver_url The url of the target fileserver
 * @param {string} file_transfer_id The file transfer id
 * @param {string} ticket The ticket to authenticate the download
 * @param {string} ticket_nonce The nonce of the ticket
 *
 * @returns {Promise} promise
 */
function download(fileserver_url, file_transfer_id, ticket, ticket_nonce) {

    var endpoint = '/download/';
    var method = "POST";
    var data = {
        file_transfer_id: file_transfer_id,
        ticket: ticket,
        ticket_nonce: ticket_nonce
    };

    var headers = {
    };

    return call(fileserver_url, method, endpoint, data, headers,  undefined, 'arraybuffer').then(function(data) {
        return data
    },function(data) {
        if (data.status === 400) {
            data.data = JSON.parse(converterService.bytesToString(data.data));
        }
        return $q.reject(data)
    });
};

/**
 * Ajax GET request to get the server info
 *
 * @param {string} fileserver_url The url of the target fileserver
 *
 * @returns {Promise} promise
 */
var info = function (fileserver_url) {

    var endpoint = '/info/';
    var method = "GET";
    var data = null;
    var headers = null;

    return call(fileserver_url, method, endpoint, data, headers);
};

const service = {
    info: info,
    upload: upload,
    download: download
};

export default service;