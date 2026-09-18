/**
 * Service which handles the parsing of the KeePass.info XML exports
 */
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";

import { XMLParser } from "fast-xml-parser";
import type {
	ImportedSecret,
	ImportResult,
	ImportTreeFolder,
} from "../../types/import";

interface KeePassEntry {
	String?: { Key?: string; Value?: string }[];
	Tags?: string;
}

interface KeePassGroup {
	Name?: string;
	Entry?: KeePassEntry | KeePassEntry[];
	Group?: KeePassGroup | KeePassGroup[];
}

interface KeePassDocument {
	KeePassFile?: { Root?: { Group?: KeePassGroup } };
}

function unescapeValue(value: string) {
	value = value.toString();
	value = value.replace(/&lt;/g, "<");
	value = value.replace(/&gt;/g, ">");
	value = value.replace(/&amp;/g, "&");

	return value;
}

/**
 * Takes a line and transforms it into a password entry
 *
 * @param {[]} line One line of the XML
 *
 * @returns {*} The secrets object
 */
function transformToSecret(line: KeePassEntry): ImportedSecret | null {
	if (!Object.hasOwn(line, "String") || !line.String) {
		return null;
	}
	const secret: ImportedSecret = {
		id: cryptoLibrary.generateUuid(),
		type: "website_password",
		name: "",
		urlfilter: "",
		website_password_url_filter: "",
		website_password_password: "",
		website_password_username: "",
		website_password_notes: "",
		website_password_url: "",
		website_password_title: "",
	};

	if (Object.hasOwn(line, "Tags") && line.Tags) {
		secret["tags"] = line.Tags.split(",");
	}

	for (let i = 0; i < line.String.length; i++) {
		const value = line.String[i];
		if (value.Key === undefined) {
			continue;
		}
		if (value.Value === undefined) {
			continue;
		}
		const key = value["Key"];
		const val = unescapeValue(value["Value"]);

		if (key === "Notes") {
			secret["website_password_notes"] = val;
		} else if (key === "Password") {
			secret["website_password_password"] = val;
		} else if (key === "Title") {
			secret["name"] = val;
			secret["website_password_title"] = val;
		} else if (key === "URL") {
			const parsed_url = helperService.parseUrl(val);
			secret["urlfilter"] = parsed_url.authority || "";
			secret["website_password_url_filter"] = parsed_url.authority || "";
			secret["website_password_url"] = val;
		} else if (key === "UserName") {
			secret["website_password_username"] = val;
			secret["description"] = val;
		} else {
			if (!secret.custom_fields) {
				secret["custom_fields"] = [];
			}
			secret["custom_fields"].push({
				name: key,
				type: "password",
				value: val,
			});
		}
	}

	return secret;
}

/**
 * Fills the datastore with folders their content and together with the secrets object
 *
 * @param {object} datastore The datastore structure to search recursive
 * @param {[]} secrets The array containing all the found secrets
 * @param {Document} xml The parsed XML document
 */
function gatherSecrets(
	datastore: ImportTreeFolder,
	secrets: ImportedSecret[],
	xml: KeePassGroup,
) {
	if (xml.Entry) {
		const entries = Array.isArray(xml.Entry) ? xml.Entry : [xml.Entry];
		for (const entry of entries) {
			const secret = transformToSecret(entry);
			if (secret === null) {
				//empty line
				continue;
			}
			datastore["items"].push(secret);
			secrets.push(secret);
		}
	}

	if (xml.Group) {
		const groups = Array.isArray(xml.Group) ? xml.Group : [xml.Group];
		for (const group of groups) {
			if (!Object.hasOwn(group, "Name")) {
				continue;
			}
			const next_folder: ImportTreeFolder = {
				id: cryptoLibrary.generateUuid(),
				name: group.Name,
				folders: [],
				items: [],
			};
			gatherSecrets(next_folder, secrets, group);
			datastore["folders"].push(next_folder);
		}
	}
}

/**
 * Parse the raw data into an xml Document object
 *
 * Source: https://stackoverflow.com/a/20294226/4582775
 *
 * @param {string} xmlString The raw data to parse
 * @returns {object} The array of arrays representing the XML
 */
function parseXml(xmlString: string): KeePassGroup {
	const parser = new XMLParser({ parseTagValue: false });
	const parsedXml: KeePassDocument = parser.parse(xmlString);
	const group = parsedXml.KeePassFile?.Root?.Group;
	if (!group) {
		throw new Error("Error parsing XML");
	}
	return group;
}

/**
 * The main function of this parser. Will take the content of the JSON export of a psono.pw client and will
 * return the usual output of a parser (or null):
 *     {
 *         datastore: {
 *             name: 'Import TIMESTAMP'
 *         },
 *         secrets: Array
 *     }
 *
 * @param {string} data The JSON export of a psono.pw client
 *
 * @returns {{datastore, secrets: Array} | null}
 */
function parser(data: string): ImportResult<ImportTreeFolder> | null {
	const d = new Date();
	const n = d.toISOString();

	const secrets: ImportedSecret[] = [];
	const datastore: ImportTreeFolder = {
		id: cryptoLibrary.generateUuid(),
		name: "Import " + n,
		items: [],
		folders: [],
	};

	let xml;
	try {
		xml = parseXml(data);
	} catch (err) {
		return null;
	}

	gatherSecrets(datastore, secrets, xml);

	return {
		datastore: datastore,
		secrets: secrets,
	};
}

const importKeepassInfoXmlService = {
	parser,
};

export default importKeepassInfoXmlService;
