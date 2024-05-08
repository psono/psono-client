/**
 * Service that is something like the base class for adf widgets
 */

import action from "../actions/bound-action-creators";
import apiClient from "./api-client";
import offlineCache from "./offline-cache";
import { getStore } from "./store";
import storage from "./storage";

const validTill = 300000; // in ms, 300000 = 300s = 5min
const intervalTime = 30000; // in ms, 30000 = 30s

activate();

function activate() {
    setInterval(getStatus, intervalTime);
}
/**
 * Queries the server for the current status of the user if the local cached status is outdated.
 *
 * @param {boolean} [forceFresh] Whether a fresh result should be fetched or a cache will do fine
 *
 * @returns {Promise} Returns a promise with the current status
 */
function getStatus(forceFresh) {
    const isLoggedIn = getStore().getState().user.isLoggedIn;
    const isOffline = offlineCache.isActive();

    if (!isLoggedIn) {
        return Promise.resolve({
            data: {},
        });
    }

    if (isOffline) {
        return Promise.resolve({
            data: {},
        });
    }

    return storage.findKey("various", "server-status").then(function (oldServerStatus) {
        const token = getStore().getState().user.token;
        const sessionSecretKey = getStore().getState().user.sessionSecretKey;
        const now = new Date();
        const timestamp = now.getTime();
        const serverStatusOutdated =
            (typeof forceFresh !== "undefined" && forceFresh === true) ||
            oldServerStatus === null ||
            !oldServerStatus.value ||
            oldServerStatus.value.valid_till < timestamp;
        const serverStatusInStateOutdated =
            !serverStatusOutdated &&
            (!getStore().getState().server.status.valid_till ||
                getStore().getState().server.status.valid_till !== oldServerStatus.value.valid_till);

        if (!serverStatusOutdated) {
            if (serverStatusInStateOutdated) {
                action().setServerStatus(oldServerStatus.value);
            }

            return Promise.resolve(oldServerStatus.value);
        }

        const onError = function (result) {
            // pass
        };

        const onSuccess = function (content) {
            const newServerStatus = {
                data: content.data,
                valid_till: timestamp + validTill - 10,
            };

            action().setServerStatus(newServerStatus);
            storage.upsert("various", { key: "server-status", value: newServerStatus });

            return newServerStatus;
        };

        return apiClient.readStatus(token, sessionSecretKey).then(onSuccess, onError);
    });
}

const statusService = {
    getStatus: getStatus,
};
export default statusService;
