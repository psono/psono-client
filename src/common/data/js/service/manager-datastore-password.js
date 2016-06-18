(function(angular, uuid) {
    'use strict';

    var managerDatastorePassword = function($q, $rootScope, managerSecret, managerDatastore, managerShare, passwordGenerator, itemBlueprint, helper) {

        /**
         * updates some datastore folders or share folders with content
         *
         * @param datastore
         * @param path
         * @param data
         */
        var update_paths_with_data = function(datastore, path, data) {
            var path_copy = path.slice();
            var search = find_in_datastore(path_copy, datastore);
            var obj = search[0][search[1]];

            for (var prop in data) {
                if (!data.hasOwnProperty(prop)) {
                    continue;
                }
                obj[prop] = data[prop];
            }
        };

        /**
         * queries shares recursive
         *
         * @param datastore
         * @param share_rights_dict
         * @param share_index
         * @param all_share_data
         * @param [blocking]
         * @returns {*}
         */
        var read_shares = function(datastore, share_rights_dict, share_index, all_share_data, blocking) {
            var open_calls = 0;
            var all_calls = [];

            var read_shares_recursive = function(datastore, share_rights_dict, share_index, all_share_data) {
                if (typeof share_index === 'undefined') {
                    return datastore;
                }

                for (var share_id in share_index) {
                    if (!share_index.hasOwnProperty(share_id)) {
                        continue;
                    }

                    for (var i = 0, l = share_index[share_id].paths.length; i < l; i++) {
                        var path_copy = share_index[share_id].paths[i].slice();
                        var search = find_in_datastore(path_copy, datastore);
                        var sub_datastore = search[0][search[1]];

                        if (all_share_data.hasOwnProperty(share_id)) {
                            update_paths_with_data(datastore, share_index[share_id].paths[i], all_share_data[share_id]);
                            continue;
                        }

                        // Let's check if we have read writes for this share, and skip it if we don't have read writes
                        if (!share_rights_dict.hasOwnProperty(share_id) || !share_rights_dict[share_id].read) {
                            continue;
                        }

                        all_calls.push((function (share_id, sub_datastore, path) {
                            var onSuccess = function (data) {
                                all_share_data[share_id] = data;

                                update_paths_with_data(datastore, path, data);

                                read_shares_recursive(sub_datastore, share_rights_dict, data.share_index, all_share_data);
                                open_calls--;
                            };

                            var onError = function () {
                                open_calls--;
                            };
                            open_calls++;
                            return managerShare.read_share(share_id, share_index[share_id].secret_key)
                                .then(onSuccess, onError);
                        })(share_id, sub_datastore, share_index[share_id].paths[i]));

                    }
                }
            };

            read_shares_recursive(datastore, share_rights_dict, share_index, all_share_data);

            return $q.all(all_calls).then(function (ret) {
                if (blocking) {
                    return $q(function(resolve) {
                        $rootScope.$watch(function() {
                            return open_calls;
                        }, function watchCallback(open_calls) {
                            if (open_calls == 0) {
                                resolve(datastore);
                            }
                        });
                    });
                } else {
                    return datastore;
                }
            });
        };

        /**
         * searches all sub shares and hides the content of those
         *
         * @param share
         */
        var hide_sub_share_content = function (share) {

            var allowed_props = ['id', 'name', 'share_id', 'share_secret_key'];

            for (var share_id in share.share_index) {
                if (!share.share_index.hasOwnProperty(share_id)) {
                    continue;
                }

                for (var i = 0, l = share.share_index[share_id].paths.length; i < l; i++) {
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
         * Returns the password datastore. In addition this function triggers the generation of the local datastore
         * storage to
         *
         * @param [blocking]
         * @returns {promise}
         */
        var get_password_datastore = function(blocking) {
            var type = "password";
            var description = "default";


            var onSuccess = function (datastore) {

                var onSuccess = function (data) {

                    var share_rights_dict = {};
                    for (var i = 0, l = data.share_rights.length; i < l; i++) {
                        share_rights_dict[data.share_rights[i].share_id] = data.share_rights[i];
                    }
                    managerDatastore.fill_storage('datastore-password-leafs', datastore, [
                        ['key', 'secret_id'],
                        ['secret_id', 'secret_id'],
                        ['value', 'secret_key'],
                        ['name', 'name'],
                        ['urlfilter', 'urlfilter'],
                        ['search', 'urlfilter']

                    ]);

                    return read_shares(datastore, share_rights_dict, datastore.share_index, {}, blocking);

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

            return managerDatastore.get_datastore(type, description)
                .then(onSuccess, onError);
        };

        /**
         * Saves the password datastore with given content
         *
         * @param datastore The real object you want to encrypt in the datastore
         * @param paths The list of paths to the changed elements
         */
        var save_datastore = function (datastore, paths) {
            var type = "password";
            var description = "default";

            // datastore has changed, so lets regenerate local lookup
            managerDatastore.fill_storage('datastore-password-leafs', datastore, [
                ['key', 'secret_id'],
                ['value', 'secret_key'],
                ['name', 'name'],
                ['urlfilter', 'urlfilter']
            ]);

            datastore = managerDatastore.filter_datastore_content(datastore);

            var closest_shares = {};

            for (var i = 0, l = paths.length; i < l; i++) {

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
                    managerDatastore.save_datastore(type, description, duplicate);
                } else {
                    var share_id = duplicate.share_id;
                    var secret_key = duplicate.share_secret_key;

                    delete duplicate.share_id;
                    delete duplicate.secret_key;

                    managerShare.write_share(share_id, duplicate, secret_key);
                }
            }
        };

        /**
         * Generates a new password for a given url and saves the password in the datastore.
         * Returns a promise with the new password
         *
         * @returns {promise}
         */
        var generatePassword = function(url) {

            var password = passwordGenerator.generate();

            var parsed_url = helper.parse_url(url);

            var secret_object = {
                website_password_title: "Generated for " + parsed_url.authority,
                website_password_url: url,
                website_password_username: "",
                website_password_password: password,
                website_password_notes: "",
                website_password_auto_submit: false,
                website_password_url_filter: parsed_url.authority
            };

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(e) {
                get_password_datastore()
                    .then(function (data) {

                        var datastore_object = {
                            id: uuid.v4(),
                            type: 'website_password',
                            name: "Generated for " + parsed_url.authority,
                            urlfilter: parsed_url.authority,
                            secret_id: e.secret_id,
                            secret_key: e.secret_key
                        };

                        data.items.push(datastore_object);

                        save_datastore(data);
                    });
            };

            managerSecret.create_secret(secret_object)
                .then(onSuccess, onError);

            // we return a promise. So far its
            // , but we do not yet have a proper error handling and returning
            // a promise might make it easier later to wait for the errors
            return $q(function (resolve) {
                resolve(password);
            });
        };

        /**
         * Generates a password for the active tab
         *
         * @returns {promise}
         */
        var generatePasswordActiveTab = function() {

            var onError = function() {
                alert("could not find out the url of the active tab");
            };

            var onSuccess = function(url) {


                var onError = function(result) {
                    //pass
                };
                var onSuccess = function(password) {

                    browserClient.emitSec('fillpassword-active-tab', {password: password});

                    return password;
                };

                return generatePassword(url)
                    .then(onSuccess, onError);

            };

            return browserClient.getActiveTabUrl()
                .then(onSuccess, onError);

        };


        /**
         * Go through the datastore to find the object specified with the path
         *
         * @param path The path to the object you search as list of ids
         * @param datastore The datastore object tree
         * @returns {*} False if not present or a list of two objects where the first is the List Object containing the searchable object and the second the index
         */
        var find_in_datastore = function (path, datastore) {

            var to_search = undefined;

            var i, n, l;

            var rest = [];
            for (i = 0, l = path.length; i < l; i++) {
                if (i == 0) {
                    to_search = path[i];
                } else {
                    rest.push(path[i]);
                }
            }

            if (rest.length == 0) {
                // found the parent
                // check if the object is a folder, if yes return the folder list and the index
                if (datastore.hasOwnProperty('folders')) {
                    for (n = 0, l = datastore.folders.length; n < l; n++) {
                        if (datastore.folders[n].id == to_search) {
                            return [datastore.folders, n];
                            // datastore.folders.splice(n, 1);
                            // return true;
                        }
                    }
                }
                // check if its a file, if yes return the file list and the index
                if (datastore.hasOwnProperty('items')) {
                    for (n = 0, l = datastore.items.length; n < l; n++) {
                        if (datastore.items[n].id == to_search) {
                            return [datastore.items, n];
                            // datastore.items.splice(n, 1);
                            // return true;
                        }
                    }
                }
                // something went wrong, couldn't find the file / folder here
                return false;
            }

            for (n = 0, l= datastore.folders.length; n < l; n++) {
                if (datastore.folders[n].id == to_search) {
                    return find_in_datastore(rest, datastore.folders[n]);
                }
            }
            return false;
        };

        /**
         * fills other_children with all child shares of a given path
         *
         * @param path
         * @param datastore
         * @param other_children
         * @param obj
         */
        var get_all_child_shares = function(path, datastore, other_children, obj) {

            if (typeof obj === 'undefined') {
                var path_copy = path.slice();
                var search = find_in_datastore(path_copy, datastore);
                obj = search[0][search[1]];
                return get_all_child_shares(path, datastore, other_children, obj)
            } else if (obj === false) {
                // TODO Handle not found
                alert("HANDLE not found!");
            } else {

                for (var n = 0, l = obj.folders.length; n < l; n++) {
                    if (typeof(obj.folders[n].share_id) !== 'undefined') {
                        other_children.push(obj.folders[n]);
                    }
                    get_all_child_shares(path, obj, other_children, obj.folders[n]);
                }
            }
        };

        /**
         * returns the relative path
         *
         * @param share
         * @param absolute_path
         * @returns {Array}
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
                    } else if (share.id == path_copy[i]) {
                        passed = true;
                    }
                }
            }

            return relative_path
        };


        /**
         * triggered once a new share is added. Searches the datastore for the closest share (or the datastore if no
         * share) and adds it to the share_index
         *
         * @param share_id
         * @param path path to the new share
         * @param datastore
         * @returns {*[]} paths to update
         */
        var on_share_added = function (share_id, path, datastore) {

            var changed_paths = [];
            var i, l;

            var path_copy = path.slice();
            var path_copy2 = path.slice();
            var path_copy3 = path.slice();
            var path_copy4 = path.slice();

            var parent_share = managerShare.get_closest_parent_share(path_copy, datastore, datastore, 1);

            if (typeof(parent_share.share_index) == 'undefined') {
                parent_share.share_index = {};
            }
            if (typeof(parent_share.share_index[share_id]) == 'undefined') {

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

                    if (typeof(share.share_index) == 'undefined') {
                        share.share_index = {};
                    }

                    if (typeof(share.share_index[old_share_id]) == 'undefined') {
                        share.share_index[old_share_id] = {
                            paths: [],
                            secret_key: parent_share.share_index[old_share_id].secret_key
                        };
                    }
                    share.share_index[old_share_id].paths.push(new_relative_path);

                    if (parent_share.share_index[old_share_id].paths.length == 0) {
                        delete parent_share.share_index[old_share_id];
                    }

                    if (Object.keys(parent_share.share_index).length == 0) {
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
         * triggered once a new share is deleted. Searches the datastore for the closest share (or the datastore if no
         * share) and removes it from the share_index
         *
         * @param share_id
         * @param path path to the deleted share
         * @param datastore
         * @returns {*[]} paths to update
         */
        var on_deleted = function (share_id, path, datastore) {

            var path_copy = path.slice();
            var share = managerShare.get_closest_parent_share(path_copy, datastore, datastore, 1);
            var relative_path = get_relative_path(share, path.slice());

            var update_share_index = function(share, share_id, relative_path, allow_multiples) {
                var already_found = false;

                for (var i = 0, l = share.share_index[share_id].paths.length; i < l; i++) {
                    if (helper.array_starts_with(share.share_index[share_id].paths[i], relative_path)) {
                        share.share_index[share_id].paths.splice(i, 1);
                        already_found = true;
                    }
                    if (share.share_index[share_id].paths.length == 0) {
                        delete share.share_index[share_id];
                    }
                    if (Object.keys(share.share_index).length == 0) {
                        delete share.share_index;
                    }
                    if (!allow_multiples && already_found) {
                        break;
                    }
                }
            };

            if (share_id === null) {
                // we have to check all shares
                for (share_id in share.share_index) {
                    if (!share.share_index.hasOwnProperty(share_id)){
                        continue;
                    }
                    update_share_index(share, share_id, relative_path, true);

                }
            } else if (typeof(share.share_index) !== 'undefined'
                && typeof(share.share_index[share_id]) !== 'undefined') {
                update_share_index(share, share_id, relative_path, false);
            }

            // TODO trigger share delete on server. server deletes sshare if noonce has access rights.
            return [path]
        };

        /**
         * triggered once a share moved. handles the update of the share_index
         *
         * @param share_id
         * @param old_path
         * @param new_path
         * @param datastore
         * @returns {*[]} paths to update
         */
        var on_share_moved = function(share_id, old_path, new_path, datastore) {


            var paths_updated1 = on_share_added(share_id, new_path, datastore);
            var paths_updated2 = on_deleted(share_id, old_path, datastore);

            return paths_updated1.concat(paths_updated2);

        };

        itemBlueprint.register('generate', passwordGenerator.generate);
        itemBlueprint.register('get_password_datastore', get_password_datastore);
        itemBlueprint.register('save_datastore', save_datastore);
        itemBlueprint.register('find_in_datastore', find_in_datastore);
        itemBlueprint.register('on_share_added', on_share_added);

        return {
            get_password_datastore: get_password_datastore,
            save_datastore: save_datastore,
            generatePassword: generatePassword,
            generatePasswordActiveTab: generatePasswordActiveTab,
            find_in_datastore: find_in_datastore,
            on_share_added: on_share_added,
            on_share_moved: on_share_moved,
            on_deleted: on_deleted
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("managerDatastorePassword", ['$q', '$rootScope', 'managerSecret', 'managerDatastore', 'managerShare', 'passwordGenerator', 'itemBlueprint', 'helper', managerDatastorePassword]);

}(angular, uuid));