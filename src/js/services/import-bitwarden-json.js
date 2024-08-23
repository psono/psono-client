/**
 * Service which handles the actual parsing of the exported JSON
 */

import * as OTPAuth from "otpauth";
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";

/**
 * Analyzes an item and return its types
 *
 * @param {object} item The item to analyze
 */
function detect_type(item) {

    if (item["type"] === 1) {
        // real website password
        return "website_password";
    }
    if (item["type"] === 2) {
        // real note
        return "note";
    }
    if (item["type"] === 3) {
        // real credit card
        return "credit_card";
    }
    if (item["type"] === 4) {
        // actually an identity but we map it to a note
        return "note";
    }

    return "note";
}

/**
 * Checks whether the provided item contains in addition a totp code
 *
 * @param {object} item The item to analyze
 */
function containsTotp(item) {
    if (item.hasOwnProperty("login") && item["login"].hasOwnProperty("totp") && item["login"]["totp"] !== null) {
        return true;
    }
    return false;
}

/**
 * Takes an item and transforms it into a website password entry
 *
 * @param {[]} item One item of the json
 *
 * @returns {*} The secrets object
 */
function transformToWebsitePassword(item) {
    let name = "";
    let urlfilter = "";
    let website_password_url_filter = "";
    let website_password_password = "";
    let website_password_username = "";
    let website_password_notes = "";
    let website_password_url = "";
    let website_password_title = "";

    if (item.hasOwnProperty("name") && item["name"] !== null) {
        name = item["name"];
        website_password_title = item["name"];
    }
    if (item.hasOwnProperty("notes") && item["notes"] !== null) {
        website_password_notes = item["notes"];
    }
    if (item.hasOwnProperty("login") && item["login"] !== null) {
        if (item["login"].hasOwnProperty("username") && item["login"]["username"] !== null) {
            website_password_username = item["login"]["username"];
        }
        if (item["login"].hasOwnProperty("password") && item["login"]["password"] !== null) {
            website_password_password = item["login"]["password"];
        }
        if (item["login"].hasOwnProperty("uris") && item["login"]["uris"] !== null && item["login"]["uris"].length > 0) {
            website_password_url = item["login"]["uris"][0]["uri"];

            const parsed_url = helperService.parseUrl(website_password_url);
            if (parsed_url.authority !== null) {
                urlfilter = parsed_url.authority;
                website_password_url_filter = parsed_url.authority;
            }
        }
    }

    if (item.hasOwnProperty("fields") && item["fields"] !== null) {
        for (let i = 0; i < item["fields"].length; i++) {
            website_password_notes =
                    website_password_notes + item["fields"][i]["name"] + ": " + item["fields"][i]["value"] + "\n";
        }
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "website_password",
        name: name,
        description : website_password_username,
        urlfilter: urlfilter,
        website_password_url_filter: website_password_url_filter,
        website_password_password: website_password_password,
        website_password_username: website_password_username,
        website_password_notes: website_password_notes,
        website_password_url: website_password_url,
        website_password_title: website_password_title,
    };
}


/**
 * Takes an item and transforms it into a note
 *
 * @param {[]} item One item of the json
 *
 * @returns {*} The secrets object
 */
