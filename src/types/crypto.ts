/** Hex-encoded ciphertext and its independently generated nonce. */
export interface EncryptedValue {
	text: string;
	nonce: string;
}

/** NaCl box keys, each encoded as 32 bytes of hexadecimal. */
export interface PublicPrivateKeyPair {
	public_key: string;
	private_key: string;
}

export interface ScryptParameters {
	u?: number;
	r?: number;
	p?: number;
	l?: number;
}

export interface OfflineCacheEncryptionKey extends EncryptedValue {
	hashingAlgorithm?: string;
	hashingParameters?: ScryptParameters;
}

export interface RecoveryCode {
	bytes: Uint8Array<ArrayBuffer>;
	hex: string;
	words: string[];
	base58: string;
	base58_checksums: string;
}

export type TotpAlgorithm = "SHA1" | "SHA256" | "SHA512";

/** Only ordinary ArrayBuffers can be transferred to the crypto worker. */
export interface CryptoWorkerJobs {
	encrypt_file: { data: ArrayBuffer; k: ArrayBuffer; n: ArrayBuffer };
	decrypt_file: { text: ArrayBuffer; k: ArrayBuffer };
}
