/**
 * Service to handle all secret related tasks
 */

import i18n from "../i18n";
import apiClient from "../services/api-client";
import browserClient from "../services/browser-client";
import cryptoLibrary from "../services/crypto-library";
import offlineCache from "../services/offline-cache";
import deviceService from "./device";
import notification from "./notification";
import storage from "./storage";
import { getStore } from "./store";

/**
 * Encrypts the content and creates a new secret out of it.
 *
 * @param {array} objects The content of the new secret
 * @param {uuid|undefined} [parentDatastoreId] (optional) The id of the parent datastore, may be left empty if the share resides in a share
 * @param {uuid|undefined} [parentShareId] (optional) The id of the parent share, may be left empty if the share resides in the datastore
 *
 * @returns {Promise} Returns a promise with a list of dictionaries with the new secret_id and provided link_ids
 */
function createSecretBulk(objects, parentDatastoreId, parentShareId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const encryptionKeyLookup = {};

    const bulkObjects = objects.map(function(o) {

        const secretKey = cryptoLibrary.generateSecretKey();
        encryptionKeyLookup[o.linkId] = secretKey;
        const jsonContent = JSON.stringify(o.content);

        const c = cryptoLibrary.encryptData(jsonContent, secretKey);

        return {
            'data': c.text,
            'data_nonce': c.nonce,
            'link_id': o.linkId,
            'callback_url': o.callbackUrl,
            'callback_user': o.callbackUser,
            'callback_pass': o.callbackPass,
        }
    })


    const onError = function (result) {
        return Promise.reject(result);
    };

    const onSuccess = function (response) {
        return response.data.secrets.map(function(s) {
            return { secret_id: s.secret_id, secret_key: encryptionKeyLookup[s.link_id], link_id: s.link_id }
        })
    };

    return apiClient
        .createSecretBulk(
            token,
            sessionSecretKey,
            bulkObjects,
            parentDatastoreId,
            parentShareId
        )
        .then(onSuccess, onError);
}
/**
 * Encrypts the content and creates a new secret out of it.
 *
 * @param {object} content The content of the new secret
 * @param {uuid} linkId the local id of the share in the data structure
 * @param {uuid|undefined} [parentDatastoreId] (optional) The id of the parent datastore, may be left empty if the share resides in a share
 * @param {uuid|undefined} [parentShareId] (optional) The id of the parent share, may be left empty if the share resides in the datastore
 * @param {string} callbackUrl The callback ULR
 * @param {string} callbackUser The callback user
 * @param {string} callbackPass The callback password
 *
 * @returns {Promise} Returns a promise with the new secret_id
 */
function createSecret(content, linkId, parentDatastoreId, parentShareId, callbackUrl, callbackUser, callbackPass) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const secretKey = cryptoLibrary.generateSecretKey();

    const jsonContent = JSON.stringify(content);

    const c = cryptoLibrary.encryptData(jsonContent, secretKey);

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (response) {
        return { secret_id: response.data.secret_id, secret_key: secretKey };
    };

    return apiClient
        .createSecret(
            token,
            sessionSecretKey,
            c.text,
            c.nonce,
            linkId,
            parentDatastoreId,
            parentShareId,
            callbackUrl,
            callbackUser,
            callbackPass
        )
        .then(onSuccess, onError);
}

/**
 * Reads a secret and decrypts it. Returns the decrypted object
 *
 * @param {uuid} secretId The secret id one wants to fetch
 * @param {string} secretKey The secret key to decrypt the content
 *
 * @returns {Promise} Returns a promise withe decrypted content of the secret
 */
function readSecret(secretId, secretKey) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onError = function (result) {
        return Promise.reject(result);
    };

    const onSuccess = function (content) {
        const secret = JSON.parse(cryptoLibrary.decryptData(content.data.data, content.data.data_nonce, secretKey));
        if (content.data) {
            secret["read_count"] = content.data["read_count"];
        }
        secret["create_date"] = content.data["create_date"];
        secret["write_date"] = content.data["write_date"];
        secret["callback_url"] = content.data["callback_url"];
        secret["callback_user"] = content.data["callback_user"];
        secret["callback_pass"] = content.data["callback_pass"];
        return secret;
    };
    return apiClient.readSecret(token, sessionSecretKey, secretId).then(onSuccess, onError);
}

/**
 * Encrypts some content and updates a secret with it. returns the secret id
 *
 * @param {uuid} secretId The id of the secret
 * @param {string} secretKey The secret key of the secret
 * @param {object} content The new content for the given secret
 * @param {string} callbackUrl The callback ULR
 * @param {string} callbackUser The callback user
 * @param {string} callbackPass The callback password
 *
 * @returns {Promise} Returns a promise with the secret id
 */
