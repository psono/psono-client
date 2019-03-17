(function(angular, generate_password) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerDatastorePassword
     * @requires $q
     * @requires $rootScope
     * @requires psonocli.managerBase
     * @requires psonocli.managerSecret
     * @requires psonocli.managerShareLink
     * @requires psonocli.managerDatastore
     * @requires psonocli.managerShare
     * @requires psonocli.itemBlueprint
     * @requires psonocli.helper
     * @requires psonocli.settings
     * @requires psonocli.browserClient
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Service to manage the password datastore
     */

    var managerDatastorePassword = function($q, $rootScope, managerBase, managerSecret, managerShareLink, managerDatastore, managerShare, itemBlueprint, helper, settings, browserClient, cryptoLibrary) {

        var registrations = {};
        var _share_index = {};
        var password_datastore_read = false;

        var memorable = false;

        var uppercaseMinCount = 1;
        var lowercaseMinCount = 1;
        var numberMinCount = 1;
        var specialMinCount = 1;

        /**
         * checks if the given password complies with the minimal complexity
         *
         * @param password
         * @returns {*}
         */
        var is_strong_enough = function (password) {

            if (uppercaseMinCount + lowercaseMinCount + numberMinCount + specialMinCount > settings.get_setting('setting_password_length')) {
                //password can never comply, so we skip check
                return true;
            }

            var uc = password.match(new RegExp("(["+escape_reg_exp(settings.get_setting('setting_password_letters_uppercase'))+"])", "g"));
            var lc = password.match(new RegExp("(["+escape_reg_exp(settings.get_setting('setting_password_letters_lowercase'))+"])", "g"));
            var n = password.match(new RegExp("(["+escape_reg_exp(settings.get_setting('setting_password_numbers'))+"])", "g"));
            var sc = password.match(new RegExp("(["+escape_reg_exp(settings.get_setting('setting_password_special_chars'))+"])", "g"));

            return uc && (settings.get_setting('setting_password_letters_uppercase').length === 0 || uc.length >= uppercaseMinCount) &&
                lc && (settings.get_setting('setting_password_letters_lowercase').length === 0 || lc.length >= lowercaseMinCount) &&
                n && (settings.get_setting('setting_password_numbers').length === 0 || n.length >= numberMinCount) &&
                sc && (settings.get_setting('setting_password_special_chars').length === 0 || sc.length >= specialMinCount);
        };

        /**
         * escapes regex string
         *
         * @param str
         * @returns {*}
         */
        var escape_reg_exp = function (str) {
            // from sindresorhus/escape-string-regexp under MIT License

            if (typeof str !== 'string') {
                throw new TypeError('Expected a string');
            }

            return str.replace(new RegExp('[|\\\\{}()[\\]^$+*?.]', 'g'),  '\\$&');
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#generate
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Main function to generate a random password based on the specified settings.
         *
         * @returns {string} Returns the generated random password
         */
        var generate = function () {
            var password = "";
            while (!is_strong_enough(password)) {
                password = generate_password(settings.get_setting('setting_password_length'), memorable,
                    new RegExp('['+escape_reg_exp(settings.get_setting('setting_password_letters_uppercase') +
                        settings.get_setting('setting_password_letters_lowercase') +
                        settings.get_setting('setting_password_numbers') +
                        settings.get_setting('setting_password_special_chars'))+']'));
            }
            return password;
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#update_parents
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Sets the parent for folders and items, based on the obj and obj parents.
         * Calls recursive itself for all folders and skips nested shares
         *
         * @param {TreeObject} obj The tree object to update
         * @param {uuid} parent_share_id The id of the parent share
         * @param {uuid} parent_datastore_id The id of the parent datastore
         */
        var update_parents = function(obj, parent_share_id, parent_datastore_id) {
            var n;

            var new_parent_share_id = parent_share_id;
            var new_parent_datastore_id = parent_datastore_id;

            if (obj.hasOwnProperty('datastore_id')) {
                obj['parent_share_id'] = undefined;
                obj['parent_datastore_id'] = undefined;
                new_parent_share_id = undefined;
                new_parent_datastore_id = obj.datastore_id;
            } else if (obj.hasOwnProperty('share_id')) {
                obj['parent_share_id'] = parent_share_id;
                obj['parent_datastore_id'] = parent_datastore_id;
                new_parent_share_id = obj.share_id;
                new_parent_datastore_id = undefined;
            }

            // check all folders recursive
            if (obj.hasOwnProperty('folders')) {
                for (n = 0; n < obj.folders.length; n++) {
                    obj.folders[n]['parent_share_id'] = new_parent_share_id;
                    obj.folders[n]['parent_datastore_id'] = new_parent_datastore_id;

                    // lets not go inside of a new share, and dont touch the parents there
                    if (obj.folders[n].hasOwnProperty('share_id')) {
                        continue;
                    }
                    update_parents(obj.folders[n], new_parent_share_id, new_parent_datastore_id);
                }
            }
            // check all items
            if (obj.hasOwnProperty('items')) {
                for (n = 0; n < obj.items.length; n++) {
                    if (obj.items[n].hasOwnProperty('share_id')) {
                        continue;
                    }
                    obj.items[n]['parent_share_id'] = new_parent_share_id;
                    obj.items[n]['parent_datastore_id'] = new_parent_datastore_id;
                }
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#update_share_rights_of_folders_and_items
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Sets the share_rights for folders and items, based on the users rights on the share.
         * Calls recursive itself for all folders and skips nested shares.
         *
         * @param {TreeObject} obj The tree object to update
         * @param {RightObject} share_rights The share rights to update it with.
         */
        var update_share_rights_of_folders_and_items = function(obj, share_rights) {
            var n;

            if (obj.hasOwnProperty('datastore_id')) {
                // pass
            } else if (obj.hasOwnProperty('share_id')) {
                share_rights['read'] = obj['share_rights']['read'];
                share_rights['write'] = obj['share_rights']['write'];
                share_rights['grant'] = obj['share_rights']['grant'] && obj['share_rights']['write'];
                share_rights['delete'] = obj['share_rights']['write'];
            }

            // check all folders recursive
            if (obj.hasOwnProperty('folders')) {
                for (n = 0; n < obj.folders.length; n++) {
                    // lets not go inside of a new share, and don't touch the share_rights as they will come directly from the share
                    if (obj.folders[n].hasOwnProperty('share_id')) {
                        continue;
                    }
                    obj.folders[n]['share_rights'] = share_rights;
                    update_share_rights_of_folders_and_items(obj.folders[n], share_rights);
                }
            }
            // check all items
            if (obj.hasOwnProperty('items')) {
                for (n = 0; n < obj.items.length; n++) {
                    if (obj.items[n].hasOwnProperty('share_id')) {
                        continue;
                    }
                    obj.items[n]['share_rights'] = share_rights;
                }
            }
        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#update_paths_with_data
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Updates some datastore folders or share folders with content.
         * Will calculate the delete property in the right object.
         *
         * @param {TreeObject} datastore The current datastore to update
         * @param {Array} path The location of the new subtree
         * @param {TreeObject} content The actual data for this path
         * @param {RightObject} parent_share_rights The parental rights
         * @param {uuid} parent_share_id The parent's share id
         * @param {uuid} parent_datastore_id THe parent's datastore id
         */
        var update_paths_with_data = function(datastore, path, content, parent_share_rights, parent_share_id, parent_datastore_id) {
            var path_copy = path.slice();
            var search = find_in_datastore(path_copy, datastore);
            var obj = search[0][search[1]];

            // update share_rights in share object
            obj['share_rights'] = content.rights;
            obj['share_rights']['delete'] = parent_share_rights['write'];

            // update data (folder and items) in share object
            for (var prop in content.data) {
                if (!content.data.hasOwnProperty(prop)) {
                    continue;
                }
                obj[prop] = content.data[prop];
            }

            // update share_rights in folders and items
            update_parents(obj, parent_share_id, parent_datastore_id);
            update_share_rights_of_folders_and_items(obj, {
                'read': true,
                'write': true,
                'grant': true,
                'delete': true
            });
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#read_shares
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Queries shares recursive
         *
         * @param {TreeObject} datastore The datastore tree
         * @param {object} share_rights_dict Dictionary of shares and their share rights
         * @param {object} share_index The share index
         * @param {object} all_share_data The shared cache to not query every share multiple times
         * @returns {promise} Returns promise that resolves either when the initial datastore is loaded or when all shares with subshares are loaded
         */
        var read_shares = function(datastore, share_rights_dict, share_index, all_share_data) {
            var open_calls = 0;
            var all_calls = [];
            var content;

            var parent_share_rights = {
                'read': true,
                'write': true,
                'grant': false,
                'delete': false
            };

            var read_shares_recursive = function(datastore, share_rights_dict, share_index, all_share_data, parent_share_rights, parent_share_id, parent_datastore_id, parent_share_stack) {
                if (typeof share_index === 'undefined') {
                    return datastore;
                }

                var read_share_helper = function (share_id, sub_datastore, path, parent_share_id, parent_datastore_id, parent_share_stack) {
                    var onSuccess = function (content) {
                        if (typeof(content) === 'undefined') {
                            open_calls--;
                            return;
                        }
                        all_share_data[share_id] = content;

                        update_paths_with_data(datastore, path, content, parent_share_rights, parent_share_id, parent_datastore_id);



                        read_shares_recursive(sub_datastore, share_rights_dict, content.data.share_index, all_share_data, content.rights, share_id, undefined, parent_share_stack);
                        open_calls--;
                    };

                    var onError = function () {
                        open_calls--;
                    };
                    open_calls++;
                    return managerShare.read_share(share_id, _share_index[share_id])
                        .then(onSuccess, onError);
                };

                for (var share_id in share_index) {
                    if (!share_index.hasOwnProperty(share_id)) {
                        continue;
                    }

                    _share_index[share_id] = share_index[share_id].secret_key;

                    var new_parent_share_stack = angular.copy(parent_share_stack);
                    new_parent_share_stack.push(share_id);

                    for (var i = share_index[share_id].paths.length - 1; i >= 0; i--) {
                        var path_copy = share_index[share_id].paths[i].slice();
                        var search = find_in_datastore(path_copy, datastore);
                        var sub_datastore = search[0][search[1]];

                        // Break potential loops
                        if (parent_share_stack.indexOf(share_id) !== -1) {
                            content = {
                                'rights': {
                                    'read': false,
                                    'write': false,
                                    'grant': false
                                }
                            };
                            update_paths_with_data(datastore, share_index[share_id].paths[i], content, parent_share_rights, parent_share_id, undefined);
                            continue;
                        }

                        // Test if we already have it cached
                        if (all_share_data.hasOwnProperty(share_id)) {
                            update_paths_with_data(datastore, share_index[share_id].paths[i], all_share_data[share_id], parent_share_rights, parent_share_id, undefined);
                            continue;
                        }

                        // Let's check if we have read writes for this share, and skip it if we don't have read rights
                        if (share_rights_dict.hasOwnProperty(share_id) && !share_rights_dict[share_id].read) {

                            content = {
                                'rights': {
                                    'read': share_rights_dict[share_id].read,
                                    'write': share_rights_dict[share_id].write,
                                    'grant': share_rights_dict[share_id].grant
                                }
                            };

                            update_paths_with_data(datastore, share_index[share_id].paths[i], content, parent_share_rights, parent_share_id, undefined);
                            continue;
                        }

                        // No specific share rights for this share, lets assume inherited rights and check if we have parent read rights
                        if (!share_rights_dict.hasOwnProperty(share_id) && !parent_share_rights.read) {

                            content = angular.copy(parent_share_rights);

                            update_paths_with_data(datastore, share_index[share_id].paths[i], content, parent_share_rights, parent_share_id, undefined);
                            continue;
                        }

                        // No specific share rights for this share and datastore as parent (no inheritance possible) we a assume a share where we lost access rights
                        if (!share_rights_dict.hasOwnProperty(share_id) && typeof(parent_datastore_id) !== 'undefined') {
                            continue;
                        }

                        all_calls.push(read_share_helper(share_id, sub_datastore, share_index[share_id].paths[i], parent_share_id, parent_datastore_id, new_parent_share_stack));

                    }
                }
            };

            // Read shares recursive. We start from the datastore, so delete is allowed in the datastore
            read_shares_recursive(datastore, share_rights_dict, share_index, all_share_data, parent_share_rights, undefined, datastore.datastore_id, []);
            update_parents(datastore, undefined, datastore.datastore_id);
            update_share_rights_of_folders_and_items(datastore, {
                'read': true,
                'write': true,
                'grant': true,
                'delete': true
            });

            return $q.all(all_calls).then(function (ret) {
                return $q(function(resolve) {
                    $rootScope.$watch(function() {
                        return open_calls;
                    }, function watchCallback(open_calls) {
                        if (open_calls === 0) {
                            resolve(datastore);
                        }
                    });
                });
            });
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#hide_sub_share_content
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Searches all sub shares and hides (deletes) the content of those
         *
         * @param {TreeObject} share The share tree object which we want to modify
         */
        var hide_sub_share_content = function (share) {

            var allowed_props = ['id', 'name', 'share_id', 'share_secret_key'];

            for (var share_id in share.share_index) {
                if (!share.share_index.hasOwnProperty(share_id)) {
                    continue;
                }

                for (var i = share.share_index[share_id].paths.length - 1; i >= 0; i--) {
                    var path_copy = share.share_index[share_id].paths[i].slice();
                    var search = find_in_datastore(path_copy, share);

                    var obj = search[0][search[1]];

                    for (var prop in obj) {
                        if (!obj.hasOwnProperty(prop)) {
                            continue;
                        }
                        if (allowed_props.indexOf(prop) > -1) {
                            continue;
                        }
                        delete obj[prop];
                    }
                }
            }

        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#update_paths
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Sets the "path" attribute for all folders and items
         *
         * @param datastore
         * @param parent_path
         */
        var update_paths_recursive = function(datastore, parent_path) {
            var i;
            if (datastore.hasOwnProperty('items')) {
                for (i = 0; i < datastore['items'].length; i++) {
                    datastore['items'][i]['path'] = parent_path.slice();
                    datastore['items'][i]['path'].push(datastore['items'][i]['id']);
                }
            }
            if (datastore.hasOwnProperty('folders')) {
                for (i = 0; i < datastore['folders'].length; i++) {
                    datastore['folders'][i]['path'] = parent_path.slice();
                    datastore['folders'][i]['path'].push(datastore['folders'][i]['id']);
                    var parent_path_copy = parent_path.slice();
                    parent_path_copy.push(datastore['folders'][i]['id']);
                    update_paths_recursive(datastore['folders'][i], parent_path_copy);
                }
            }
        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#get_password_datastore
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Returns the password datastore. In addition this function triggers the generation of the local datastore
         * storage to.
         *
         * @returns {promise} Returns a promise with the datastore
         */
        var get_password_datastore = function(id) {
            var type = "password";
            var description = "default";

            var onSuccess = function (datastore) {

                var onSuccess = function (data) {

                    if (typeof data === 'undefined') {
                        return;
                    }

                    var share_rights_dict = {};
                    for (var i = data.share_rights.length - 1; i >= 0; i--) {
                        share_rights_dict[data.share_rights[i].share_id] = data.share_rights[i];
                    }

                    var onSuccess = function (datastore) {

                        update_paths_recursive(datastore, []);

                        managerDatastore.fill_storage('datastore-password-leafs', datastore, [
                            ['key', 'secret_id'],
                            ['secret_id', 'secret_id'],
                            ['value', 'secret_key'],
                            ['name', 'name'],
                            ['urlfilter', 'urlfilter'],
                            ['autosubmit', 'autosubmit'],
                            ['search', 'urlfilter']

                        ]);
                        managerDatastore.fill_storage('datastore-file-leafs', datastore, [
                            ['key', 'id'],
                            ['file_id', 'file_id'],
                            ['file_shard_id', 'file_shard_id'],
                            ['file_repository_id', 'file_repository_id'],
                            ['file_size', 'file_size'],
                            ['file_secret_key', 'file_secret_key'],
                            ['file_chunks', 'file_chunks'],
                            ['file_title', 'file_title']

                        ]);

                        password_datastore_read = true;

                        return datastore;
                    };
                    var onError = function (datastore) {};

                    return read_shares(datastore, share_rights_dict, datastore.share_index, {})
                        .then(onSuccess, onError);

                };

                var onError = function () {
                    // pass
                };

                return managerShare.read_share_rights_overview()
                    .then(onSuccess, onError);
            };
            var onError = function () {
                // pass
            };

            return managerDatastore.get_datastore(type, id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#save_datastore_content
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Saves the password datastore with given content (including shares) based on the "paths" of all changed
         * elements
         *
         * Responsible for hiding content that doesn't belong into the datastore (like the content of secrets).
         *
         * @param {TreeObject} datastore The real tree object you want to encrypt in the datastore
         * @param {Array} paths The list of paths to the changed elements
         */
        var save_datastore_content = function (datastore, paths) {
            var type = "password";
            var description = "default";

            trigger_registration('save_datastore_content', angular.copy(datastore));

            // datastore has changed, so lets regenerate local lookup
            managerDatastore.fill_storage('datastore-password-leafs', datastore, [
                ['key', 'secret_id'],
                ['secret_id', 'secret_id'],
                ['value', 'secret_key'],
                ['name', 'name'],
                ['urlfilter', 'urlfilter'],
                ['autosubmit', 'autosubmit'],
                ['search', 'urlfilter']
            ]);

            managerDatastore.fill_storage('datastore-file-leafs', datastore, [
                ['key', 'id'],
                ['file_id', 'file_id'],
                ['file_shard_id', 'file_shard_id'],
                ['file_size', 'file_size'],
                ['file_secret_key', 'file_secret_key'],
                ['file_chunks', 'file_chunks'],
                ['file_title', 'file_title']

            ]);

            datastore = managerBase.filter_datastore_content(datastore);

            var closest_shares = {};

            for (var i = paths.length - 1; i >= 0; i--) {

                var closest_share = managerShare.get_closest_parent_share(paths[i], datastore, datastore, 0);
                if (typeof closest_share.id === 'undefined') {
                    // its the datastore
                    closest_shares['datastore'] = datastore;
                } else {
                    closest_shares[closest_share.id] = closest_share;
                }
            }

            for (var prop in closest_shares) {

                if (!closest_shares.hasOwnProperty(prop)) {
                    continue;
                }

                var duplicate = helper.duplicate_object(closest_shares[prop]);
                hide_sub_share_content(duplicate);

                if (prop === 'datastore') {
                    managerDatastore.save_datastore_content(type, description, duplicate);
                } else {
                    var share_id = duplicate.share_id;
                    var secret_key = duplicate.share_secret_key;

                    delete duplicate.share_id;
                    delete duplicate.secret_key;
                    delete duplicate.share_rights;

                    managerShare.write_share(share_id, duplicate, secret_key);
                }
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#save_in_datastore
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Generates a new password for a given url and saves the password in the datastore.
         *
         * @param {object} secret_object The constructed secret object
         * @param {object} datastore_object The constructed datastore object
         *
         * @returns {promise} Returns a promise with the status
         */
        var save_in_datastore = function(secret_object, datastore_object) {

            var link_id = cryptoLibrary.generate_uuid();

            var onError = function(result) {
                // pass
            };

            var onSuccess = function (datastore) {

                return managerSecret.create_secret(secret_object, link_id, datastore.datastore_id, undefined)
                    .then(function(data) {

                        if (!datastore.hasOwnProperty('items')) {
                            datastore['items'] = []
                        }

                        datastore_object['id'] = link_id;
                        datastore_object['secret_id'] = data.secret_id;
                        datastore_object['secret_key'] = data.secret_key;
                        datastore.items.push(datastore_object);

                        save_datastore_content(datastore, [[]]);
                    }, onError);
            };

            return get_password_datastore()
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#save_password
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Stores credential for a given url, username and password in the datastore
         *
         * @param {string} url The URL of the site for which the password has been generated
         * @param {string} username The username to store
         * @param {string} password The password to store
         *
         * @returns {promise} Returns a promise with the new password
         */
        var save_password = function(url, username, password) {

            var parsed_url = helper.parse_url(url);

            var secret_object = {
                website_password_title: parsed_url.authority || '',
                website_password_url: url,
                website_password_username: username || "",
                website_password_password: password || "",
                website_password_notes: "",
                website_password_auto_submit: false,
                website_password_url_filter: parsed_url.authority || ''
            };

            var datastore_object = {
                type: 'website_password',
                name: parsed_url.authority || '',
                urlfilter: parsed_url.authority || ''
            };

            var onError = function() {
                // pass
            };

            var onSuccess = function () {

                // we return a promise. We do not yet have a proper error handling and returning
                // a promise might make it easier later to wait or fix errors
                return $q(function (resolve) {
                    resolve(password);
                });
            };

            return save_in_datastore(secret_object, datastore_object)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#save_password_active_tab
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Generates a password for the active tab
         *
         * @param {string} password The password to store
         *
         * @returns {promise} Returns a promise with the new password
         */
        var save_password_active_tab = function(password) {

            var onError = function() {
                console.log("could not find out the url of the active tab");
            };

            var onSuccess = function(url) {

                var onError = function(result) {
                    //pass
                };
                var onSuccess = function(password) {

                    browserClient.emit_sec('fillpassword-active-tab', {password: password});

                    return password;
                };


                return save_password(url, '', password)
                    .then(onSuccess, onError);

            };

            return browserClient.get_active_tab_url()
                .then(onSuccess, onError);

        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#bookmark_active_tab
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Bookmarks the active tab
         *
         * @returns {promise} Returns a promise
         */
        var bookmark_active_tab = function() {

            var onError = function() {
                console.log("could not find out the url of the active tab");
            };

            var onSuccess = function(tab) {

                var parsed_url = helper.parse_url(tab.url);

                var secret_object = {
                    bookmark_title: tab.title,
                    bookmark_url: tab.url,
                    bookmark_notes: "",
                    bookmark_url_filter: parsed_url.authority || ''
                };

                var datastore_object = {
                    type: 'bookmark',
                    name: tab.title,
                    urlfilter: parsed_url.authority || ''
                };

                var onError = function() {
                    // pass
                };

                var onSuccess = function () {

                    // we return a promise. We do not yet have a proper error handling and returning
                    // a promise might make it easier later to wait or fix errors
                    return $q(function (resolve) {
                        resolve();
                    });
                };

                return save_in_datastore(secret_object, datastore_object)
                    .then(onSuccess, onError);

            };

            return browserClient.get_active_tab()
                .then(onSuccess, onError);

        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#find_object
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Searches a folder and expects to find an element (item or folder) with a specific search_id.
         * It will return a tuple with the list of elements holding the element together with the index.
         *
         * @param {object} folder The folder to search
         * @param {uuid} search_id The id of the element one is looking for
         *
         * @returns {[]|boolean} Returns a tuple of the containing list and index or false if not found
         */
        var find_object = function(folder, search_id) {

            var n, l;

            if (folder.hasOwnProperty('folders')) {
                // check if the object is a folder, if yes return the folder list and the index
                for (n = 0, l = folder.folders.length; n < l; n++) {
                    if (folder.folders[n].id === search_id) {
                        return [folder.folders, n];
                    }
                }
            }
            if (folder.hasOwnProperty('items')) {
                // check if its a file, if yes return the file list and the index
                for (n = 0, l = folder.items.length; n < l; n++) {
                    if (folder.items[n].id === search_id) {
                        return [folder.items, n];
                    }
                }
            }
            // something went wrong, couldn't find the item / folder here
            return false;
        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#find_in_datastore
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Go through the datastore recursive to find the object specified with the path
         *
         * @param {Array} path The path to the object you search as list of ids (length > 0)
         * @param {TreeObject} datastore The datastore object tree
         *
         * @returns {boolean|Array} False if not present or a list of two objects where the first is the List Object (items or folder container) containing the searchable object and the second the index
         */
        var find_in_datastore = function (path, datastore) {

            var to_search = path[0];
            var n, l;
            var rest = path.slice(1);

            if (rest.length === 0) {
                // found the parent
                return find_object(datastore, to_search);
            }

            for (n = 0, l= datastore.folders.length; n < l; n++) {
                if (datastore.folders[n].id === to_search) {
                    return find_in_datastore(rest, datastore.folders[n]);
                }
            }
            return false;
        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#search_in_datastore
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Searches a datastore and returns the paths
         *
         * @param {*} to_search The thing to search
         * @param {TreeObject} datastore The datastore object tree
         * @param {TreeObject} cmp_fct The compare function
         *
         * @returns {Array} a list of the paths
         */
        var search_in_datastore = function (to_search, datastore, cmp_fct) {
            var i, n, l;
            var paths = [];
            var tmp_paths;

            if (datastore.hasOwnProperty('items')) {
                for (n = 0, l = datastore.items.length; n < l; n++) {
                    if(!cmp_fct(to_search, datastore.items[n])) {
                        continue
                    }
                    paths.push([datastore.items[n].id]);
                }
            }

            if (datastore.hasOwnProperty('folders')) {
                for (n = 0, l = datastore.folders.length; n < l; n++) {
                    tmp_paths = search_in_datastore(to_search, datastore.folders[n], cmp_fct);
                    for (i = 0; i < tmp_paths.length; i++) {
                        tmp_paths[i].unshift(datastore.folders[n].id);
                        paths.push(tmp_paths[i]);
                    }
                    if(!cmp_fct(to_search, datastore.folders[n])) {
                        continue
                    }
                    paths.push([datastore.folders[n].id]);
                }
            }
            return paths;
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#get_all_child_shares
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * fills other_children with all child shares of a given path
         *
         * @param {Array} path The path to search for child shares
         * @param {TreeObject|undefined} [datastore] (optional) if obj provided
         * @param {Array} other_children The list of found children
         * @param {int|undefined} [share_distance] (optional) share_distance the distance in shares to search (-1 = unlimited search, 0 stop search)
         * @param {TreeObject|undefined} [obj] (optional)  if not provided we will search it in the datastore according to the provided path first
         */
        var get_all_child_shares = function(path, datastore, other_children, share_distance, obj) {

            var n, l, new_path;
            if (share_distance === 0) {
                return
            }

            if (typeof obj === 'undefined') {
                var path_copy = path.slice();
                var search = find_in_datastore(path_copy, datastore);
                obj = search[0][search[1]];
                return get_all_child_shares(path, datastore, other_children, share_distance, obj)
            } else if (obj === false) {
                // TODO Handle not found
                console.log("HANDLE not found!");
            } else {
                //search in folders
                if (obj.hasOwnProperty('folders')) {
                    for (n = 0, l = obj.folders.length; n < l; n++) {
                        new_path = path.slice();
                        new_path.push(obj.folders[n].id);
                        if (typeof(obj.folders[n].share_id) !== 'undefined') {
                            other_children.push({
                                share: obj.folders[n],
                                path: new_path
                            });
                            get_all_child_shares(new_path, obj, other_children, share_distance-1, obj.folders[n]);
                        } else {
                            get_all_child_shares(new_path, obj, other_children, share_distance, obj.folders[n]);
                        }
                    }
                }
                // search in items
                if (obj.hasOwnProperty('items')) {
                    for (n = 0, l = obj.items.length; n < l; n++) {
                        new_path = path.slice();
                        new_path.push(obj.items[n].id);
                        if (typeof(obj.items[n].share_id) !== 'undefined') {
                            other_children.push({
                                share: obj.items[n],
                                path: new_path
                            });
                        }
                    }
                }
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#get_all_elements_with_property
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * returns searches an element recursive for items with a property. Doesn't cross share borders.
         *
         * @param {object} element the tree structure with shares to search
         * @param {string} property the property to search for
         * @returns {Array} List of element ids and the paths
         */
        var get_all_elements_with_property = function(element, property) {

            var links = [];

            /**
             * helper function, that searches an element recursive for secret links. Doesn't cross share borders.
             *
             * @param {object} element the element to search
             * @param {Array} links
             * @param {Array} path
             */
            var get_all_elements_with_property_recursive = function(element, links, path) {
                var n, l;
                var new_path = path.slice();
                new_path.push(element.id);

                if (element.hasOwnProperty('share_id')) {
                    return;
                }

                // check if the element itself has the property
                if (element.hasOwnProperty(property)) {
                    links.push({
                        id: element.id,
                        path: new_path
                    });
                }

                // search items recursive, skip shares
                if (element.hasOwnProperty('items')) {
                    for (n = 0, l = element.items.length; n < l; n++) {
                        if (element.items[n].hasOwnProperty('share_id')) {
                            continue;
                        }
                        get_all_elements_with_property_recursive(element.items[n], links, new_path);
                    }
                }

                // search folders recursive, skip shares
                if (element.hasOwnProperty('folders')) {
                    for (n = 0, l = element.folders.length; n < l; n++) {
                        if (element.folders[n].hasOwnProperty('share_id')) {
                            continue;
                        }
                        get_all_elements_with_property_recursive(element.folders[n], links, new_path);
                    }
                }
            };

            get_all_elements_with_property_recursive(element, links, []);

            return links;
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#get_all_secret_links
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * returns all secret links in element. Doesn't cross share borders.
         *
         * @param {object} element the element to search
         * @returns {Array} List of secret links
         */
        var get_all_secret_links = function(element) {
            return get_all_elements_with_property(element, 'secret_id');
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#get_all_file_links
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * returns all file links in element. Doesn't cross share borders.
         *
         * @param {object} element the element to search
         * @returns {Array} List of secret links
         */
        var get_all_file_links = function(element) {
            return get_all_elements_with_property(element, 'file_id');
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#get_relative_path
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Translates the absolute path to a relative path
         *
         * @param {TreeObject} share The share to search in the absolute path
         * @param {Array} absolute_path The absolute path
         * @returns {Array} Returns the relative path
         */
        var get_relative_path = function(share, absolute_path) {

            var path_copy = absolute_path.slice();

            // lets create the relative path in the share
            var relative_path = [];

            if (typeof share.id === 'undefined') {
                // we have the datastore, so we need the complete path
                relative_path = path_copy;
            } else {
                var passed = false;
                for (var i = 0, l = path_copy.length; i < l; i++) {
                    if (passed) {
                        relative_path.push(path_copy[i]);
                    } else if (share.id === path_copy[i]) {
                        passed = true;
                    }
                }
            }

            return relative_path
        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#on_share_added
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * triggered once a new share is added. Searches the datastore for the closest share (or the datastore if no
         * share) and adds it to the share_index
         *
         * @param {uuid} share_id The share id that was added
         * @param {Array} path The path to the new share
         * @param {TreeObject} datastore The datastore it was added to
         * @param {int} distance Some logic to get the correct parent share to update
         *
         * @returns {Array} Returns the paths to update
         */
        var on_share_added = function (share_id, path, datastore, distance) {

            var changed_paths = [];
            var i, l;

            var path_copy = path.slice();
            var path_copy2 = path.slice();
            var path_copy3 = path.slice();
            var path_copy4 = path.slice();

            var parent_share = managerShare.get_closest_parent_share(path_copy, datastore, datastore, distance);

            // create share_index object if not exists
            if (typeof(parent_share.share_index) === 'undefined') {
                parent_share.share_index = {};
            }

            // add the the entry for the share in the share_index if not yet exists
            if (typeof(parent_share.share_index[share_id]) === 'undefined') {

                var search = find_in_datastore(path_copy2, datastore);
                var share = search[0][search[1]];

                parent_share.share_index[share_id] = {
                    paths: [],
                    secret_key: share.share_secret_key
                };
            }

            var parent_share_path = [];
            for (i = 0, l = path_copy3.length; i < l; i++) {
                if (typeof parent_share.id === 'undefined' || path_copy3[i] === parent_share.id) {
                    break;
                }
                parent_share_path.push(path_copy3[i]);
            }
            changed_paths.push(parent_share_path);

            // lets create the relative path in the share
            var relative_path = get_relative_path(parent_share, path_copy3);

            parent_share.share_index[share_id].paths.push(relative_path);

            var share_changed = false;

            for (var old_share_id in parent_share.share_index) {
                if (!parent_share.share_index.hasOwnProperty(old_share_id)) {
                    continue;
                }
                if (old_share_id === share_id) {
                    continue;
                }

                for (i = 0, l = parent_share.share_index[old_share_id].paths.length; i < l; i++) {
                    if (!helper.array_starts_with(parent_share.share_index[old_share_id].paths[i], relative_path)) {
                        continue;
                    }
                    var new_relative_path = parent_share.share_index[old_share_id].paths[i].slice(relative_path.length);

                    parent_share.share_index[old_share_id].paths.splice(i, 1);

                    if (typeof(share.share_index) === 'undefined') {
                        share.share_index = {};
                    }

                    if (typeof(share.share_index[old_share_id]) === 'undefined') {
                        share.share_index[old_share_id] = {
                            paths: [],
                            secret_key: parent_share.share_index[old_share_id].secret_key
                        };
                    }
                    share.share_index[old_share_id].paths.push(new_relative_path);

                    if (parent_share.share_index[old_share_id].paths.length === 0) {
                        delete parent_share.share_index[old_share_id];
                    }

                    if (Object.keys(parent_share.share_index).length === 0) {
                        delete parent_share.share_index;
                    }
                    share_changed = true;
                }
            }

            if (share_changed) {
                changed_paths.push(path_copy4);
            }

            return changed_paths
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#on_share_deleted
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * triggered once a share is deleted. Searches the datastore for the closest share (or the datastore if no
         * share) and removes it from the share_index
         *
         * @param {uuid} share_id the share_id to delete
         * @param {Array} path The path to the deleted share
         * @param {TreeObject} datastore The datastore it was deleted from
         * @param {int} distance Some logic to get the correct parent share to update
         *
         * @returns {Array} Returns the paths to update
         */
        var on_share_deleted = function (share_id, path, datastore, distance) {

            var path_copy = path.slice();
            var parent_share = managerShare.get_closest_parent_share(path_copy, datastore, datastore, distance);
            var relative_path = get_relative_path(parent_share, path.slice());

            /**
             * The function that actually adjusts the share_index object and deletes the shares
             *
             * @param share the share holding the share_index
             * @param share_id the share_id of the share, that we want to remove from the share_index
             * @param relative_path the relative path inside the share
             */
            var delete_from_share_index = function(share, share_id, relative_path) {

                var already_found = false;

                for (var i = share.share_index[share_id].paths.length - 1; i >= 0; i--) {
                    // delete the path from the share index entry
                    if (helper.array_starts_with(share.share_index[share_id].paths[i], relative_path)) {
                        share.share_index[share_id].paths.splice(i, 1);
                        already_found = true;
                    }
                    // if no paths are empty, we delete the whole share_index entry
                    if (share.share_index[share_id].paths.length === 0) {
                        delete share.share_index[share_id];
                    }
                    // if the share_index holds no entries anymore, we delete the share_index
                    if (Object.keys(share.share_index).length === 0) {
                        delete share.share_index;
                    }

                    if (already_found) {
                        return;
                    }
                }
            };

            // Share_id specified, so lets delete the specified one
            delete_from_share_index(parent_share, share_id, relative_path);

            return [path]
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#on_share_deleted
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * triggered once a share moved. handles the update of the share_index
         *
         * @param {uuid} share_id The id of the share that moved
         * @param {Array} old_path The old path
         * @param {Array} new_path The new path
         * @param {TreeObject} datastore The affected datastore
         * @param {int} add_distance Some logic to get the correct parent share to update in on_share_added()
         * @param {int} delete_distance Some logic to get the correct parent share to update in on_share_deleted()
         * @returns {Array} Returns the paths to update
         */
        var on_share_moved = function(share_id, old_path, new_path, datastore, add_distance, delete_distance) {

            var paths_updated1 = on_share_added(share_id, new_path, datastore, add_distance);
            var paths_updated2 = on_share_deleted(share_id, old_path, datastore, delete_distance);

            return paths_updated1.concat(paths_updated2);

        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#trigger_registration
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * used to trigger all registered functions on event
         *
         * @param {string} key The key of the function (usually the function name)
         * @param {function} value The value with which to call the function
         */
        var trigger_registration = function (key, value) {
            if (!registrations.hasOwnProperty(key)) {
                registrations[key] = [];
            }
            for (var i = registrations[key].length - 1; i >= 0; i--) {
                registrations[key][i](value);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#register
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * used to register functions to bypass circular dependencies
         *
         * @param {string} key The key of the function (usually the function name)
         * @param {function} func The call back function
         */
        var register = function (key, func) {
            if (!registrations.hasOwnProperty(key)) {
                registrations[key] = [];
            }
            registrations[key].push(func);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#unregister
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * used to unregister functions to bypass circular dependencies
         *
         * @param {string} key The key of the function (usually the function name)
         * @param {function} func The call back function
         */
        var unregister = function (key, func) {
            if (!registrations.hasOwnProperty(key)) {
                registrations[key] = [];
            }
            for (var i = registrations[key].length - 1; i >= 0; i--) {
                if (registrations[key][i] !== func) {
                    continue;
                }
                registrations[key].splice(i, 1);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#analyze_breadcrumbs
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Analyzes the breadcrumbs and returns some info about them like e.g parent_share_id
         *
         * @param {object} breadcrumbs The breadcrumbs to follow
         * @param {TreeObject} datastore The corresponding datastore to analyze
         *
         * @returns {object} The info about the object
         */
        var analyze_breadcrumbs = function(breadcrumbs, datastore) {

            var path;
            var parent_path;

            var target;
            var parent_share_id;
            var parent_datastore_id;

            if (typeof breadcrumbs.id_breadcrumbs !== "undefined") {
                path = breadcrumbs.id_breadcrumbs.slice();
                var path_copy = breadcrumbs.id_breadcrumbs.slice();
                parent_path = breadcrumbs.id_breadcrumbs.slice();
                // find drop zone
                var val1 = find_in_datastore(breadcrumbs.id_breadcrumbs, datastore);
                target = val1[0][val1[1]];

                // get the parent (share or datastore)
                var parent_share = managerShare.get_closest_parent_share(path_copy, datastore, datastore, 0);
                if (parent_share.hasOwnProperty("datastore_id")) {
                    parent_datastore_id = parent_share.datastore_id;
                } else if (parent_share.hasOwnProperty("share_id")){
                    parent_share_id = parent_share.share_id;
                } else {
                    alert("Wupsi, that should not happen: d6da43af-e0f5-46ba-ae5b-d7e5ccd2fa92")
                }
            } else {
                path = [];
                parent_path = [];
                target = datastore;
                parent_datastore_id = target.datastore_id;
            }

            return {
                'path': path,
                'parent_path': parent_path,
                'target': target,
                'parent_share_id': parent_share_id,
                'parent_datastore_id': parent_datastore_id
            }

        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#create_share_link_in_datastore
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Adds a single share to the password datastore, triggers the creation of the necessary share links and returns
         * changed paths
         *
         * @param {object} share The share to add
         * @param {object} target The target folder to add the share to
         * @param {array} path The path of the target folder
         * @param {uuid} parent_share_id The parent Share ID (if the parent is a share)
         * @param {uuid} parent_datastore_id The parent Datastore ID (if the parent is a datastore)
         * @param {TreeObject} datastore The complete password datastore
         *
         * @returns {Array} The paths of changes
         */
        var create_share_link_in_datastore = function (share, target, path, parent_share_id, parent_datastore_id, datastore) {

            var link_id = cryptoLibrary.generate_uuid();

            share.id = link_id;

            if (typeof share.type === "undefined") {
                //its a folder, lets add it to folders
                if (typeof target.folders === "undefined") {
                    target.folders = []
                }
                target.folders.push(share)
            } else {
                // its an item, lets add it to items
                if (typeof target.items === "undefined") {
                    target.items = []
                }
                target.items.push(share)
            }

            managerShareLink.create_share_link(link_id, share.share_id,
                parent_share_id, parent_datastore_id);

            path.push(share.id);

            return on_share_added(share.share_id, path, datastore, 1);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#create_share_links_in_datastore
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Adds multiple shares to the password datastore and triggers the save of the password datastore
         *
         * @param {array} shares An array of shares to add to the datastore
         * @param {object} target The target folder to add the shares to
         * @param {array} parent_path The path to the parent datastore or share
         * @param {array} path The path to the target
         * @param {uuid} parent_share_id The parent Share ID (if the parent is a share)
         * @param {uuid} parent_datastore_id The parent Datastore ID (if the parent is a datastore)
         * @param {TreeObject} datastore The complete password datastore
         *
         * @returns {promise} Returns a promise with the success of the action
         */
        var create_share_links_in_datastore = function(shares, target, parent_path, path, parent_share_id, parent_datastore_id, datastore) {

            var changed_paths = [parent_path];

            for (var i = 0; i < shares.length; i ++) {
                var share = shares[i];
                changed_paths.concat(
                    create_share_link_in_datastore(share, target, angular.copy(path), parent_share_id, parent_datastore_id, datastore)
                )
            }

            return save_datastore_content(datastore, changed_paths);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#showFolderContentRecursive
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Walks through the folder structure and sets "hidden" to false
         *
         * @param {TreeObject} searchTree The part of the datastore to show recursive
         */
        var showFolderContentRecursive = function(searchTree) {
            var i;
            if (searchTree.hasOwnProperty('folders')) {
                for (i = searchTree.folders.length - 1; searchTree.folders && i >= 0; i--) {
                    showFolderContentRecursive(searchTree.folders[i]);
                }
            }
            if (searchTree.hasOwnProperty('items')) {
                for (i = searchTree.items.length - 1; searchTree.items && i >= 0; i--) {
                    searchTree.items[i].hidden = false;
                }
            }
            searchTree.hidden = false;
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#modifyTreeForSearch
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * searches a tree and marks all folders / items as invisible, only leaving nodes with search
         *
         * @param {string} newValue The new string from the search box
         * @param {TreeObject} searchTree The part of the datastore to search
         */
        var modifyTreeForSearch = function (newValue, searchTree) {

            if (typeof(newValue) === 'undefined' || typeof(searchTree) === 'undefined') {
                return;
            }

            var show = false;

            var i, ii;
            if (searchTree.hasOwnProperty('folders')) {
                for (i = searchTree.folders.length - 1; searchTree.folders && i >= 0; i--) {
                    show = modifyTreeForSearch(newValue, searchTree.folders[i]) || show;
                }
            }

            newValue = newValue.toLowerCase();
            var searchStrings = newValue.split(" ");

            // Test title of the items
            var containCounter = 0;
            if (searchTree.hasOwnProperty('items')) {
                for (i = searchTree.items.length - 1; searchTree.items && i >= 0; i--) {
                    containCounter = 0;
                    for (ii = searchStrings.length - 1; ii >= 0; ii--) {
                        if (typeof(searchTree.items[i].name) === 'undefined') {
                            continue;
                        }
                        if (searchTree.items[i].name.toLowerCase().indexOf(searchStrings[ii]) > -1) {
                            containCounter++
                        } else if(searchTree.items[i].hasOwnProperty('id') && searchTree.items[i]['id'] === searchStrings[ii]) {
                            containCounter++
                        } else if(searchTree.items[i].hasOwnProperty('secret_id') && searchTree.items[i]['secret_id'] === searchStrings[ii]) {
                            containCounter++
                        } else if(searchTree.items[i].hasOwnProperty('share_id') && searchTree.items[i]['share_id'] === searchStrings[ii]) {
                            containCounter++
                        }
                    }
                    if (containCounter === searchStrings.length) {
                        searchTree.items[i].hidden = false;
                        show = true;
                    } else {
                        searchTree.items[i].hidden = true;
                    }
                }
            }
            // Test title of the folder
            if (typeof searchTree.name !== 'undefined') {
                containCounter = 0;
                for (ii = searchStrings.length - 1; ii >= 0; ii--) {
                    if (searchTree.name.toLowerCase().indexOf(searchStrings[ii]) > -1) {
                        containCounter++
                    } else if(searchTree.hasOwnProperty('id') && searchTree['id'] === searchStrings[ii]) {
                        containCounter++
                    } else if(searchTree.hasOwnProperty('share_id') && searchTree['share_id'] === searchStrings[ii]) {
                        containCounter++
                    }
                }
                if (containCounter === searchStrings.length) {
                    show = true;
                    showFolderContentRecursive(searchTree);
                }
            }
            searchTree.hidden = !show;
            searchTree.expanded_temporary = newValue !== '';
            searchTree.is_expanded = searchTree.expanded_temporary || searchTree.expanded;

            return show;
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#get_inaccessible_shares
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Takes a list of shares and will check which ones are accessible or not.
         * It will return a list of shares that are not accessible.
         *
         * @param {Array} share_list The list of shares (objects with share_id attribute)
         *
         * @returns {Array} A list of the objects that are not accessible
         */
        var get_inaccessible_shares = function (share_list) {

            // returns an empty list if the password datastore hasn't been read yet
            if (!password_datastore_read) {
                return [];
            }

            var inaccessible_shares = [];

            for (var i = 0; i < share_list.length; i++) {
                if (_share_index.hasOwnProperty(share_list[i].share_id)) {
                    continue;
                }
                inaccessible_shares.push(share_list[i])
            }

            return inaccessible_shares;

        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#get_all_own_pgp_keys
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Reads the password datastore and returns all own pgp private keys as array
         *
         * @returns {promise} A list of all own pgp keys
         */
        var get_all_own_pgp_keys = function () {
            return $q(function(resolve) {

                get_password_datastore().then(function(datastore){

                    var own_pgp_secrets = [];
                    var own_pgp_keys = [];
                    var failed = 0;

                    managerDatastore.filter(datastore, function(item) {
                        if (!item.hasOwnProperty("type") || item['type'] !== 'mail_gpg_own_key') {
                            return;
                        }
                        own_pgp_secrets.push(item);
                    });

                    var trigger_potential_return = function() {
                        if (own_pgp_keys.length + failed === own_pgp_secrets.length) {
                            resolve(own_pgp_keys);
                        }
                    };

                    var onError = function(result) {
                        failed = failed +1;
                        trigger_potential_return()
                    };

                    var onSuccess = function(secret) {
                        own_pgp_keys.push(secret['mail_gpg_own_key_private']);
                        trigger_potential_return();
                    };


                    for (var i = 0; i < own_pgp_secrets.length; i++) {

                        managerSecret.read_secret(own_pgp_secrets[i].secret_id, own_pgp_secrets[i].secret_key)
                            .then(onSuccess, onError);
                    }
                });
            });
        };



        itemBlueprint.register('generate', generate);
        itemBlueprint.register('get_password_datastore', get_password_datastore);
        itemBlueprint.register('save_datastore_content', save_datastore_content);
        itemBlueprint.register('find_in_datastore', find_in_datastore);
        itemBlueprint.register('on_share_added', on_share_added);
        settings.register('get_password_datastore', get_password_datastore);

        return {
            generate: generate,
            get_password_datastore: get_password_datastore,
            save_datastore_content: save_datastore_content,
            save_password: save_password,
            save_password_active_tab: save_password_active_tab,
            bookmark_active_tab: bookmark_active_tab,
            find_in_datastore: find_in_datastore,
            search_in_datastore: search_in_datastore,
            get_all_child_shares: get_all_child_shares,
            get_all_secret_links: get_all_secret_links,
            get_all_file_links: get_all_file_links,
            on_share_added: on_share_added,
            on_share_moved: on_share_moved,
            on_share_deleted: on_share_deleted,
            update_parents: update_parents,
            register: register,
            unregister: unregister,
            analyze_breadcrumbs: analyze_breadcrumbs,
            create_share_links_in_datastore: create_share_links_in_datastore,
            modifyTreeForSearch: modifyTreeForSearch,
            get_inaccessible_shares: get_inaccessible_shares,
            get_all_own_pgp_keys: get_all_own_pgp_keys,
            update_paths_recursive: update_paths_recursive,
            update_share_rights_of_folders_and_items: update_share_rights_of_folders_and_items
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerDatastorePassword", ['$q', '$rootScope', 'managerBase', 'managerSecret', 'managerShareLink', 'managerDatastore', 'managerShare',
        'itemBlueprint', 'helper', 'settings', 'browserClient', 'cryptoLibrary', managerDatastorePassword]);

}(angular, generatePassword));