/**
 * Service which handles the actual parsing of the exported JSON
 */
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";
import itemBlueprintService from "./item-blueprint";
import type {
	ExportFolder,
	ImportedFolder,
	ImportedSecret,
	ImportResult,
} from "../../types/import";

/**
 * Searches a given folder recursive inclusive all sub-folders and puts them all into the provided secrets array
 *
 * @param {object} folder The folder structure to search recursive
 * @param {[]} secrets The array containing all the found secrets
 */
function gather_secrets(folder: ExportFolder, secrets: ImportedSecret[]) {
	let i;
	let subitem;

	folder["id"] = cryptoLibrary.generateUuid();

	if (folder.folders) {
		for (i = 0; i < folder["folders"].length; i++) {
			gather_secrets(folder["folders"][i], secrets);
		}
	}

	const entryTypes = new Set<string>(
		itemBlueprintService.getEntryTypes().map((t) => t.value),
	);

	if (folder.items) {
		for (i = 0; i < folder["items"].length; i++) {
			subitem = folder["items"][i];
			if (!subitem.type || !entryTypes.has(subitem.type)) {
				continue;
			}

			subitem["id"] = cryptoLibrary.generateUuid();

			// The id and supported type have been established above; keep the
			// original object so the datastore and bulk-secret list stay linked.
			secrets.push(subitem as ImportedSecret);
		}
	}
}

/**
 * Takes a list of secrets and validates that they are correctly formatted
 *
 * @param {[]} secrets The array containing all the found secrets
 */
function validate_secrets(secrets: ImportedSecret[]) {
	for (const secret of secrets) {
		if (secret.type === "website_password" && secret.website_password_url) {
			const parsedUrl = helperService.parseUrl(secret.website_password_url);
			secret.urlfilter ||= parsedUrl.authority || "";
			secret.website_password_url_filter ||= parsedUrl.authority || "";
		}
		if (secret.type === "bookmark" && secret.bookmark_url) {
			const parsedUrl = helperService.parseUrl(secret.bookmark_url);
			secret.urlfilter ||= parsedUrl.authority || "";
			secret.bookmark_url_filter ||= parsedUrl.authority || "";
		}
	}
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
function parser(data: string): ImportResult | null {
	let datastore: ExportFolder;
	try {
		datastore = JSON.parse(data);
	} catch (err) {
		return null;
	}
	const secrets: ImportedSecret[] = [];

	const d = new Date();
	const n = d.toISOString();
	datastore["name"] = "Import " + n;

	gather_secrets(datastore, secrets);
	validate_secrets(secrets);

	return {
		datastore: datastore as ImportedFolder,
		secrets: secrets,
	};
}

const importPsonoJsonService = {
	parser,
};

export default importPsonoJsonService;
