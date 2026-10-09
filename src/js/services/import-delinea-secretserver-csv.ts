/** Parses Delinea SecretServer CSV exports. */
import * as OTPAuth from "otpauth";
import Papa from "papaparse";
import type {
	CsvRow,
	ImportedSecret,
	ImportResult,
	ImportTreeFolder,
} from "../../types/import";
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";

function getFolder(root: ImportTreeFolder, path: string): ImportTreeFolder {
	let folder = root;
	for (const name of path.split("\\").filter((part) => part !== "")) {
		let child = folder.folders.find((candidate) => candidate.name === name);
		if (!child) {
			child = {
				id: cryptoLibrary.generateUuid(),
				name,
				folders: [],
				items: [],
			};
			folder.folders.push(child);
		}
		folder = child;
	}
	return folder;
}

function parseTotp(value: string): OTPAuth.TOTP | null {
	if (!value.trim()) return null;
	try {
		const key = value.trim();
		if (key.startsWith("otpauth://")) {
			const otp = OTPAuth.URI.parse(key);
			return otp instanceof OTPAuth.TOTP && otp.secret.base32 ? otp : null;
		}
		if (!/^[A-Z2-7]+=*$/i.test(key)) return null;
		const otp = new OTPAuth.TOTP({ secret: key.toUpperCase() });
		return otp.secret.base32 ? otp : null;
	} catch (_) {
		return null;
	}
}

function parser(data: string): ImportResult<ImportTreeFolder> | null {
	const csv = Papa.parse<CsvRow>(data, {
		delimiter: ",",
		skipEmptyLines: "greedy",
	});
	if (csv.errors.length || !csv.data.length) return null;

	const headers = csv.data[0].map((header) =>
		header
			.replace(/^\uFEFF/, "")
			.trim()
			.toLowerCase(),
	);
	const required = ["secret name", "username", "url", "password"];
	if (required.some((header) => !headers.includes(header))) return null;

	const datastore: ImportTreeFolder = {
		id: cryptoLibrary.generateUuid(),
		name: "Import " + new Date().toISOString(),
		folders: [],
		items: [],
	};
	const secrets: ImportedSecret[] = [];
	const mapped = new Set([
		...required,
		"notes",
		"folder",
		"date created",
		"expires",
	]);

	for (const row of csv.data.slice(1)) {
		if (
			row.length > headers.length ||
			required.some((header) => headers.indexOf(header) >= row.length)
		) {
			return null;
		}
		const field = (name: string) => row[headers.indexOf(name)] || "";
		const name = field("secret name");
		const username = field("username");
		const password = field("password");
		const url = field("url");
		const totp = parseTotp(field("totp key"));
		const notes = [field("notes")];
		for (let index = 0; index < headers.length; index++) {
			if (
				!mapped.has(headers[index]) &&
				!(headers[index] === "totp key" && totp) &&
				row[index]
			) {
				notes.push(`${csv.data[0][index].trim()}: ${row[index]}`);
			}
		}
		const note = notes.filter((value) => value !== "").join("\n");
		const id = cryptoLibrary.generateUuid();
		let secret: ImportedSecret | null;
		if (url) {
			const authority = helperService.parseUrl(url).authority || undefined;
			if (username || password) {
				secret = {
					id,
					type: "website_password",
					name,
					description: username,
					urlfilter: authority,
					website_password_title: name,
					website_password_username: username,
					website_password_password: password,
					website_password_url: url,
					website_password_url_filter: authority,
					website_password_notes: note,
				};
			} else {
				secret = {
					id,
					type: "bookmark",
					name,
					urlfilter: authority,
					bookmark_title: name,
					bookmark_url: url,
					bookmark_url_filter: authority,
					bookmark_notes: note,
				};
			}
		} else if (username || password) {
			secret = {
				id,
				type: "application_password",
				name,
				description: username,
				application_password_title: name,
				application_password_username: username,
				application_password_password: password,
				application_password_notes: note,
			};
		} else {
			if (!name && !note && !totp) continue;
			secret =
				name || note
					? { id, type: "note", name, note_title: name, note_notes: note }
					: null;
		}

		const folder = getFolder(datastore, field("folder"));
		if (secret) {
			folder.items.push(secret);
			secrets.push(secret);
		}
		if (totp) {
			if (secret?.type === "website_password") {
				secret.website_password_totp_code = totp.secret.base32;
				secret.website_password_totp_algorithm = totp.algorithm;
				secret.website_password_totp_digits = totp.digits;
				secret.website_password_totp_period = totp.period;
			} else {
				const title = name + " TOTP";
				const entry: ImportedSecret = {
					id: cryptoLibrary.generateUuid(),
					type: "totp",
					name: title,
					totp_title: title,
					totp_notes: field("totp backup codes"),
					totp_code: totp.secret.base32,
					totp_algorithm: totp.algorithm,
					totp_digits: totp.digits,
					totp_period: totp.period,
				};
				folder.items.push(entry);
				secrets.push(entry);
			}
		}
	}
	return { datastore, secrets };
}

export default { parser };
