/**
 * Service to talk to the Google Cloud Platform and upload or download files
 */

function call(signedUrl, method, endpoint, data, headers) {
	const req = {
		method: method,
		body: data,
	};

	if (headers) {
		req.headers = headers;
	}

	return new Promise((resolve, reject) => {
		const onSuccess = (data) => resolve(data);

		const onError = (data) => reject(data);

		fetch(signedUrl + endpoint, req).then(onSuccess, onError);
	});
}

/**
 * Ajax PUT request to upload a file chunk to GCP storage
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
		"Content-Type": "application/octet-stream",
	};

	return call(signedUrl, method, endpoint, chunk, headers);
}

/**
 * Ajax GET request to download a file chunk from GCP storage
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
		async (data) => ({
			data: await data.arrayBuffer(),
		}),
		(data) => Promise.reject(data),
	);
}

const apiGcpService = {
	upload: upload,
	download: download,
};

export default apiGcpService;
