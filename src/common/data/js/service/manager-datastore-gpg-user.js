(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerDatastoreGPGUser
     * @requires $q
     * @requires psonocli.storage
     * @requires psonocli.helper
     * @requires psonocli.managerBase
     * @requires psonocli.managerDatastore
     *
     * @description
     * Service to manage the setting datastore
     */

    var managerDatastoreGPGUser = function($q, storage, helper, managerBase, managerDatastore, openpgp) {

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreGPGUser#get_gpg_user_datastore
         * @methodOf psonocli.managerDatastoreGPGUser
         *
         * @description
         * Returns the settings datastore.
         *
         * @returns {promise} Returns the settings datastore
         */
        var get_gpg_user_datastore = function() {
            var type = "gpg-user";
            var description = "default";

            var onSuccess = function (datastore) {
                managerDatastore.update_paths_recursive(datastore, []);
                return datastore
            };
            var onError = function () {
                // pass
            };

            return managerDatastore.get_datastore(type)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreGPGUser#handle_datastore_content_changed
         * @methodOf psonocli.managerDatastoreGPGUser
         *
         * @description
         * Updates the local storage and triggers the 'save_datastore_content' to reflect the changes
         *
         * @param {TreeObject} datastore The datastore tree
         */
        var handle_datastore_content_changed = function (datastore) {
            // don't do anything
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreGPGUser#save_datastore_content
         * @methodOf psonocli.managerDatastoreGPGUser
         *
         * @description
         * Saves the gpg user datastore with given content
         *
         * @param {TreeObject} content The real object you want to encrypt in the datastore
         * @returns {promise} Promise with the status of the save
         */
        var save_datastore_content = function (content) {
            var type = "gpg-user";
            var description = "default";

            content = managerBase.filter_datastore_content(content);

            return managerDatastore.save_datastore_content(type, description, content)
        };

        var _search_for_email = function(datastore, email) {

            var searched_user;

            managerDatastore.filter(datastore, function(user) {
                if (user.email === email) {
                    searched_user=user;
                }
            });

            return searched_user;
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreGPGUser#add_user
         * @methodOf psonocli.managerDatastoreGPGUser
         *
         * @description
         * Adds a user to the datastore
         *
         * @param {object} user The user object to add
         *
         * @returns {promise} Promise with the status of the save
         */
        var add_user = function (user) {

            if (!user.hasOwnProperty('email')) {
                return $q.reject({
                    'error': 'User has no email address.'
                })
            }

            if (!user.hasOwnProperty('id')) {
                return $q.reject({
                    'error': 'User has no id.'
                })
            }
            for (var i = 0; i < user.public_keys.length; i++) {

                var key = openpgp.key.readArmored(user.public_keys[i]).keys[0];

                if (!key) {
                    return $q.reject({
                        'error': 'Invalid Fingerprint.'
                    })
                }
            }

            user.email = user.email.toLowerCase();


            var onSuccess = function (datastore) {
                var need_write = false;
                var ds_user = _search_for_email(datastore, user.email);
                if (ds_user) {
                    need_write = _add_public_key(ds_user, user.public_keys);
                } else {
                    if (!datastore.hasOwnProperty('items')) {
                        datastore['items'] = [];
                    }
                    need_write = true;

                    ds_user = {
                        id: user.id,
                        email: user.email,
                        public_keys: user.public_keys,
                        default_public_key: user.default_public_key || ''
                    };

                    datastore['items'].push(ds_user);
                }

                if (need_write) {
                    _update_default_public_key(ds_user);
                    save_datastore_content(datastore);
                }

                return ds_user
            };
            var onError = function () {
                // pass
            };

            return get_gpg_user_datastore()
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreGPGUser#_update_default_public_key
         * @methodOf psonocli.managerDatastoreGPGUser
         *
         * @description
         * Updates the default public key
         *
         * @param {object} user The user object to add
         *
         * @returns {boolean} whether the user was changed or not
         */
        var _update_default_public_key = function (user) {

            if (user.public_keys.length > 0) {
                if (user.default_public_key) {
                    var key1 = openpgp.key.readArmored(user.default_public_key).keys[0];
                    var found = false;
                    for (var k = 0; k < user.public_keys.length; k++) {
                        var key2 = openpgp.key.readArmored(user.public_keys[k]).keys[0];
                        if (key1.primaryKey.fingerprint !== key2.primaryKey.fingerprint) {
                            found = true;
                        }
                    }
                    if (!found) {
                        user.default_public_key = user.public_keys[0];
                    }
                } else {
                    user.default_public_key = user.public_keys[0];
                }
            } else {
                user.default_public_key = '';
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreGPGUser#_add_public_key
         * @methodOf psonocli.managerDatastoreGPGUser
         *
         * @description
         * Adds public keys to a user
         *
         * @param {object} user The user object to add
         * @param {array} public_keys The list of public keys to add
         *
         * @returns {boolean} whether the user was changed or not
         */
        var _add_public_key = function (user, public_keys) {

            var need_write = false;

            for (var j = 0; j < public_keys.length; j++) {
                var found = false;
                var key = openpgp.key.readArmored(public_keys[j]).keys[0];
                for (var i = 0; i < user.public_keys.length; i++) {
                    var ds_key = openpgp.key.readArmored(user.public_keys[i]).keys[0];
                    if (ds_key.primaryKey.fingerprint !== key.primaryKey.fingerprint) {
                        continue;
                    }
                    found = true;
                    break;
                }
                if (! found) {
                    need_write = true;
                    user.public_keys.push(public_keys[j])
                }
            }

            if (need_write) {
                _update_default_public_key(user);
            }

            return need_write;
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreGPGUser#add_public_key
         * @methodOf psonocli.managerDatastoreGPGUser
         *
         * @description
         * Adds public keys to a user
         *
         * @param {object} user The user object to add
         * @param {array} public_keys The list of public keys to add
         *
         * @returns {promise} Promise weather the user object has been modified or not
         */
        var add_public_key = function (user, public_keys) {

            var onSuccess = function (datastore) {

                var ds_user = _search_for_email(datastore, user.email);

                if (!ds_user) {
                    return {
                        'error': 'User not found.'
                    }
                }

                var need_write = _add_public_key(ds_user, public_keys);

                if (need_write) {
                    save_datastore_content(datastore);
                }
                return ds_user;

            };
            var onError = function () {
                // pass
            };

            return get_gpg_user_datastore()
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreGPGUser#_remove_public_key
         * @methodOf psonocli.managerDatastoreGPGUser
         *
         * @description
         * Removes public keys of a user
         *
         * @param {object} user The user object
         * @param {array} public_keys The list of public keys to remove
         *
         * @returns {boolean} whether the user was changed or not
         */
        var _remove_public_key = function (user, public_keys) {

            var need_write = false;

            for (var j = 0; j < public_keys.length; j++) {
                var key = openpgp.key.readArmored(public_keys[j]).keys[0];
                for(var i = user.public_keys.length - 1; i >= 0; i--) {
                    var ds_key = openpgp.key.readArmored(user.public_keys[i]).keys[0];
                    if (ds_key.primaryKey.fingerprint !== key.primaryKey.fingerprint) {
                        continue;
                    }
                    user.public_keys.splice(i, 1);
                    need_write = true;
                }
            }

            if (need_write) {
                _update_default_public_key(user);
            }

            return need_write;
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreGPGUser#remove_public_key
         * @methodOf psonocli.managerDatastoreGPGUser
         *
         * @description
         * Removes public keys of a user
         *
         * @param {object} user The user object to add
         * @param {array} public_keys The list of public keys to add
         *
         * @returns {promise} Promise weather the user object has been modified or not
         */
        var remove_public_key = function (user, public_keys) {

            var onSuccess = function (datastore) {
                var ds_user = _search_for_email(datastore, user.email);

                if (!ds_user) {
                    return $q.reject({
                        'error': 'User not found.'
                    })
                }

                var need_write = _remove_public_key(ds_user, public_keys);
                if (need_write) {
                    save_datastore_content(datastore);
                }
                return ds_user;

            };
            var onError = function () {
                // pass
            };

            return get_gpg_user_datastore()
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreGPGUser#delete_user
         * @methodOf psonocli.managerDatastoreGPGUser
         *
         * @description
         * Deöete a user from the datastore
         *
         * @param {object} user The user object to delete
         *
         * @returns {promise} Promise with the status of the save
         */
        var delete_user = function (user) {

            var onSuccess = function (datastore) {

                function delete_item_recursive(datastore, id) {
                    var n, l;
                    if (datastore.hasOwnProperty('items')) {
                        helper.remove_from_array(datastore.items, id, function(a, b) {
                            return a.id === id;
                        })
                    }

                    if (datastore.hasOwnProperty('folders')) {
                        for (n = 0, l = datastore.folders.length; n < l; n++) {
                            delete_item_recursive(datastore.folders[n], id)
                        }
                    }
                }

                delete_item_recursive(datastore, user.id);
                return save_datastore_content(datastore);

            };
            var onError = function () {
                // pass
            };

            return get_gpg_user_datastore()
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreGPGUser#delete_user
         * @methodOf psonocli.managerDatastoreGPGUser
         *
         * @description
         * Deöete a user from the datastore
         *
         * @param {object} user The user object to delete
         * @param {string} public_key The public key
         *
         * @returns {promise} Promise with the status of the save
         */
        var choose_as_default_key = function (user, public_key) {

            var onSuccess = function (datastore) {

                var ds_user = _search_for_email(datastore, user.email);

                _add_public_key(ds_user, [public_key]);
                ds_user.default_public_key = public_key;

                save_datastore_content(datastore);
                return ds_user;

            };
            var onError = function () {
                // pass
            };

            return get_gpg_user_datastore()
                .then(onSuccess, onError);
        };



        return {
            get_gpg_user_datastore: get_gpg_user_datastore,
            handle_datastore_content_changed: handle_datastore_content_changed,
            save_datastore_content: save_datastore_content,
            add_user: add_user,
            delete_user: delete_user,
            add_public_key: add_public_key,
            remove_public_key: remove_public_key,
            choose_as_default_key: choose_as_default_key
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerDatastoreGPGUser", ['$q', 'storage', 'helper', 'managerBase', 'managerDatastore', 'openpgp', managerDatastoreGPGUser]);

}(angular));