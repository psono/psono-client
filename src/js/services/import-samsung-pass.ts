/** Samsung Pass .spass format documented by NHClaessens/samsung_pass_converter. */
import * as OTPAuth from "otpauth";
import converter from "./converter";
import cryptoLibrary from "./crypto-library";
import helper from "./helper";
import type { ImportedSecret, ImportResult } from "../../types/import";

function decodeField(value: string): string {
	if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0)
		return value;
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(
			converter.base64ToArrayBuffer(value),
		);
	} catch (_) {
		return value;
	}
}

async function decrypt(data: string, password: string): Promise<string | null> {
	const encoded = data.replace(/\s/g, "");
	if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length % 4 !== 0)
		return null;
	const bytes = new Uint8Array(converter.base64ToArrayBuffer(encoded));
	if (bytes.length < 52 || (bytes.length - 36) % 16 !== 0) return null;
	try {
		const material = await crypto.subtle.importKey(
			"raw",
			new TextEncoder().encode(password),
			"PBKDF2",
			false,
			["deriveKey"],
		);
		const key = await crypto.subtle.deriveKey(
			{
				name: "PBKDF2",
				salt: bytes.slice(0, 20),
				iterations: 70000,
				hash: "SHA-256",
			},
			material,
			{ name: "AES-CBC", length: 256 },
			false,
			["decrypt"],
		);
		const plaintext = await crypto.subtle.decrypt(
			{ name: "AES-CBC", iv: bytes.slice(20, 36) },
			key,
			bytes.slice(36),
		);
		return new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
	} catch (_) {
		throw { errors: ["DECRYPTION_OF_EXPORT_FAILED_WRONG_PASSWORD"] };
	}
}

async function parser(
	data: string,
	_binary?: ArrayBuffer,
	password = "",
): Promise<ImportResult | null> {
	// The reference converter also accepts already decrypted tables with no password.
	const text =
		!password && data.split(/\r\n|[\n\r]/).includes("next_table")
			? data
			: await decrypt(data, password);
	if (text === null) return null;
	const secrets: ImportedSecret[] = [];
	let headers: string[] | null = null;
	let expectingHeaders = false;
	let foundCredentials = false;
	for (const line of text.split(/\r\n|[\n\r]/)) {
		if (line === "next_table") {
			headers = null;
			expectingHeaders = true;
			continue;
		}
		if (expectingHeaders) {
			headers = line.split(";");
			expectingHeaders = false;
			foundCredentials ||=
				headers.includes("username_value") ||
				headers.includes("password_value");
			continue;
		}
		if (!line) {
			headers = null;
			continue;
		}
		if (
			!headers ||
			!(
				headers.includes("username_value") || headers.includes("password_value")
			)
		)
			continue;
		const fields = line.split(";");
		if (fields.length !== headers.length) continue;
		const row = Object.fromEntries(
			headers.map((key, i) => [key, decodeField(fields[i])]),
		);
		const get = (key: string) =>
			row[key] === "&&&NULL&&&" ? "" : (row[key] ?? "");
		const url = get("origin_url");
		const filter = helper.parseUrl(url).authority ?? "";
		const secret: ImportedSecret = {
			id: cryptoLibrary.generateUuid(),
			type: "website_password",
			name: get("title"),
			description: get("username_value"),
			urlfilter: filter,
			website_password_title: get("title"),
			website_password_url: url,
			website_password_url_filter: filter,
			website_password_username: get("username_value"),
			website_password_password: get("password_value"),
			website_password_notes: get("credential_memo"),
			custom_fields: [],
		};
		const totp = get("otp");
		if (totp) {
			try {
				const value = totp.trim();
				const otp = value.startsWith("otpauth://")
					? OTPAuth.URI.parse(value)
					: new OTPAuth.TOTP({
							secret: value.replace(/\s/g, "").toUpperCase(),
						});
				if (!(otp instanceof OTPAuth.TOTP) || !otp.secret.base32)
					throw new Error("Invalid TOTP");
				secret.website_password_totp_code = otp.secret.base32;
				secret.website_password_totp_algorithm = otp.algorithm;
				secret.website_password_totp_digits = otp.digits;
				secret.website_password_totp_period = otp.period;
			} catch (_) {
				const notes = secret.website_password_notes || "";
				secret.website_password_notes =
					notes +
					(notes && !notes.endsWith("\n") ? "\n" : "") +
					"TOTP: " +
					totp;
			}
		}
		secrets.push(secret);
	}
	if (!foundCredentials) return null;
	return {
		datastore: {
			id: cryptoLibrary.generateUuid(),
			name: "Import " + new Date().toISOString(),
			folders: [],
			items: secrets,
		},
		secrets,
	};
}

export default { parser };
