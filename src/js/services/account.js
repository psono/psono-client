import localforage from "localforage";
import cryptoLibrary from "./crypto-library";
import action from "../actions/bound-action-creators";
import storage from "./storage";
import apiClient from "./api-client";
const channel = new BroadcastChannel("account");

const defaultId = "client";
const activeAccountKey = 'activeAccount';

const activeAccountStorageDb = localforage.createInstance({
    name: 'activeaccount', // Database name
});

// Create a specific instance for Redux state persistence settings
const allAccountsDb = localforage.createInstance({
    name: 'allAccounts', // Database name
});

/**
 * Returns the id of the current active account
 * @returns {Promise<unknown>}
 */
async function getCurrentId() {
    try {
        const persistKey = await activeAccountStorageDb.getItem(activeAccountKey);
        return persistKey || defaultId;
    } catch (error) {
        return defaultId;
    }
}

function listAccounts() {
    return new Promise(async function (resolve, reject) {
        const currentActiveId = await getCurrentId();
        const allAccountsList = []
        let currentAccountFound;
        allAccountsDb.iterate(function (info, id, iterationNumber) {
            allAccountsList.push({
                'id': id,
                'info': info,
                'active': id === currentActiveId,
            })
            if (id === currentActiveId) {
                currentAccountFound = true
            }
        }).then(function () {
            if (!currentAccountFound) {
                allAccountsList.push({
                    'id': currentActiveId,
                    'info': {},
                    'active': true,
                })
            }
            resolve(allAccountsList)
        }).catch(function (err) {
            console.log(err);
        });
    });
}

async function updateInfoCurrent(info) {
    const currentActiveId = await getCurrentId();
    await allAccountsDb.setItem(currentActiveId, info)
}

async function clearUnused() {
    const currentActiveId = await getCurrentId();
    const usedList = [];
    const toDelete = [];
    allAccountsDb.iterate(function (info, id, iterationNumber) {
        if (id === currentActiveId) {
            usedList.push(id);
            return;
        }
        if (info.hasOwnProperty('isLoggedIn') && info.isLoggedIn) {
            usedList.push(id);
            return;
        }
        toDelete.push(id);
    }).then(async function (result) {
        for (let i = 0; i < toDelete.length; i++) {
            await allAccountsDb.removeItem(toDelete[i]);
        }
        let usedSet = new Set(usedList);

        const stateKeys = await storage.keys("state");
        for (const key of stateKeys) {
            if (usedSet.has(key.split(':').pop())) {
                continue
            }
            storage.remove('state', key);
        }

    })
}

function broadcastReinitializeAppEvent() {
    channel.postMessage({
        'event': 'reinitialize-app',
        'data': null,
    });
}

async function updateCurrentId(id) {
    action().disableOfflineMode();
    storage.removeAll();
    storage.save();

    await activeAccountStorageDb.setItem(activeAccountKey, id);
    await clearUnused();

    broadcastReinitializeAppEvent()
}

async function addAccount() {
    await updateCurrentId(cryptoLibrary.generateUuid());
}

/**
 * Deletes an account from the local storage
 *
 * @param accountId
 * @returns {Promise<void>}
 */
async function deleteAccount(accountId) {
    await allAccountsDb.removeItem(accountId)
    return await storage.remove('state', 'persist:' + accountId);
}

async function logoutUser(accountId) {
    let state;
    try {
        state = JSON.parse(await storage.findKey("state", 'persist:' + accountId));
    } catch (error) {
        return;
    }

    let stateUser;
    try {
        stateUser = JSON.parse(state.user);
    } catch (error) {
        return;
    }

    let stateServer;
    try {
        stateServer = JSON.parse(state.server);
    } catch (error) {
        return;
    }
    let statePersistent;
    try {
        statePersistent = JSON.parse(state.persistent);
    } catch (error) {
        return;
    }
    const token = stateUser.token;
    const sessionSecretKey = stateUser.sessionSecretKey;
    const serverUrl = stateServer.url;
    const deviceFingerprint = statePersistent.fingerprint;

    try {
        await apiClient.statelessLogout(
            token, sessionSecretKey, undefined, undefined, serverUrl, deviceFingerprint
        )
    } catch (error) {
        console.log(error)
        return;
    }
}

/**
 * Logs a user out on the server and deletes all its locally stored state
 * @param accountId
 * @returns {Promise<void>}
 */
async function logout(accountId) {
    const currentActiveId = await getCurrentId();
    if (currentActiveId === accountId) {
        return
    }
    await logoutUser(accountId);
    await deleteAccount(accountId);
}

/**
 * Logs out a user on all sessions except the current active one.
 *
 * @returns {Promise<void>}
 */
async function logoutAll() {
    const currentActiveId = await getCurrentId();
    const toLogout = [];
    allAccountsDb.iterate(function (info, id, iterationNumber) {
        if (id === currentActiveId) {
            return;
        }
        toLogout.push(id);
    }).then(async function (result) {
        for (const accountId of toLogout) {
            await logoutUser(accountId);
            await deleteAccount(accountId);
        }
    })
}

const accountService = {
    getCurrentId: getCurrentId,
    listAccounts: listAccounts,
    updateCurrentId: updateCurrentId,
    updateInfoCurrent: updateInfoCurrent,
    addAccount: addAccount,
    broadcastReinitializeAppEvent: broadcastReinitializeAppEvent,
    logout: logout,
    logoutAll: logoutAll,
};

export default accountService;
