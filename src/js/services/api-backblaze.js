/**
 * Service to talk to the Backblaze and upload or download files
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
 * Ajax PUT request to upload a file chunk to Backblaze
 *
 * @param {string} signedUrl The signed url
 * @param {object} fields Array of fields that need to be part of the request
 * @param {Blob} chunk The content of the chunk to upload
 *
 * @returns {Promise} promise
 */
function upload(signedUrl, fields, chunk) {
	const endpoint = ""; // the signed url already has everything
	const method = "POST";
	const data = new FormData();
	for (const field_name in fields) {
		if (!Object.hasOwn(fields, field_name)) {
			continue;
		}
		data.append(field_name, fields[field_name]);
	}
	data.append("file", chunk);
	const headers = {};

	return call(signedUrl, method, endpoint, data, headers);
}

/**
 * Ajax GET request to download a file chunk from Backblaze
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

const apiBackblazeService = {
	upload: upload,
	download: download,
};

export default apiBackblazeService;
