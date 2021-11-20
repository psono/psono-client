/**
 * Service that handles local storage access
 */
const registrations = {};

//const loki_storage = new loki("password_manager_local_storage");
const dbs = [];

const db_config = {
    'config': {
        name: 'config',
        indices: ['key'],
        uniques: ['key']
    },
    'persistent': {
        name: 'persistent',
        indices: ['key'],
        uniques: ['key']
    },
    'settings': {
        name: 'settings',
        indices: ['key'],
        uniques: ['key']
    },
    'offline-cache': {
        name: 'offline-cache',
        indices: ['key'],
        uniques: ['key']
    },
    'datastore-password-leafs': {
        name: 'datastore-password-leafs',
        indices: ['key', 'urlfilter', 'name'],
        uniques: ['key']
    },
    'datastore-file-leafs': {
        name: 'datastore-file-leafs',
        indices: ['key'],
        uniques: ['key']
    },
    'datastore-user-leafs': {
        name: 'datastore-user-leafs',
        indices: ['key', 'filter', 'name'],
        uniques: ['key'],
        subscribers: {
            update: {
                current: 0,
                max: 1
            },
            insert: {
                current: 0,
                max: 1
            },
            delete: {
                current: 0,
                max: 1
            }
        }
    }
};

activate();

function activate() {
    reload();
}

/**
 * sets one or more items in the specified db
 *
 * @param {string} db The database
 * @param {object|Array} items One or multiple items to put into the database
 */
function insert(db, items) {

    //return dbs[db].insert(items);
}

/**
 * updates one or more items in the specified db
 *
 * @param {string} db The database
 * @param {object|Array} items One or multiple items to update in the database
 */
function update(db, items) {
    //return dbs[db].update(items);
}

/**
 * inserts or updates one or more items in the specified db.
 * CAUTION: Poor performance. Use direct insert and update wherever possible, especially if you big arrays of items
 *
 * @param {string} db The database
 * @param {object|Array} items One or multiple items to update in the database
 */
function upsert(db, items) {
    // let local_items, db_entry;
    // const return_values = [];
    //
    // if (! (items instanceof Array)) {
    //     local_items = [items]
    // } else {
    //     local_items = items
    // }
    // for (let i = 0; i < local_items.length; i++) {
    //     db_entry = dbs[db].findOne({'key': local_items[i]['key']});
    //
    //     if (db_entry!== null) {
    //         db_entry.value = local_items[i]['value'];
    //         return_values.push(dbs[db].update(db_entry));
    //     } else {
    //         return_values.push(dbs[db].insert(local_items[i]));
    //     }
    // }
    //
    // if (items instanceof Array) {
    //     return return_values[0];
    // } else {
    //     return return_values;
    // }
}

/**
 * Searches for multiple entries and filter according to a function
 *
 * @param {string} db The database
 * @param {object|Array} filter_function The filter function
 */
function where(db, filter_function) {
    //return dbs[db].where(filter_function);
}


/**
 * returns the result matching the key
 *
 * @param {string} db The database
 * @param {object} key The key of the object
 *
 * @returns {object|null} Returns the data object
 */
function findKey(db, key) {
    //return dbs[db].findOne({key: key});
}

/**
 * returns if a specified item exists
 *
 * @param {string} db The database
 * @param {object} key The key of the object
 *
 * @returns {boolean} Returns whether the specified key already exists.
 */
function keyExists(db, key) {
    //return dbs[db].findOne({'key': key}) !== null;
}

/**
 * removes the specified object or object_id
 *
 * @param {string} db The database
 * @param {object} obj The data object
 */
function remove(db, obj) {
    //dbs[db].remove(obj);
}

/**
 * removes all objects in all dbs (excluding the persistent one) or only in the specified one
 *
 * @param {string} [db] (optional) The database
 */
function removeAll(db) {
    // if (typeof db !== 'undefined') {
    //     dbs[db].removeWhere(function() {
    //         return true;
    //     })
    // } else {
    //
    //     for (let db_name in dbs) {
    //         if (!dbs.hasOwnProperty(db_name)) {
    //             continue;
    //         }
    //         if (db_name === 'persistent') {
    //             continue;
    //         }
    //         dbs[db_name].removeWhere(function() {
    //             return true;
    //         })
    //
    //     }
    // }

}

/**
 * setups an event listener on an event
 *
 * @param {string} db The database
 * @param {string} event The event to listen to
 * @param {function} callback The callback function
 */
function on(db, event, callback) {

    // if (!db_config.hasOwnProperty(db)) {
    //     return;
    // }
    // if (db_config[db].hasOwnProperty('subscribers') &&
    //     db_config[db]['subscribers'].hasOwnProperty(event) &&
    //     db_config[db]['subscribers'] &&
    //     db_config[db]['subscribers']['current'] >= db_config[db]['subscribers']['max']) {
    //
    //     console.log("already reached maximum subscribers");
    //     return;
    // }
    //
    // dbs[db].on(event, callback);
}

/**
 * saves the database, needs to be triggered once some changes are meant to be made persistent
 */
function save() {
    //loki_storage.save();
    emit("storage-reload", null);
}

/**
 * Reloads the storage
 */
function reload() {
    // loki_storage.loadDatabase({}, function () {
    //
    //     for (let db_name in db_config) {
    //         if (!db_config.hasOwnProperty(db_name)) {
    //             continue;
    //         }
    //
    //         dbs[db_name] = loki_storage.getCollection(db_name);
    //
    //         if (dbs[db_name] === null) {
    //             dbs[db_name] = loki_storage.addCollection(db_name, { indices: db_config[db_name].indices});
    //             for (let t = 0; t < db_config[db_name].uniques.length; t++) {
    //                 dbs[db_name].ensureUniqueIndex(db_config[db_name].uniques[t]);
    //             }
    //         }
    //     }
    // });
}

/**
 * used to register functions to bypass circular dependencies
 *
 * @param {string} key The key of the function (usually the function name)
 * @param {function} func The call back function
 */
function register(key, func) {
    if (!registrations.hasOwnProperty(key)) {
        registrations[key] = [];
    }
    registrations[key].push(func);
}

/**
 * Small wrapper to execute all functions that have been registered for an event once the event is triggered
 *
 * @param {string} key The key of the event
 * @param {*} payload The payload of the event
 */
function emit(key, payload) {
    if (registrations.hasOwnProperty(key)) {
        for (let i = 0; i < registrations[key].length; i++) {
            registrations[key][i](payload);
        }
    }
}

const service = {
    insert: insert,
    update: update,
    upsert: upsert,
    where: where,
    findKey: findKey,
    keyExists: keyExists,
    remove: remove,
    removeAll: removeAll,
    on: on,
    save: save,
    reload: reload,
    register: register,
    emit: emit
};
export default service;