function transformToNote(item) {
    let name = "";
    let note_notes = "";
    let note_title = "";

    if (item.hasOwnProperty("name") && item["name"] !== null) {
        name = item["name"];
        note_title = item["name"];
    }

    if (item.hasOwnProperty("notes") && item["notes"] !== null && item["notes"] !== "") {
        note_notes = item["notes"] + "\n";
    }


    if (item.hasOwnProperty("fields") && item["fields"] !== null) {
        for (let i = 0; i < item["fields"].length; i++) {
            note_notes = note_notes + item["fields"][i]["name"] + ": " + item["fields"][i]["value"] + "\n";
        }
    }

    if (item.hasOwnProperty("card") && item["card"] !== null) {
        note_notes = note_notes + "Name" + ": " + item["card"]["valuecardholderName"] + "\n";
        note_notes = note_notes + "Brand" + ": " + item["card"]["brand"] + "\n";
        note_notes = note_notes + "Number" + ": " + item["card"]["number"] + "\n";
        note_notes = note_notes + "Month" + ": " + item["card"]["expMonth"] + "\n";
        note_notes = note_notes + "Year" + ": " + item["card"]["expYear"] + "\n";
        note_notes = note_notes + "Code" + ": " + item["card"]["code"] + "\n";
    }

    if (item.hasOwnProperty("identity") && item["identity"] !== null) {
        if (item["identity"]["title"] !== null) {
            note_notes = note_notes + "Title" + ": " + item["identity"]["title"] + "\n";
        }
        if (item["identity"]["firstName"] !== null) {
            note_notes = note_notes + "Firstname" + ": " + item["identity"]["firstName"] + "\n";
        }
        if (item["identity"]["middleName"] !== null) {
            note_notes = note_notes + "Middlename" + ": " + item["identity"]["middleName"] + "\n";
        }
        if (item["identity"]["lastName"] !== null) {
            note_notes = note_notes + "Lastname" + ": " + item["identity"]["lastName"] + "\n";
        }
        if (item["identity"]["address1"] !== null) {
            note_notes = note_notes + "Address1" + ": " + item["identity"]["address1"] + "\n";
        }
        if (item["identity"]["address2"] !== null) {
            note_notes = note_notes + "Address2" + ": " + item["identity"]["address2"] + "\n";
        }
        if (item["identity"]["address3"] !== null) {
            note_notes = note_notes + "Address3" + ": " + item["identity"]["address3"] + "\n";
        }
        if (item["identity"]["city"] !== null) {
            note_notes = note_notes + "City" + ": " + item["identity"]["city"] + "\n";
        }
        if (item["identity"]["state"] !== null) {
            note_notes = note_notes + "State" + ": " + item["identity"]["state"] + "\n";
        }
        if (item["identity"]["postalCode"] !== null) {
            note_notes = note_notes + "Postal Code" + ": " + item["identity"]["postalCode"] + "\n";
        }
        if (item["identity"]["country"] !== null) {
            note_notes = note_notes + "Country" + ": " + item["identity"]["country"] + "\n";
        }
        if (item["identity"]["company"] !== null) {
            note_notes = note_notes + "Company" + ": " + item["identity"]["company"] + "\n";
        }
        if (item["identity"]["email"] !== null) {
            note_notes = note_notes + "Email" + ": " + item["identity"]["email"] + "\n";
        }
        if (item["identity"]["phone"] !== null) {
            note_notes = note_notes + "Phone" + ": " + item["identity"]["phone"] + "\n";
        }
        if (item["identity"]["ssn"] !== null) {
            note_notes = note_notes + "SSN" + ": " + item["identity"]["ssn"] + "\n";
        }
        if (item["identity"]["username"] !== null) {
            note_notes = note_notes + "Username" + ": " + item["identity"]["username"] + "\n";
        }
        if (item["identity"]["passportNumber"] !== null) {
            note_notes = note_notes + "Passport Number" + ": " + item["identity"]["passportNumber"] + "\n";
        }
        if (item["identity"]["licenseNumber"] !== null) {
            note_notes = note_notes + "License Number" + ": " + item["identity"]["licenseNumber"] + "\n";
        }
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "note",
        name: name,
        note_notes: note_notes,
        note_title: note_title,
    };
}

/**
 * Takes a line that should represent a credit card and transforms it into a proper secret object
 *
 * @param {[]} item One item of the json
 *
 * @returns {*} The application_password secret object
 */
function transferIntoCreditCard(item) {
    let name = "";
    let credit_card_title = "";
    let credit_card_notes = "";
    let credit_card_name = "";
    let credit_card_number = "";
    let credit_card_pin = "";
    let credit_card_cvc = "";
    let credit_card_valid_through = "";

    if (item.hasOwnProperty("name") && item["name"] !== null) {
        name = item["name"];
        credit_card_title = item["name"];
    }

    if (item.hasOwnProperty("notes") && item["notes"] !== null) {
        credit_card_notes = item["notes"];
    }

    if (item.hasOwnProperty("card") && item['card'] !== null) {
        if (item['card'].hasOwnProperty("cardholderName") && item['card']["cardholderName"] !== null) {
            credit_card_name = item['card']["cardholderName"];
        }

        if (item['card'].hasOwnProperty("number") && item['card']["number"] !== null) {
            credit_card_number = item['card']["number"].replace(/\s/g,'');
        }

        if (item['card'].hasOwnProperty("number") && item['card']["expMonth"] !== null) {
            credit_card_valid_through = item['card']["expMonth"];
        }

        if (item['card'].hasOwnProperty("number") && item['card']["expYear"] !== null) {
            credit_card_valid_through = credit_card_valid_through + item['card']["expYear"].slice(-2);
        }

        if (item['card'].hasOwnProperty("number") && item['card']["expYear"] !== null) {
            credit_card_cvc = item['card']["code"];
        }
    }


    if (item.hasOwnProperty("fields") && item["fields"] !== null) {
        for (let i = 0; i < item["fields"].length; i++) {
            credit_card_notes = credit_card_notes + item["fields"][i]["name"] + ": " + item["fields"][i]["value"] + "\n";
        }
    }

    return {
        id : cryptoLibrary.generateUuid(),
        type : "credit_card",
        name : name,
        "description" : credit_card_number.replace(/.(?=.{4})/g, 'x'),
        "credit_card_number" : credit_card_number,
        "credit_card_name" : credit_card_name,
        "credit_card_cvc" : credit_card_cvc,
        "credit_card_valid_through" : credit_card_valid_through,
        "credit_card_pin" : credit_card_pin,
        "credit_card_notes" : credit_card_notes,
        "credit_card_title" : credit_card_title
    }
}

