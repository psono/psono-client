/**
 * Service to manage security reports
 */

import datastoreUserService from "./datastore-user";
import exportService from "./export";
import datastoreService from "./datastore";
import statusService from "./status";
import cryptoLibrary from "./crypto-library";
import apiClient from "./api-client";
import { getStore } from "./store";
import apiPwnedpasswordsService from "./api-pwnedpasswords";

const registrations = {};
let masterpassword = "";
let haveibeenpwned = false;

/**
 * used to register functions for specific events
 *
 * @param {string} event The event to subscribe to
 * @param {function} func The callback function to subscribe
 */
function on(event, func) {
    // pass through all export listeners
    if (["get-secret-started", "get-secret-complete"].indexOf(event) >= 0) {
        return exportService.on(event, func);
    }

    if (!registrations.hasOwnProperty(event)) {
        registrations[event] = [];
    }

    registrations[event].push(func);
}

/**
 * sends an event message to the export service
 *
 * @param {string} event The event to trigger
 * @param {*} data The payload data to send to the subscribed callback functions
 */
function emit(event, data) {
    if (!registrations.hasOwnProperty(event)) {
        return;
    }
    for (let i = registrations[event].length - 1; i >= 0; i--) {
        registrations[event][i](data);
    }
}

/**
 * Creates the rating for a given secret
 *
 * @param {*} secret The secret to rate
 *
 * @returns {object} Returns the rating with a score [0-100] and the advice regarding what to improve
 */
function rateSecret(secret) {
    const _MIN_PASSWORD_LENGTH = 11;
    const _MAX_PASSWORD_LENGTH = 16;
    const _MIN_VARIATION_ENFORCE_PASSWORD_LENGTH = 15;
    const _MIN_VARIATION_LENGTH = 3;
    const _VARIATION_PENALTY = 0.15;
    const _MAX_SCORE = 100;
    const _MIN_SCORE = 0;

    // inspired by https://stackoverflow.com/questions/948172/password-strength-meter
    const variations = {
        digits: /\d/.test(secret.password),
        lower: /[a-z]/.test(secret.password),
        upper: /[A-Z]/.test(secret.password),
        nonWords: /\W/.test(secret.password),
    };
    let variation_count = 0;
    for (let check in variations) {
        variation_count += variations[check] === true ? 1 : 0;
    }

    if (!secret.password) {
        // empty password
        return {
            score: _MAX_SCORE,
            advice: "",
            password_length: 0,
            variation_count: 0,
        };
    }

    if (secret.password.length <= _MIN_PASSWORD_LENGTH) {
        return {
            score: _MIN_SCORE,
            advice: "SET_LONGER_PASSWORD",
            password_length: secret.password.length,
            variation_count: variation_count,
            min_password_length: _MIN_PASSWORD_LENGTH,
        };
    }

    if (
        secret.username &&
        secret.username !== "" &&
        secret.password.toLowerCase().indexOf(secret.username.toLowerCase()) !== -1
    ) {
        return {
            score: 0,
            advice: "REMOVE_USERNAME_FROM_PASSWORD",
            password_length: secret.password.length,
            variation_count: variation_count,
        };
    }

    if (secret.password.length >= _MAX_PASSWORD_LENGTH) {
        return {
            score: _MAX_SCORE,
            advice: "",
            password_length: secret.password.length,
            variation_count: variation_count,
            max_password_length: _MAX_PASSWORD_LENGTH,
        };
    }

    const score =
        ((secret.password.length - _MIN_PASSWORD_LENGTH) * _MAX_SCORE) / (_MAX_PASSWORD_LENGTH - _MIN_PASSWORD_LENGTH);

    if (secret.password.length <= _MIN_VARIATION_ENFORCE_PASSWORD_LENGTH && variation_count < _MIN_VARIATION_LENGTH) {
        return {
            score:
                Math.round(
                    Math.max(
                        Math.min(
                            score * (1 - (_MIN_VARIATION_LENGTH - variation_count) * _VARIATION_PENALTY),
                            _MAX_SCORE
                        ),
                        _MIN_SCORE
                    ) * 10
                ) / 10,
            advice: "SET_LONGER_OR_MORE_COMPLEX_PASSWORD",
            password_length: secret.password.length,
            variation_count: variation_count,
        };
    }

    return {
        score: Math.round(Math.max(Math.min(score, _MAX_SCORE), _MIN_SCORE) * 10) / 10,
        advice: "SET_LONGER_PASSWORD_10",
        password_length: secret.password.length,
        variation_count: variation_count,
    };
}