function writeSecret(secretId, secretKey, content, callbackUrl, callbackUser, callbackPass) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const jsonContent = JSON.stringify(content);

    const c = cryptoLibrary.encryptData(jsonContent, secretKey);

    const onError = function (result) {
        console.log(result);
    };

    const onSuccess = function (response) {
        return { secret_id: response.data.secret_id };
    };

    return apiClient
        .writeSecret(token, sessionSecretKey, secretId, c.text, c.nonce, callbackUrl, callbackUser, callbackPass)
        .then(onSuccess, onError);
}

/**
 * Fetches and decrypts a secret and initiates the redirect for the secret
 *
 * @param {string} type The type of the secret
 * @param {uuid} secretId The id of the secret to read
 */
function redirectSecret(type, secretId) {
    return storage.findKey("datastore-password-leafs", secretId).then(function (leaf) {
        if (leaf === null) {
            return;
        }
        const onError = function (result) {
            // pass
        };

        const onSuccess = function (content) {
            if (type === "website_password") {
                browserClient.emitSec("fillpassword", {
                    username: content.website_password_username,
                    password: content.website_password_password,
                    totp_token: content.website_password_totp_code ? cryptoLibrary.getTotpToken(
                        content.website_password_totp_code,
                        content.website_password_totp_period,
                        content.website_password_totp_algorithm,
                        content.website_password_totp_digits,
                    ): "",
                    url_filter: content.website_password_url_filter,
                    auto_submit: content.website_password_auto_submit,
                });

                let url = content.website_password_url;

                if (!url.includes("://")) {
                    url = 'https://' + url;
                }
                window.location.href = url;
            } else if (type === "bookmark") {

                let url = content.bookmark_url;

                if (!url.includes("://")) {
                    url = 'https://' + url;
                }
                window.location.href = url;
            } else if (type === "elster_certificate") {
                browserClient.emitSec("fillelstercertificate", {
                    elster_certificate_title: content.elster_certificate_title,
                    elster_certificate_file_content: content.elster_certificate_file_content,
                    elster_certificate_password: content.elster_certificate_password,
                });
                window.location.href = "https://www.elster.de/eportal/login/softpse";
            } else {
                window.location.href = "index.html#!/datastore/search/" + secretId;
            }
        };

        return readSecret(secretId, leaf.secret_key).then(onSuccess, onError);
    });
}

/**
 * Handles item clicks and triggers redirects for website passwords and bookmarks
 *
 * @param {object} item The item one has clicked on
 */
function onItemClick(item) {
    if (
        ["website_password", "bookmark", "elster_certificate"].indexOf(item.type) !== -1
    ) {
        if (deviceService.isElectron()) {
            readSecret(item.secret_id, item.secret_key).then((content) => {
                if (item.type === "website_password") {
                    browserClient.openTab(content.website_password_url);
                } else if (item.type === "bookmark") {
                    browserClient.openTab(content.bookmark_url);
                } else if (item.type === "elster_certificate") {
                    browserClient.openTab("https://www.elster.de/eportal/login/softpse");
                }
            });
        } else {
            browserClient.openTab("open-secret.html#!/secret/" + item.type + "/" + item.secret_id).then(function (window) {
                window.psono_offline_cache_encryption_key = offlineCache.getEncryptionKey();
            });
        }
    }
}

/**
 * Copies the username of a given secret to the clipboard
 *
 * @param {object} item The item of which we want to load the username into our clipboard
 */
function copyUsername(item) {
    if (item["type"] === "application_password") {
        browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => decryptedSecret["application_password_username"]));
    } else if (item["type"] === "website_password") {
        browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => decryptedSecret["website_password_username"]));
    }

    notification.push("username_copy", i18n.t("USERNAME_COPY_NOTIFICATION"));
}

/**
 * Copies the password of a given secret to the clipboard
 *
 * @param {object} item The item of which we want to load the password into our clipboard
 */
function copyPassword(item) {
    if (item["type"] === "application_password") {
        browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => decryptedSecret["application_password_password"]));
    } else if (item["type"] === "website_password") {
        browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => decryptedSecret["website_password_password"]));
    }

    notification.push("password_copy", i18n.t("PASSWORD_COPY_NOTIFICATION"));
}

/**
 * Copies the password of a given secret to the clipboard
 *
 * @param {object} item The item of which we want to load the password into our clipboard
 */
function copyUrl(item) {

    if (item["type"] === "website_password") {
        browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => decryptedSecret["website_password_url"]));
    } else if (item["type"] === "bookmark") {
        browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => decryptedSecret["bookmark_url"]));
    }

    notification.push("password_copy", i18n.t("URL_COPY_NOTIFICATION"));
}

/**
 * Copies the TOTP token of a given secret to the clipboard
 *
 * @param {object} item The item of which we want to load the TOTP token into our clipboard
 */