/**
 * Takes an item and transforms it into a note
 *
 * @param {[]} item One item of the json
 *
 * @returns {*} The secrets object
 */
function transformToTotpCode(item) {
    let name = "";
    let totp_notes = "";
    let totp_period = 30;
    let totp_algorithm = "SHA1";
    let totp_digits = "6";
    let totp_code = "";
    let totp_title = "";


    if (item.hasOwnProperty("name") && item["name"] !== null) {
        name = item["name"] + ' TOTP';
        totp_title = item["name"] + ' TOTP';
    }
    if (item.hasOwnProperty("login") && item["login"] !== null && item["login"].hasOwnProperty("totp") && item["login"]["totp"] !== null) {
        try {
            let parsedTotp = OTPAuth.URI.parse(item["login"]["totp"]);
            totp_period = parsedTotp.period;
            totp_algorithm = parsedTotp.algorithm;
            totp_digits = parsedTotp.digits;
            totp_code = parsedTotp.secret.base32;
        } catch (e) {
            // pass. Bitwarden is not enforcing an URL schema so people can actually store whatever they want here :(
        }
    }
    
    return {
        id: cryptoLibrary.generateUuid(),
        type: "totp",
        name: name,
        totp_notes: totp_notes,
        totp_code: totp_code,
        totp_digits: totp_digits,
        totp_algorithm: totp_algorithm,
        totp_period: totp_period,
        totp_title: totp_title,
    };
}

/**
 * Searches a given parsedData recursive and puts them all into the provided secrets array
 *
 * @param {object} datastore The datastore to fill
 * @param {[]} secrets The array containing all the found secrets
 * @param {object} parsedData The objects
 */
function gatherSecrets(datastore, secrets, parsedData) {
    let i;
    const folder_index = {};

    if (parsedData.hasOwnProperty("folders")) {
        for (i = 0; i < parsedData["folders"].length; i++) {
            folder_index[parsedData["folders"][i]["id"]] = {
                id: cryptoLibrary.generateUuid(),
                name: parsedData["folders"][i]["name"],
                items: [],
            };
        }
    }

    if (parsedData.hasOwnProperty("items")) {
        for (i = 0; i < parsedData["items"].length; i++) {
            const detected_type = detect_type(parsedData["items"][i]);
            const contains_totp_code = containsTotp(parsedData["items"][i]);

            const crafted_secrets = [];

            if (detected_type === "website_password") {
                crafted_secrets.push(transformToWebsitePassword(parsedData["items"][i]));
            } else if (detected_type === "credit_card") {
                crafted_secrets.push(transferIntoCreditCard(parsedData["items"][i]));
            } else {
                crafted_secrets.push(transformToNote(parsedData["items"][i]));
            }

            if (contains_totp_code) {
                crafted_secrets.push(transformToTotpCode(parsedData["items"][i]));
            }

            let parent_folder = null;
            if (parsedData["items"][i].hasOwnProperty("folderId") && parsedData["items"][i]["folderId"] !== null && folder_index.hasOwnProperty(parsedData["items"][i]["folderId"])) {
                parent_folder = folder_index[parsedData["items"][i]["folderId"]];
            }

            for (let iii = 0; iii < crafted_secrets.length; iii++) {
                if (parent_folder === null) {
                    datastore["items"].push(crafted_secrets[iii]);
                } else {
                    parent_folder["items"].push(crafted_secrets[iii]);
                }
                secrets.push(crafted_secrets[iii]);
            }
        }
    }

    for (let uuid in folder_index) {
        datastore["folders"].push(folder_index[uuid]);
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
function parser(data) {
    const d = new Date();
    const n = d.toISOString();

    const secrets = [];
    const datastore = {
        id: cryptoLibrary.generateUuid(),
        name: "Import " + n,
        folders: [],
        items: [],
    };

    let parsedData;
    try {
        parsedData = JSON.parse(data);
    } catch (err) {
        return null;
    }

    gatherSecrets(datastore, secrets, parsedData);

    return {
        datastore: datastore,
        secrets: secrets,
    };
}

const importEnpassJsonService = {
    parser,
};

export default importEnpassJsonService;