/**
 * Little helper functions that will filter a folder object recursive and fills all found website passwords
 * into the provided passwords array
 *
 * @param {object} folder The folder to filter
 * @param {Array} passwords The array into which all passwords should be put in
 */
function filterPasswordsHelper(folder, passwords) {
    let i;
    if (folder.hasOwnProperty("deleted") && folder["deleted"]) {
        // skip all deleted folders
        return;
    }

    for (i = 0; folder.hasOwnProperty("items") && i < folder["items"].length; i++) {
        if (
            folder["items"][i]["type"] !== "website_password" &&
            folder["items"][i]["type"] !== "application_password" &&
            folder["items"][i]["type"] !== "elster_certificate"
        ) {
            continue;
        }
        if (!folder["items"][i].hasOwnProperty("create_date")) {
            // we have no copy from the server, this usually means we received a 403
            continue;
        }
        if (folder["items"][i].hasOwnProperty("deleted") && folder["items"][i]["deleted"]) {
            // skip all deleted items
            continue;
        }

        if (folder["items"][i]["type"] === "application_password") {
            passwords.push({
                type: folder["items"][i]["type"],
                name: folder["items"][i]["name"],
                secret_id: folder["items"][i]["secret_id"],
                username: folder["items"][i]["application_password_username"],
                password: folder["items"][i]["application_password_password"],
                create_date: folder["items"][i]["create_date"],
                write_date: folder["items"][i]["write_date"],
                master_password: false,
            });
        } else if (folder["items"][i]["type"] === "website_password")  {
            passwords.push({
                type: folder["items"][i]["type"],
                name: folder["items"][i]["name"],
                secret_id: folder["items"][i]["secret_id"],
                username: folder["items"][i]["website_password_username"],
                password: folder["items"][i]["website_password_password"],
                create_date: folder["items"][i]["create_date"],
                write_date: folder["items"][i]["write_date"],
                master_password: false,
            });
        } else if (folder["items"][i]["type"] === "elster_certificate")  {
            passwords.push({
                type: folder["items"][i]["type"],
                name: folder["items"][i]["name"],
                secret_id: folder["items"][i]["secret_id"],
                username: '',
                password: folder["items"][i]["elster_certificate_password"],
                create_date: folder["items"][i]["create_date"],
                write_date: folder["items"][i]["write_date"],
                master_password: false,
            });
        }
    }

    for (i = 0; folder.hasOwnProperty("folders") && i < folder["folders"].length; i++) {
        filterPasswordsHelper(folder["folders"][i], passwords);
    }
}

/**
 * Takes a datastore and returns an array of website passwords
 *
 * @param {Array} datastores A list of datastore to filter
 *
 * @returns {Array} Returns an array of website passwords
 */
function filterPasswords(datastores) {
    const passwords = [];

    for (let i = 0; i < datastores.length; i++) {
        filterPasswordsHelper(datastores[i], passwords);
    }

    if (masterpassword) {
        passwords.unshift({
            type: "master_password",
            name: "Master Password",
            password: masterpassword,
            master_password: true,
        });
    }

    return passwords;
}

/**
 * Takes an ISO formatted string and returns the days that have passed since then.
 *
 * @param {string} time_string Time as string in ISO formatting
 * @returns {number} Numbers of days that have passed since then
 */
function getAgeInDays(time_string) {
    if (typeof time_string === "undefined") {
        return 0;
    }
    const date1 = new Date(time_string);
    const date2 = new Date();
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());

    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Analyze all secrets in the datastore
 *
 * @param {object} secrets The secrets to analyze
 *
 * @returns {object} Returns the analysis of the passwords
 */
