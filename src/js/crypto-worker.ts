import nacl from "ecma-nacl";
import type { CryptoWorkerJobs } from "../types/crypto";

type CryptoWorkerMessage = {
	[Job in keyof CryptoWorkerJobs]: { job: Job; kwargs: CryptoWorkerJobs[Job] };
}[keyof CryptoWorkerJobs];

// This entry runs in a dedicated worker; the application tsconfig includes DOM
// globals, so describe the worker's messaging surface without mixing lib files.
interface CryptoWorkerScope {
	onmessage: ((message: MessageEvent<CryptoWorkerMessage>) => void) | null;
	postMessage(message: { kwargs: ArrayBuffer }, transfer: ArrayBuffer[]): void;
}

const worker = self as unknown as CryptoWorkerScope;

function encrypt_file(data: ArrayBuffer, k: ArrayBuffer, n: ArrayBuffer): void {
	const dataBytes = new Uint8Array(data);
	const keyBytes = new Uint8Array(k);
	const nonceBytes = new Uint8Array(n);

	const encrypted_data = nacl.secret_box.formatWN.pack(
		dataBytes,
		nonceBytes,
		keyBytes,
	);
	// ecma-nacl allocates ordinary ArrayBuffers for its output, which are transferable.
	const encrypted_buffer = encrypted_data.buffer as ArrayBuffer;

	worker.postMessage({ kwargs: encrypted_buffer }, [encrypted_buffer]);
}

function decrypt_file(text: ArrayBuffer, k: ArrayBuffer): void {
	const textBytes = new Uint8Array(text);
	const keyBytes = new Uint8Array(k);

	const decrypted_data = nacl.secret_box.formatWN.open(textBytes, keyBytes);
	let decrypted_buffer = decrypted_data.buffer as ArrayBuffer;
	decrypted_buffer = decrypted_buffer.slice(32, decrypted_buffer.byteLength);

	worker.postMessage({ kwargs: decrypted_buffer }, [decrypted_buffer]);
}

worker.onmessage = (msg) => {
	const job = msg.data.job;
	switch (msg.data.job) {
		case "encrypt_file":
			encrypt_file(msg.data.kwargs.data, msg.data.kwargs.k, msg.data.kwargs.n);
			break;
		case "decrypt_file":
			decrypt_file(msg.data.kwargs.text, msg.data.kwargs.k);
			break;
		default:
			throw "job could not be handled: " + job;
	}
};
