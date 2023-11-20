/**
 * Service to talk to the Azure Blob Storage and upload or download files
 */

function call(signedUrl, method, endpoint, data, headers) {

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

        fetch(signedUrl + endpoint, req).then(onSuccess, onError);
    });
}

/**
 * Ajax PUT request to upload a file chunk to Azure Blob Storage
 *
 * @param {string} signedUrl The signed url
 * @param {Blob} chunk The content of the chunk to upload
 *
 * @returns {Promise} promise
 */
function upload(signedUrl, chunk) {
    const endpoint = ""; // the signed url already has everything
    const method = "PUT";
    const headers = {
        "x-ms-blob-type": "BlockBlob"
    };

    return call(signedUrl, method, endpoint, chunk, headers);
}

/**
 * Ajax GET request to download a file chunk from Azure Blob Storage
 *
 * @param {string} signedUrl The signed url
 *
 * @returns {Promise} promise with the data
 */
function download(signedUrl) {
    const endpoint = ""; // the signed url already has everything
    const method = "GET";
    const data = null;

    const headers = {};

    return call(signedUrl, method, endpoint, data, headers).then(
        async function (data) {
            return {
                data: await data.arrayBuffer()
            };
        },
        function (data) {
            return Promise.reject(data);
        }
    );
}

const apiAzureBlobService = {
    upload: upload,
    download: download,
};

export default apiAzureBlobService;