function analyzePasswordLength(secrets) {
    const analysis = {
        passwords: [],
    };
    let rating;

    emit("check-length-started", {});
    for (let i = 0; i < secrets.length; i++) {
        rating = rateSecret(secrets[i]);
        analysis.passwords.push({
            name: secrets[i]["name"],
            password: secrets[i]["password"],
            secret_id: secrets[i]["secret_id"],
            master_password: secrets[i]["master_password"],
            rating: rating["score"],
            min_password_length: rating["min_password_length"],
            password_length: rating["password_length"],
            variation_count: rating["variation_count"],
            breached: rating["breached"],
            type: secrets[i]["type"] || "website_password",
            input_type: "password",
            advice: rating["advice"],
            create_age: getAgeInDays(secrets[i]["create_date"]),
            write_age: getAgeInDays(secrets[i]["write_date"]),
            duplicate: false,
        });
    }
    emit("check-length-complete", {});
    return analysis;
}

/**
 * Analyze all secrets from the last analysis and check for duplicates
 *
 * @param {object} analysis The secrets to analyze
 *
 * @returns {object} Returns the analysis of the passwords
 */
function analyzePasswordDuplicates(analysis) {
    const lookupDict = {};

    emit("check-duplicate-started", {});
    for (let i = 0; i < analysis.passwords.length; i++) {
        if (analysis.passwords[i].password === "" || typeof analysis.passwords[i].password === "undefined") {
            continue;
        }
        if (lookupDict.hasOwnProperty(analysis.passwords[i].password)) {
            analysis.passwords[i].duplicate = true;
            lookupDict[analysis.passwords[i].password].duplicate = true;
            lookupDict[analysis.passwords[i].password].advice = "DO_NOT_USE_PASSWORDS_TWICE";
        } else {
            lookupDict[analysis.passwords[i].password] = analysis.passwords[i];
        }
    }

    emit("check-duplicate-complete", {});
    return analysis;
}

/**
 * Analyzes a single entry against the haveibeenpawned service
 *
 * @param entry
 */
function analyzeHaveibeenpwnedSingle(entry) {
    const passwordSha1 = cryptoLibrary.sha1(entry.password);
    const passwordSha1Prefix = passwordSha1.substring(0, 5).toLowerCase();
    const passwordSha1Suffix = passwordSha1.slice(5).toLowerCase();

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        const suffix_list = result.data.split("\n");
        for (let i = 0; i < suffix_list.length; i++) {
            const suffix = suffix_list[i].split(":");
            if (suffix[0].toLowerCase() !== passwordSha1Suffix) {
                continue;
            }
            entry.breached = suffix[1];
            entry.pwned = parseInt(entry.breached);
            if (entry.breached > 1) {
                entry.advice = "PASSWORD_HAS_BEEN_COMPROMISED_MULTIPLE_TIMES";
            } else {
                entry.advice = "PASSWORD_HAS_BEEN_COMPROMISED";
            }

            entry.rating = 0;

            return;
        }
        entry.breached = 0;
    };

    return apiPwnedpasswordsService.range(passwordSha1Prefix).then(onSuccess, onError);
}

/**
 * Analyze all secrets from the last analysis against the haveibeenpawned service
 *
 * @param {object} analysis The secrets to analyze
 *
 * @returns {object} Returns the analysis of the passwords
 */
