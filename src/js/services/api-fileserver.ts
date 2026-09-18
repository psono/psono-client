/**
 * Service to talk to the psono REST api
 */

import type { ApiResponse, HttpMethod } from "../../types/api";
import converterService from "./converter";

function call(
	fileserverUrl: string,
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
function upload(
	fileserverUrl: string,
	fileTransferId: string,
	chunk: Blob,
	ticket: string,
	ticketNonce: string,
): Promise<Response> {
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
function download(
	fileserverUrl: string,
	fileTransferId: string,
	ticket: string,
	ticketNonce: string,
): Promise<ApiResponse<ArrayBuffer>> {
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

	return call(
		fileserverUrl,
		method,
		endpoint,
		JSON.stringify(data),
		headers,
	).then(
		async (data) => ({
			data: await data.arrayBuffer(),
		}),
		(data: unknown) => {
			// Preserve the legacy Axios binary-error shape when a caller supplies it.
			const error = data as { status: number; data: unknown };
			if (error.status === 400) {
				error.data = JSON.parse(
					converterService.bytesToString(error.data as Uint8Array),
				);
			}
			return Promise.reject(data);
		},
	);
}

/**
 * Ajax GET request to get the server info
 *
 * @param {string} fileserverUrl The url of the target fileserver
 *
 * @returns {Promise} promise
 */
function info(fileserverUrl: string): Promise<Response> {
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
