/**
 * Service to talk to the psono REST api
 */

import converterService from "./converter";

function call(fileserverUrl, method, endpoint, data, headers) {

    const req = {
        method: method,
        body: data,
    };

    if (headers) {
        req.headers = headers;
    }

    return new Promise(function (resolve, reject) {
        const onSuccess = function (data) {
            return resolve(data);
        };

        const onError = function (data) {
            return reject(data);
        };

        fetch(fileserverUrl + endpoint, req).then(onSuccess, onError);
    });
}

/**
 * Ajax POST request to upload a file chunk
 *
 * @param {string} fileserverUrl The url of the target fileserver
 * @param {string} fileTransferId The file transfer id
 * @param {Blob} chunk The content of the chunk to upload
 * @param {string} ticket The ticket to authenticate the upload
 * @param {string} ticketNonce The nonce of the ticket
 *
 * @returns {Promise} promise
 */
function upload(fileserverUrl, fileTransferId, chunk, ticket, ticketNonce) {
    const endpoint = "/upload/";
    const method = "POST";
    const data = new FormData();
    data.append("file_transfer_id", fileTransferId);
    data.append("chunk", chunk);
    data.append("ticket", ticket);
    data.append("ticket_nonce", ticketNonce);
    const headers = {};

    return call(fileserverUrl, method, endpoint, data, headers);
}

/**
 * Ajax POST request to download a file chunk
 *
 * @param {string} fileserverUrl The url of the target fileserver
 * @param {string} fileTransferId The file transfer id
 * @param {string} ticket The ticket to authenticate the download
 * @param {string} ticketNonce The nonce of the ticket
 *
 * @returns {Promise} promise
 */
function download(fileserverUrl, fileTransferId, ticket, ticketNonce) {
    const endpoint = "/download/";
    const method = "POST";
    const data = {
        file_transfer_id: fileTransferId,
        ticket: ticket,
        ticket_nonce: ticketNonce,
    };

    const headers = {
        "Content-Type": "application/json",
    };

    return call(fileserverUrl, method, endpoint, JSON.stringify(data), headers).then(
        async function (data) {
            return {
                data: await data.arrayBuffer()
            };
        },
        function (data) {
            if (data.status === 400) {
                data.data = JSON.parse(converterService.bytesToString(data.data));
            }
            return Promise.reject(data);
        }
    );
}

/**
 * Ajax GET request to get the server info
 *
 * @param {string} fileserverUrl The url of the target fileserver
 *
 * @returns {Promise} promise
 */
function info(fileserverUrl) {
    const endpoint = "/info/";
    const method = "GET";
    const data = null;
    const headers = null;

    return call(fileserverUrl, method, endpoint, data, headers);
}

const apiFileserverService = {
    info: info,
    upload: upload,
    download: download,
};

export default apiFileserverService;
