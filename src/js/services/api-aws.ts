/**
 * Service to talk to the AWS S3 and upload or download files
 */

import type {
	ApiResponse,
	HttpMethod,
	SignedUploadFields,
} from "../../types/api";

function call(
	signedUrl: string,
	method: HttpMethod,
	endpoint: string,
	data: BodyInit | null,
	headers?: HeadersInit | null,
): Promise<Response> {
	const req: RequestInit = {
		method: method,
		body: data,
	};

	if (headers) {
		req.headers = headers;
	}

	return new Promise<Response>((resolve, reject) => {
		const onSuccess = (data: Response) => resolve(data);

		const onError = (data: unknown) => reject(data);

		fetch(signedUrl + endpoint, req).then(onSuccess, onError);
	});
}

/**
 * Ajax PUT request to upload a file chunk to AWS S3
 *
 * @param {string} signedUrl The signed url
 * @param {object} fields Array of fields that need to be part of the request
 * @param {Blob} chunk The content of the chunk to upload
 *
 * @returns {Promise} promise
 */
function upload(
	signedUrl: string,
	fields: SignedUploadFields,
	chunk: Blob,
): Promise<Response> {
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
 * Ajax GET request to download a file chunk from AWS S3
 *
 * @param {string} signedUrl The signed url
 *
 * @returns {Promise} promise with the data
 */
function download(signedUrl: string): Promise<ApiResponse<ArrayBuffer>> {
	const endpoint = ""; // the signed url already has everything
	const method = "GET";
	const data = null;

	const headers = {};

	return call(signedUrl, method, endpoint, data, headers).then(
		async (data) => ({
			data: await data.arrayBuffer(),
		}),
		(data: unknown) => Promise.reject(data),
	);
}

const apiAwsService = {
	upload: upload,
	download: download,
};

export default apiAwsService;
