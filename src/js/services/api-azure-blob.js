/**
 * Service to talk to the Azure Blob Storage and upload or download files
 */

import axios from "axios";
import converterService from "./converter";

function call(signed_url, method, endpoint, data, headers, transformRequest, responseType) {
    if (!transformRequest) {
        transformRequest = $http.defaults.transformRequest;
    }

    const req = {
        method: method,
        url: signed_url + endpoint,
        data: data,
        transformRequest: transformRequest,
        responseType: responseType,
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
 * Ajax PUT request to upload a file chunk to Azure Blob Storage
 *
 * @param {string} signed_url The signed ulr
 * @param {Blob} chunk The content of the chunk to upload
 *
 * @returns {Promise} promise
 */
function upload(signed_url, chunk) {
    var endpoint = ""; // the signed url already has everything
    var method = "PUT";

    var headers = {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": undefined,
    };

    return call(signed_url, method, endpoint, chunk, headers, angular.identity);
}

/**
 * Ajax GET request to download a file chunk from Azure Blob Storage
 *
 * @param {string} signed_url The signed ulr
 *
 * @returns {Promise} promise with the data
 */
function download(signed_url) {
    var endpoint = ""; // the signed url already has everything
    var method = "GET";
    var data = null;

    var headers = {};

    return call(signed_url, method, endpoint, data, headers, undefined, "arraybuffer").then(
        function (data) {
            return data;
        },
        function (data) {
            if (data.status === 400) {
                data.data = JSON.parse(converterService.bytesToString(data.data));
            }
            return $q.reject(data);
        }
    );
}

const service = {
    upload: upload,
    download: download,
};

export default service;
