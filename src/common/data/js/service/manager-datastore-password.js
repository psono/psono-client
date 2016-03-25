(function(angular, uuid) {
    'use strict';

    var managerDatastorePassword = function($q, managerSecret, managerDatastore, managerShare, passwordGenerator, itemBlueprint, helper) {

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

        var read_shares_recursive = function(datastore, index, all_share_data) {

            if (typeof index === 'undefined') {
                return datastore;
            }

            var all_calls = [];

            for (var share_id in index) {
                if (!index.hasOwnProperty(share_id)) {
                    continue;
                }

                for (var i = 0; i < index[share_id].paths.length; i++) {


                    var path_copy = index[share_id].paths[i].slice();
                    var search = find_in_datastore(path_copy, datastore);
                    var sub_datastore = search[0][search[1]];

                    if (all_share_data.hasOwnProperty(share_id)) {
                        update_paths_with_data(datastore, index[share_id].paths[i], all_share_data[share_id]);
                        continue;
                    }

                    all_calls.push((function(share_id, sub_datastore, path) {

                        var onSuccess = function(data) {

                            all_share_data[share_id] = data;

                            update_paths_with_data(datastore, path, data);

                            read_shares_recursive(sub_datastore, data.share_index, all_share_data);
                        };

                        var onError = function () {
                            // pass
                        };

                        return managerShare.read_share(share_id, index[share_id].secret_key)
                            .then(onSuccess, onError);
                    })(share_id, sub_datastore, index[share_id].paths[i]));

                }
            }

            return $q.all(all_calls).then(function (ret) {
                return datastore;
            });
        };

        var hide_sub_share_content = function (share) {

            var allowed_props = ['id', 'name', 'share_id', 'share_secret_key'];

            for (var share_id in share.share_index) {
                if (!share.share_index.hasOwnProperty(share_id)) {
                    continue;
                }

                for (var i = 0; i < share.share_index[share_id].paths.length; i++) {
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
         * @returns {promise}
         */
        var get_password_datastore = function() {
            var type = "password";
            var description = "default";


            var onSuccess = function (datastore) {

                managerDatastore.fill_storage('datastore-password-leafs', datastore, [
                    ['key', 'secret_id'],
                    ['secret_id', 'secret_id'],
                    ['value', 'secret_key'],
                    ['name', 'name'],
                    ['urlfilter', 'urlfilter'],
                    ['search', 'urlfilter']

                ]);

                return read_shares_recursive(datastore, datastore.share_index, {});
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
        var save_password_datastore = function (datastore, paths) {
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

            // TODO handle path and maybe do not really update the datastore itself but only shares

            var closest_shares = {};

            for (var i = 0; i < paths.length; i++) {

                var closest_share = get_closest_parent(paths[i], datastore, datastore, 0);
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

                        console.log("password datastore loaded successfully");

                        var datastore_object = {
                            id: uuid.v4(),
                            type: 'website_password',
                            name: "Generated for " + parsed_url.authority,
                            urlfilter: parsed_url.authority,
                            secret_id: e.secret_id,
                            secret_key: e.secret_key
                        };

                        data.items.push(datastore_object);

                        save_password_datastore(data);
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

            var rest = [];
            for (var i = 0; i < path.length; i++) {
                if (i == 0) {
                    to_search = path[i];
                } else {
                    rest.push(path[i]);
                }
            }

            var n = undefined;

            if (rest.length == 0) {
                // found the parent
                // check if the object is a folder, if yes return the folder list and the index
                if (datastore.hasOwnProperty('folders')) {
                    for (n = 0; n < datastore.folders.length; n++) {
                        if (datastore.folders[n].id == to_search) {
                            return [datastore.folders, n];
                            // datastore.folders.splice(n, 1);
                            // return true;
                        }
                    }
                }
                // check if its a file, if yes return the file list and the index
                if (datastore.hasOwnProperty('items')) {
                    for (n = 0; n < datastore.items.length; n++) {
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

            for (n = 0; n < datastore.folders.length; n++) {
                if (datastore.folders[n].id == to_search) {
                    return find_in_datastore(rest, datastore.folders[n]);
                }
            }
            return false;
        };

        /**
         * returns the closest share. if no share exists for the specified path, the initially specified closest_share
         * is returned.
         *
         * @param path
         * @param datastore
         * @param closest_share
         * @param distance
         * @returns {*}
         */
        var get_closest_parent = function(path, datastore, closest_share, distance) {

            if (path.length == distance) {
                return closest_share;
            }
            
            var to_search = path.shift();

            for (var n = 0; n < datastore.folders.length; n++) {
                if (datastore.folders[n].id == to_search) {
                    if (typeof(datastore.folders[n].share_id) !== 'undefined') {
                        return get_closest_parent(path, datastore.folders[n], datastore.folders[n], distance);
                    } else {
                        return get_closest_parent(path, datastore.folders[n], closest_share, distance);
                    }
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

                for (var n = 0; n < obj.folders.length; n++) {
                    if (typeof(obj.folders[n].share_id) !== 'undefined') {
                        other_children.push(obj.folders[n]);
                    }
                    get_all_child_shares(path, obj, other_children, obj.folders[n]);
                }
            }
        };

        var get_relative_path = function(share, path) {

            var path_copy = path.slice();

            // lets create the relative path in the share
            var rest = [];

            if (typeof share.id === 'undefined') {
                // we have the datastore, so we need the complete path
                rest = path_copy;
            } else {
                var passed = false;
                for (var i = 0; i < path_copy.length; i++) {
                    if (passed) {
                        rest.push(path_copy[i]);
                    } else if (share.id == path_copy[i]) {
                        passed = true;
                    }
                }
            }

            return rest
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


            var path_copy = path.slice();
            var path_copy2 = path.slice();
            var path_copy3 = path.slice();


            var share = get_closest_parent(path_copy, datastore, datastore, 1);

            if (typeof(share.share_index) == 'undefined') {
                share.share_index = {};
            }
            if (typeof(share.share_index[share_id]) == 'undefined') {

                var search = find_in_datastore(path_copy2, datastore);
                var obj = search[0][search[1]];

                share.share_index[share_id] = {
                    paths: [],
                    secret_key: obj.share_secret_key
                };
            }

            // lets create the relative path in the share
            var relative_path = get_relative_path(share, path_copy3);

            share.share_index[share_id].paths.push(relative_path);

            return [path]
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
        var on_share_deleted = function (share_id, path, datastore) {

            var path_copy = path.slice();

            var share = get_closest_parent(path_copy, datastore, datastore, 1);
            var relative_path = get_relative_path(share, path.slice());

            var already_found = false;

            if (typeof(share.share_index) !== 'undefined'
                && typeof(share.share_index[share_id]) !== 'undefined') {
                for (var i = 0; i < share.share_index[share_id].paths.length; i++) {
                    if (helper.is_array_equal(share.share_index[share_id].paths[i], relative_path)) {
                        share.share_index[share_id].paths.splice(i, 1);
                        already_found = true;
                    }
                    if (share.share_index[share_id].paths.length == 0) {
                        delete share.share_index[share_id];
                    }
                    if (already_found) {
                        break;
                    }
                }
                if (Object.keys(share.share_index).length == 0) {
                    delete share.share_index;
                }
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
            var paths_updated2 = on_share_deleted(share_id, old_path, datastore);

            return paths_updated1.concat(paths_updated2);

        };

        itemBlueprint.register('generate', passwordGenerator.generate);
        itemBlueprint.register('get_password_datastore', get_password_datastore);
        itemBlueprint.register('save_password_datastore', save_password_datastore);
        itemBlueprint.register('find_in_datastore', find_in_datastore);
        itemBlueprint.register('on_share_added', on_share_added);

        return {
            get_password_datastore: get_password_datastore,
            save_password_datastore: save_password_datastore,
            generatePassword: generatePassword,
            generatePasswordActiveTab: generatePasswordActiveTab,
            find_in_datastore: find_in_datastore,
            on_share_added: on_share_added,
            on_share_deleted: on_share_deleted,
            on_share_moved: on_share_moved
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("managerDatastorePassword", ['$q', 'managerSecret', 'managerDatastore', 'managerShare', 'passwordGenerator', 'itemBlueprint', 'helper', managerDatastorePassword]);

}(angular, uuid));