function analyzeHaveibeenpwned(analysis) {
    let haveibeenpwnedResolver;

    if (!haveibeenpwned) {
        return analysis;
    }

    if (analysis.passwords.length === 0) {
        return analysis;
    }

    emit("check-haveibeenpwned-started", {});

    function littleHelper(index, password_list) {
        if (index >= password_list.length) {
            emit("check-haveibeenpwned-complete", {});
            return haveibeenpwnedResolver(analysis);
        }

        if (password_list[index].password === "" || typeof password_list[index].password === "undefined") {
            return littleHelper(index + 1, password_list);
        }

        const onError = function (result) {
            // pass
            setTimeout(function () {
                littleHelper(index, password_list);
            }, 10000);
        };

        const onSuccess = function (result) {
            emit("get-haveibeenpwned-complete", {});
            setTimeout(function () {
                littleHelper(index + 1, password_list);
            }, 250);
        };

        analyzeHaveibeenpwnedSingle(password_list[index]).then(onSuccess, onError);
    }

    return new Promise(function (resolve, reject) {
        haveibeenpwnedResolver = resolve;

        // we will not query in parallel due to rate limiting,
        // so we will fake the start of the requests here, and query every password one by one with a 1.6 seconds
        // delay in between
        for (let i = 0; i < analysis.passwords.length; i++) {
            const entry = analysis.passwords[i];
            if (entry.password === "" || typeof entry.password === "undefined") {
                continue;
            }
            emit("get-haveibeenpwned-started", {});
        }

        littleHelper(0, analysis.passwords);
    });
}

/**
 * Analyze all secrets from the last analysis and check for the password age
 *
 * @param {object} analysis The secrets to analyze
 *
 * @returns {object} Returns the analysis of the passwords
 */
function analyzePasswordAge(analysis) {
    emit("check-password-age-started", {});
    for (let i = 0; i < analysis.passwords.length; i++) {
        if (analysis.passwords[i].password === "") {
            continue;
        }
        if (analysis.passwords[i].write_age > 180) {
            analysis.passwords[i].advice = "ADVICE_PASSWORD_TOO_OLD";
        }
    }

    emit("check-password-age-complete", {});
    return analysis;
}

/**
 * Analyze all secrets from the last analysis and check for duplicates
 *
 * @param {object} analysis The secrets to analyze
 *
 * @returns {object} Returns the analysis of the passwords
 */
function summarizePassword(analysis) {
    analysis["password_summary"] = {
        total: 0,
        duplicate: 0,
        no_duplicate: 0,
        weak: 0,
        good: 0,
        strong: 0,
        average_rating: 0,
        average_update_age: 0,
        update_newer_than_90_days: 0,
        update_older_than_90_days: 0,
        update_older_than_180_days: 0,
    };

    emit("summarize-password-started", {});
    for (let i = 0; i < analysis.passwords.length; i++) {
        analysis["password_summary"]["total"]++;
        analysis["password_summary"]["average_rating"] += analysis.passwords[i].rating;
        analysis["password_summary"]["average_update_age"] += analysis.passwords[i].write_age;

        if (analysis.passwords[i].duplicate) {
            analysis["password_summary"]["duplicate"]++;
        } else {
            analysis["password_summary"]["no_duplicate"]++;
        }

        if (analysis.passwords[i].rating <= 40) {
            analysis["password_summary"]["weak"]++;
        } else if (analysis.passwords[i].rating < 80) {
            analysis["password_summary"]["good"]++;
        } else {
            analysis["password_summary"]["strong"]++;
        }

        if (analysis.passwords[i].write_age <= 90) {
            analysis["password_summary"]["update_newer_than_90_days"]++;
        } else if (analysis.passwords[i].write_age <= 180) {
            analysis["password_summary"]["update_older_than_90_days"]++;
        } else {
            analysis["password_summary"]["update_older_than_180_days"]++;
        }
    }

    //calculate average rating
    if (analysis["password_summary"]["total"]) {
        analysis["password_summary"]["average_rating"] =
            Math.round((analysis["password_summary"]["average_rating"] / analysis["password_summary"]["total"]) * 10) /
            10;
        analysis["password_summary"]["average_update_age"] = Math.round(
            analysis["password_summary"]["average_update_age"] / analysis["password_summary"]["total"]
        );
    } else {
        analysis["password_summary"]["average_rating"] = 0;
        analysis["password_summary"]["average_update_age"] = 0;
    }

    emit("summarize-password-complete", {});
    return analysis;
}

/**
 * Summarize password statistics
 *
 * @param {object} analysis The secrets to analyze
 *
 * @returns {object} Returns the analysis of the passwords
 */
