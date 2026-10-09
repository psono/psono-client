import type { RecoveryCode, ScryptParameters } from "../../types/crypto";
import converter from "./converter";
import crypto from "./crypto-library";
import helper from "./helper";

export const LEGACY_EMERGENCY_PARAMETERS = Object.freeze({
	u: 14,
	r: 8,
	p: 1,
	l: 64,
});

function validateParameters(algorithm: string, parameters: ScryptParameters) {
	if (
		algorithm !== "scrypt" ||
		parameters.l !== 64 ||
		!Number.isSafeInteger(parameters.u) ||
		parameters.u! < 14 ||
		parameters.u! > 30 ||
		!Number.isSafeInteger(parameters.r) ||
		parameters.r! < 8 ||
		parameters.r! > 0xffffffff ||
		!Number.isSafeInteger(parameters.p) ||
		parameters.p! < 1 ||
		parameters.p! > 0xffffffff ||
		parameters.r! * parameters.p! >= 2 ** 30
	) {
		throw new Error("INVALID_HASHING_PARAMETER");
	}
}

export function generateEmergencyCode(
	algorithm: string,
	parameters: ScryptParameters,
): RecoveryCode {
	validateParameters(algorithm, parameters);
	if (parameters.u === 14 && parameters.r === 8 && parameters.p === 1) {
		return crypto.generateRecoveryCode();
	}
	// PSEC, version, algorithm, u, l, uint32 r, uint32 p, 16 random bytes.
	const bytes = new Uint8Array(32);
	bytes.set([0x50, 0x53, 0x45, 0x43, 1, 1, parameters.u!, 64]);
	const view = new DataView(bytes.buffer);
	view.setUint32(8, parameters.r!, false);
	view.setUint32(12, parameters.p!, false);
	bytes.set(crypto.randomBytes(16), 16);
	const hex = converter.toHex(bytes);
	const base58 = converter.toBase58(bytes);
	const chunks = helper.splitStringInChunks(base58, 11);
	return {
		bytes,
		hex,
		base58,
		words: converter.hexToWords(hex),
		base58_checksums: chunks
			.map((chunk) => chunk + crypto.getChecksum(chunk, 2))
			.join(""),
	};
}

export function getEmergencyCodeParameters(code: string) {
	const bytes = converter.fromBase58(code);
	if (bytes.length === 16) return { ...LEGACY_EMERGENCY_PARAMETERS };
	if (
		bytes.length !== 32 ||
		converter.toHex(bytes.subarray(0, 4)) !== "50534543" ||
		bytes[4] !== 1 ||
		bytes[5] !== 1
	) {
		throw new Error("INVALID_EMERGENCY_CODE");
	}
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const parameters = {
		u: bytes[6],
		l: bytes[7],
		r: view.getUint32(8, false),
		p: view.getUint32(12, false),
	};
	validateParameters("scrypt", parameters);
	return parameters;
}

export function emergencyCodeFromInput(input: string) {
	const chunks = helper.splitStringInChunks(input.replace(/[-\s]/g, ""), 13);
	if (
		!chunks.length ||
		!chunks.every((chunk) => crypto.recoveryPasswordChunkPassChecksum(chunk))
	) {
		throw new Error("INVALID_EMERGENCY_CODE");
	}
	const code = crypto.recoveryCodeStripChecksums(chunks.join(""));
	getEmergencyCodeParameters(code);
	return code;
}

export function emergencyCodeFromWords(input: string) {
	const words = input.trim().toLowerCase().split(/\s+/);
	if (words.length !== 12 && words.length !== 24) {
		throw new Error("INVALID_EMERGENCY_CODE");
	}
	const hex = converter.wordsToHex(words);
	if (converter.hexToWords(hex).join(" ") !== words.join(" ")) {
		throw new Error("INVALID_EMERGENCY_CODE");
	}
	const code = converter.hexToBase58(hex);
	getEmergencyCodeParameters(code);
	return code;
}