function copyTotpToken(item) {
    browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => {
        let totpPeriod, totpAlgorithm, totpDigits, totpCode;
        if (item["type"] === "website_password") {
            totpCode = decryptedSecret["website_password_totp_code"];
            if (decryptedSecret.hasOwnProperty("website_password_totp_period")) {
                totpPeriod = decryptedSecret["website_password_totp_period"];
            }
            if (decryptedSecret.hasOwnProperty("website_password_totp_algorithm")) {
                totpAlgorithm = decryptedSecret["website_password_totp_algorithm"];
            }
            if (decryptedSecret.hasOwnProperty("website_password_totp_digits")) {
                totpDigits = decryptedSecret["website_password_totp_digits"];
            }
        } else if (item["type"]  === "totp") {
            totpCode = decryptedSecret["totp_code"];
            if (decryptedSecret.hasOwnProperty("totp_period")) {
                totpPeriod = decryptedSecret["totp_period"];
            }
            if (decryptedSecret.hasOwnProperty("totp_algorithm")) {
                totpAlgorithm = decryptedSecret["totp_algorithm"];
            }
            if (decryptedSecret.hasOwnProperty("totp_digits")) {
                totpDigits = decryptedSecret["totp_digits"];
            }

        }
        if (!totpCode) {
            return '';
        }
        return cryptoLibrary.getTotpToken(totpCode, totpPeriod, totpAlgorithm, totpDigits)
    }));
    notification.push("totp_token_copy", i18n.t("TOTP_TOKEN_COPY_NOTIFICATION"));
}

/**
 * Copies the note content of a given secret to the clipboard
 * 
 * @param {object} item The item of which we want to load the note content into our clipboard
 */
function copyNoteContent(item) {
    browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => decryptedSecret["note_notes"].replace(/\\n/g, "\n")));
    notification.push("note_content_copy", i18n.t("NOTE_CONTENT_COPY_NOTIFICATION"));
}

/**
 * Copies the credit card number of a given secret to the clipboard
 * 
 * @param {object} item The item of which we want to load the credit card number into our clipboard
 */
function copyCreditCardNumber(item) {
    browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => decryptedSecret["credit_card_number"]));
    notification.push("credit_card_number_copy", i18n.t("CREDIT_CARD_NUMBER_COPY_NOTIFICATION"));
}

/**
 * Copies the credit card name of a given secret to the clipboard
 * 
 * @param {object} item The item of which we want to load the credit card name into our clipboard
 */
function copyCreditCardName(item) {
    browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => decryptedSecret["credit_card_name"]));
    notification.push("credit_card_name_copy", i18n.t("CREDIT_CARD_NAME_COPY_NOTIFICATION"));
}

/**
 * Copies the credit card expiry date of a given secret to the clipboard
 * 
 * @param {object} item The item of which we want to load the credit card expiry date into our clipboard
 */
function copyCreditCardExpiryDate(item) {
    browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => decryptedSecret["credit_card_valid_through"]));
    notification.push("credit_card_expiry_date_copy", i18n.t("CREDIT_CARD_EXPIRATION_DATE_COPY_NOTIFICATION"));
}

/**
 * Copies the credit card CVC of a given secret to the clipboard
 * 
 * @param {object} item The item of which we want to load the credit card CVC into our clipboard
 */
function copyCreditCardCvc(item) {
    browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => decryptedSecret["credit_card_cvc"]));
    notification.push("credit_card_cvc_copy", i18n.t("CREDIT_CARD_CVC_COPY_NOTIFICATION"));
}

/**
 * Copies the credit card PIN of a given secret to the clipboard
 * 
 * @param {object} item The item of which we want to load the credit card PIN into our clipboard
 */
function copyCreditCardPin(item) {
    browserClient.copyToClipboard(() => readSecret(item.secret_id, item.secret_key).then((decryptedSecret) => decryptedSecret["credit_card_pin"]));
    notification.push("credit_card_pin_copy", i18n.t("CREDIT_CARD_PIN_COPY_NOTIFICATION"));
}

const secretService = {
    createSecretBulk: createSecretBulk,
    createSecret: createSecret,
    readSecret: readSecret,
    writeSecret: writeSecret,
    redirectSecret: redirectSecret,
    onItemClick: onItemClick,
    copyUsername: copyUsername,
    copyPassword: copyPassword,
    copyTotpToken: copyTotpToken,
    copyNoteContent: copyNoteContent,
    copyCreditCardNumber: copyCreditCardNumber,
    copyCreditCardName: copyCreditCardName,
    copyCreditCardExpiryDate: copyCreditCardExpiryDate,
    copyCreditCardCvc: copyCreditCardCvc,
    copyCreditCardPin: copyCreditCardPin,
    copyUrl: copyUrl,
};

export default secretService;