function summarizeUser(analysis) {
    analysis["user_summary"] = {};

    emit("summarize-user-started", {});

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        const users = result.data;
        if (Object.prototype.toString.call(users) === "[object Array]") {
            users.map((user) => {
                if (user.username === getStore().getState().user.username) {
                    analysis["user_summary"]["multifactor_auth_enabled"] = user.multifactor_auth_enabled;
                    analysis["user_summary"]["recovery_code_enabled"] = user.recovery_code_enabled;
                }
            });
        } else {
            analysis["user_summary"]["multifactor_auth_enabled"] = users.multifactor_auth_enabled;
            analysis["user_summary"]["recovery_code_enabled"] = users.recovery_code_enabled;
        }
        emit("summarize-user-complete", {});
        return analysis;
    };

    return datastoreUserService.searchUser(getStore().getState().user.username).then(onSuccess, onError);

}

/**
 * Fetches all password datastores
 *
 * @returns {Promise} Returns a promise with the exportable datastore content of all datastores
 */
function fetchAllPasswordDatastores() {
    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        const all_calls = [];

        for (let i = 0; i < result.datastores.length; i++) {
            if (result.datastores[i].type !== "password") {
                continue;
            }
            all_calls.push(exportService.fetchDatastore(undefined, result.datastores[i].id, false, true));
        }
        return Promise.all(all_calls);
    };

    return datastoreService.getDatastoreOverview().then(onSuccess, onError);
}

/**
 * Fetches all secrets
 *
 * @returns {Promise} Returns a promise with the exportable datastore content
 */
function generateSecurityReport(password, checkHaveibeenpwned) {
    masterpassword = password;
    haveibeenpwned = checkHaveibeenpwned;

    emit("generation-started", {});

    return fetchAllPasswordDatastores()
        .then(filterPasswords)
        .then(analyzePasswordLength)
        .then(analyzePasswordAge)
        .then(analyzePasswordDuplicates)
        .then(analyzeHaveibeenpwned)
        .then(summarizePassword)
        .then(summarizeUser)
        .then(function (analysis) {
            emit("generation-complete", {});
            return {
                msgs: ["ANALYSIS_SUCCESSFUL"],
                analysis: analysis,
            };
        });
}

/**
 * Sends the report to the server
 *
 * @param {object} analysis The actual analysis
 * @param {boolean} checkHaveibeenpwned Whether haveibeenpwned was checked or not
 * @param {string}  masterPassword The master password
 *
 * @returns {Promise} Returns a promise to indicate the success of this or not
 */
function sendToServer(analysis, checkHaveibeenpwned, masterPassword) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const username = getStore().getState().user.username;
    const hashingAlgorithm = getStore().getState().user.hashingAlgorithm;
    const hashingParameters = getStore().getState().user.hashingParameters;

    const entries = [];

    const authkey = cryptoLibrary.generateAuthkey(
        username,
        masterPassword,
        hashingAlgorithm,
        hashingParameters,
    );

    for (let i = 0; i < analysis["passwords"].length; i++) {
        entries.push({
            name: analysis["passwords"][i].name,
            master_password: analysis["passwords"][i].master_password,
            rating: analysis["passwords"][i].rating,
            password_length: analysis["passwords"][i].password_length,
            variation_count: analysis["passwords"][i].variation_count,
            breached: analysis["passwords"][i].breached,
            type: analysis["passwords"][i].type,
            input_type: analysis["passwords"][i].input_type,
            duplicate: analysis["passwords"][i].duplicate,
            create_age: analysis["passwords"][i].create_age,
            write_age: analysis["passwords"][i].write_age,
        });
    }

    const onError = function (result) {
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        statusService.getStatus(true);
        return result.data;
    };

    return apiClient
        .sendSecurityReport(token, sessionSecretKey, entries, checkHaveibeenpwned, authkey)
        .then(onSuccess, onError);
}

const securityReportService = {
    on: on,
    emit: emit,
    generateSecurityReport: generateSecurityReport,
    sendToServer: sendToServer,
};

export default securityReportService;
