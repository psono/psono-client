(function (angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerWidget
     * @requires $rootScope
     * @requires $window
     * @requires $uibModal
     * @requires $timeout
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerDatastore
     * @requires psonocli.managerShare
     * @requires psonocli.managerSecret
     * @requires psonocli.managerShareLink
     * @requires psonocli.managerSecretLink
     * @requires psonocli.managerFileLink
     * @requires psonocli.itemBlueprint
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Service that is something like the base class for adf widgets
     */

    var managerWidget = function ($rootScope, $window, $uibModal, $timeout, managerDatastorePassword, managerDatastoreUser,
                                  managerDatastore, managerShare, managerSecret, managerShareLink,
                                  managerSecretLink, managerFileLink, itemBlueprint, cryptoLibrary) {


        /**
         * @ngdoc
         * @name psonocli.managerWidget#open_new_folder
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Opens the modal to create a new folder
         *
         * @param {TreeObject} parent The parent of the new folder
         * @param {Array} path The path to the parent of the new folder
         * @param {TreeObject} data_structure the data structure
         * @param {Object} manager manager responsible for
         */
        var open_new_folder = function (parent, path, data_structure, manager) {

            var modalInstance = $uibModal.open({
                templateUrl: 'view/modal/new-folder.html',
                controller: 'ModalNewFolderCtrl',
                backdrop: 'static',
                resolve: {
                }
            });

            modalInstance.result.then(function (name) {
                var onSuccess, onError;

                if (typeof parent === 'undefined') {
                    parent = data_structure;
                }

                if (typeof parent.folders === 'undefined') {
                    parent.folders = [];
                }

                var datastore_object = {
                    id: cryptoLibrary.generate_uuid(),
                    name: name
                };

                parent.folders.push(datastore_object);

                parent['expanded'] = true;

                var closest_share_info = managerShare.get_closest_parent_share(path.slice(), data_structure,
                    data_structure, 0);

                var closest_share = closest_share_info['closest_share'];

                if (closest_share.hasOwnProperty('share_id')) {
                    datastore_object['parent_share_id'] = closest_share['share_id'];
                } else {
                    datastore_object['parent_datastore_id'] = closest_share['datastore_id'];
                }

                if (closest_share.hasOwnProperty('datastore_id')) {
                    datastore_object['share_rights'] = {
                        "read": true,
                        "write": true,
                        "grant": true,
                        "delete": true
                    };
                } else {
                    datastore_object['share_rights'] = {
                        "read": closest_share['share_rights']['read'],
                        "write": closest_share['share_rights']['write'],
                        "grant": closest_share['share_rights']['grant'] && closest_share['share_rights']['write'],
                        "delete": closest_share['share_rights']['write']
                    };
                }

                managerDatastorePassword.update_paths_recursive(data_structure, []);

                if (closest_share.hasOwnProperty('share_id')) {
                    // refresh share content before updating the share
                    onSuccess = function(content) {
                        var parent;
                        if (closest_share_info['relative_path'].length === 0) {
                            parent = content.data
                        } else {
                            var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], content.data);
                            parent = search[0][search[1]];
                        }

                        if (typeof parent.folders === 'undefined') {
                            parent.folders = [];
                        }
                        parent.folders.push(datastore_object);
                        managerShare.write_share(closest_share['share_id'], content.data, closest_share['share_secret_key']);

                        manager.handle_datastore_content_changed(data_structure);
                    };

                    onError = function(e) {
                        // pass

                    };
                    managerShare.read_share(closest_share['share_id'], closest_share['share_secret_key'])
                        .then(onSuccess, onError);
                } else {
                    // refresh datastore content before updating it
                    onError = function(result) {
                        // pass
                    };

                    onSuccess = function (datastore) {
                        var parent;
                        if (closest_share_info['relative_path'].length === 0) {
                            parent = datastore
                        } else {
                            var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], datastore);
                            parent = search[0][search[1]];
                        }

                        if (typeof parent.folders === 'undefined') {
                            parent.folders = [];
                        }
                        parent.folders.push(datastore_object);
                        manager.save_datastore_content(datastore, [path]);

                        manager.handle_datastore_content_changed(data_structure);
                    };

                    return manager.get_datastore_with_id(closest_share['datastore_id'])
                        .then(onSuccess, onError);
                }

            }, function () {
                // cancel triggered
            });
        };

        /**
         * @ngdoc
         * @name psonocli.managerWidget#open_edit_folder
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Opens the modal to edit a folder
         *
         * @param {object} node The node you want to edit
         * @param {Array} path The path to the node
         * @param {TreeObject} data_structure the data structure
         * @param {Object} manager manager responsible for
         * @param {string} size The size of the modal
         */
        var open_edit_folder = function (node, path, data_structure, manager, size) {

            var modalInstance = $uibModal.open({
                templateUrl: 'view/modal/edit-folder.html',
                controller: 'ModalEditFolderCtrl',
                backdrop: 'static',
                size: size,
                resolve: {
                    node: function () {
                        return node;
                    },
                    path: function () {
                        return path;
                    }
                }
            });

            modalInstance.result.then(function (name) {

                var onSuccess, onError;

                // change visual representation
                node.name = name;

                var closest_share_info = managerShare.get_closest_parent_share(path.slice(), data_structure,
                    data_structure, 0);
                var closest_share = closest_share_info['closest_share'];


                if (closest_share.hasOwnProperty('share_id')) {
                    // refresh share content before updating the share
                    onSuccess = function(content) {
                        var folder;
                        if (closest_share_info['relative_path'].length === 0) {
                            folder = content.data
                        } else {
                            var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], content.data);
                            folder = search[0][search[1]];
                        }
                        folder.name = name;
                        managerShare.write_share(closest_share['share_id'], content.data, closest_share['share_secret_key']);
                        manager.handle_datastore_content_changed(data_structure);
                    };

                    onError = function(e) {
                        // pass

                    };
                    managerShare.read_share(closest_share['share_id'], closest_share['share_secret_key'])
                        .then(onSuccess, onError);
                } else {
                    // refresh datastore content before updating it
                    onError = function(result) {
                        // pass
                    };

                    onSuccess = function (datastore) {
                        var folder;
                        if (closest_share_info['relative_path'].length === 0) {
                            folder = datastore
                        } else {
                            var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], datastore);
                            folder = search[0][search[1]];
                        }

                        folder.name = name;
                        manager.save_datastore_content(datastore, [path]);
                        manager.handle_datastore_content_changed(data_structure);
                    };

                    return managerDatastore.get_datastore_with_id(closest_share['datastore_id'])
                        .then(onSuccess, onError);
                }


            }, function () {
                // cancel triggered
            });
        };

        /**
         * @ngdoc
         * @name psonocli.managerWidget#open_new_item
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Opens the modal for a new entry
         *
         * @param {TreeObject} datastore The Datastore object
         * @param {TreeObject} parent The parent
         * @param {Array} path The path to the parent
         * @param {string} size The size of the modal
         * @param {Object} manager manager responsible for
         */
        var open_new_item = function (datastore, parent, path, size, manager) {

            if (typeof parent === 'undefined') {
                parent = datastore;
            }

            var modalInstance = $uibModal.open({
                templateUrl: 'view/modal/new-entry.html',
                controller: 'ModalDatastoreNewEntryCtrl',
                backdrop: 'static',
                size: size,
                resolve: {
                    parent: function () {
                        return parent;
                    },
                    path: function () {
                        return path;
                    }
                }
            });

            modalInstance.result.then(function (content) {

                if (typeof content === 'undefined') {
                    return;
                }

                var datastore_object = {
                    id: content['link_id'],
                    type: content.id
                };
                var secret_object = {};

                if (itemBlueprint.get_blueprint(content.id).getName) {
                    datastore_object.name = itemBlueprint.get_blueprint(content.id).getName(content.fields);
                }

                for (var i = content.fields.length - 1; i >= 0; i--) {

                    if (!content.fields[i].hasOwnProperty("value")) {
                        continue;
                    }
                    if (!datastore_object.name && content.title_field === content.fields[i].name) {
                        datastore_object.name = content.fields[i].value;
                    }
                    if (content.hasOwnProperty("urlfilter_field")
                        && content.urlfilter_field === content.fields[i].name) {
                        datastore_object.urlfilter = content.fields[i].value;
                    }
                    if (content.hasOwnProperty("autosubmit_field")
                        && content.autosubmit_field === content.fields[i].name) {
                        datastore_object.autosubmit = content.fields[i].value;
                    }

                    if (content.hasOwnProperty("non_secret_fields")
                        && content.non_secret_fields.indexOf(content.fields[i].name) !== -1) {
                        datastore_object[content.fields[i].name] = content.fields[i].value;
                    }

                    secret_object[content.fields[i].name] = content.fields[i].value;
                }

                var onError = function(result) {
                    // pass
                };

                var closest_share_info = managerShare.get_closest_parent_share(path.slice(), datastore,
                    datastore, 0);

                var closest_share = closest_share_info['closest_share'];

                var parent_share_id, parent_datastore_id;

                if (closest_share.hasOwnProperty('share_id')) {
                    parent_share_id = closest_share['share_id'];
                    datastore_object['parent_share_id'] = closest_share['share_id'];
                } else {
                    parent_datastore_id = closest_share['datastore_id'];
                    datastore_object['parent_datastore_id'] = closest_share['datastore_id'];
                }

                if (closest_share.hasOwnProperty('datastore_id')) {
                    datastore_object['share_rights'] = {
                        "read": true,
                        "write": true,
                        "grant": true,
                        "delete": true
                    };
                } else {
                    datastore_object['share_rights'] = {
                        "read": closest_share['share_rights']['read'],
                        "write": closest_share['share_rights']['write'],
                        "grant": closest_share['share_rights']['grant'] && closest_share['share_rights']['write'],
                        "delete": closest_share['share_rights']['write']
                    };
                }


                var save_datastore = function() {

                    var onSuccess, onError;

                    // update visual representation
                    if (typeof parent.items === 'undefined') {
                        parent.items = [];
                    }
                    parent.items.push(datastore_object);
                    parent['expanded'] = true;
                    managerDatastorePassword.update_paths_recursive(datastore, []);

                    if (closest_share.hasOwnProperty('share_id')) {
                        // refresh share content before updating the share
                        onSuccess = function(content) {
                            var parent;
                            if (closest_share_info['relative_path'].length === 0) {
                                parent = content.data
                            } else {
                                var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], content.data);
                                parent = search[0][search[1]];
                            }

                            if (typeof parent.items === 'undefined') {
                                parent.items = [];
                            }
                            parent.items.push(datastore_object);

                            managerShare.write_share(closest_share['share_id'], content.data, closest_share['share_secret_key']);
                            manager.handle_datastore_content_changed(datastore);
                        };

                        onError = function(e) {
                            // pass

                        };
                        managerShare.read_share(closest_share['share_id'], closest_share['share_secret_key'])
                            .then(onSuccess, onError);
                    } else {
                        // refresh datastore content before updating it
                        onError = function(result) {
                            // pass
                        };

                        onSuccess = function (datastore) {
                            var parent;
                            if (closest_share_info['relative_path'].length === 0) {
                                parent = datastore
                            } else {
                                var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], datastore);
                                parent = search[0][search[1]];
                            }

                            if (typeof parent.items === 'undefined') {
                                parent.items = [];
                            }
                            parent.items.push(datastore_object);
                            managerDatastorePassword.save_datastore_content(datastore, [path]);
                            manager.handle_datastore_content_changed(datastore);
                        };

                        return manager.get_datastore_with_id(closest_share['datastore_id'])
                            .then(onSuccess, onError);
                    }

                    // reset form fields
                    for (var i = content.fields.length - 1; i >= 0; i--) {
                        if (!content.fields[i].hasOwnProperty("value")) {
                            continue;
                        }
                        content.fields[i].value = '';
                    }
                };

                var onSuccess = function(e) {
                    datastore_object['secret_id'] = e.secret_id;
                    datastore_object['secret_key'] = e.secret_key;
                    save_datastore();

                };

                if (content.skipSecretCreate) {
                    save_datastore();
                } else {
                    managerSecret.create_secret(
                        secret_object,
                        content['link_id'],
                        parent_datastore_id,
                        parent_share_id,
                        content['callback_data']['callback_url'],
                        content['callback_data']['callback_user'],
                        content['callback_data']['callback_pass']
                    )
                        .then(onSuccess, onError);
                }

            }, function () {
                // cancel triggered
            });
        };

        /**
         * @ngdoc
         * @name psonocli.managerWidget#open_edit_item
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Opens the modal for a the edit entry
         *
         * @param {TreeObject} datastore The Datastore object
         * @param {object} node The node to edit
         * @param {Array} path The path to the item
         * @param {string} size The size of the modal
         * @param {Object} manager manager responsible for
         */
        var open_edit_item = function(datastore, node, path, size, manager) {

            var onError = function(result) {
                console.log(result);
                // pass
            };

            var onSuccess = function(data) {

                function onSave (new_content) {

                    // update visual representation
                    var secret_object = {};
                    for (var i = new_content.fields.length - 1; i >= 0; i--) {

                        if (!new_content.fields[i].hasOwnProperty("value")) {
                            continue;
                        }
                        if (new_content.title_field === new_content.fields[i].name) {
                            node.name = new_content.fields[i].value;
                        }
                        if (new_content.hasOwnProperty("urlfilter_field")
                            && new_content.urlfilter_field === new_content.fields[i].name) {
                            node.urlfilter = new_content.fields[i].value;
                        }
                        if (new_content.hasOwnProperty("autosubmit_field")
                            && new_content.autosubmit_field === new_content.fields[i].name) {
                            node.autosubmit = new_content.fields[i].value;
                        }
                        secret_object[new_content.fields[i].name] = new_content.fields[i].value;
                    }

                    var onError = function(result) {
                        // pass
                    };

                    var onSuccess = function(e) {

                        var onSuccess, onError;

                        var closest_share_info = managerShare.get_closest_parent_share(path.slice(), datastore,
                            datastore, 0);

                        var closest_share = closest_share_info['closest_share'];

                        if (closest_share.hasOwnProperty('share_id')) {
                            // refresh share content before updating the share
                            onSuccess = function(content) {
                                var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], content.data);
                                node = search[0][search[1]];

                                for (var i = new_content.fields.length - 1; i >= 0; i--) {
                                    if (!new_content.fields[i].hasOwnProperty("value")) {
                                        continue;
                                    }
                                    if (new_content.title_field === new_content.fields[i].name) {
                                        node.name = new_content.fields[i].value;
                                    }
                                    if (new_content.hasOwnProperty("urlfilter_field")
                                        && new_content.urlfilter_field === new_content.fields[i].name) {
                                        node.urlfilter = new_content.fields[i].value;
                                    }
                                    if (new_content.hasOwnProperty("autosubmit_field")
                                        && new_content.autosubmit_field === new_content.fields[i].name) {
                                        node.autosubmit = new_content.fields[i].value;
                                    }
                                }

                                managerShare.write_share(closest_share['share_id'], content.data, closest_share['share_secret_key']);
                                manager.handle_datastore_content_changed(datastore);
                            };

                            onError = function(e) {
                                // pass

                            };
                            managerShare.read_share(closest_share['share_id'], closest_share['share_secret_key'])
                                .then(onSuccess, onError);
                        } else {
                            // refresh datastore content before updating it
                            onError = function(result) {
                                // pass
                            };

                            onSuccess = function (datastore) {
                                var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], datastore);
                                var node = search[0][search[1]];

                                for (var i = new_content.fields.length - 1; i >= 0; i--) {
                                    if (!new_content.fields[i].hasOwnProperty("value")) {
                                        continue;
                                    }
                                    if (new_content.title_field === new_content.fields[i].name) {
                                        node.name = new_content.fields[i].value;
                                    }
                                    if (new_content.hasOwnProperty("urlfilter_field")
                                        && new_content.urlfilter_field === new_content.fields[i].name) {
                                        node.urlfilter = new_content.fields[i].value;
                                    }
                                    if (new_content.hasOwnProperty("autosubmit_field")
                                        && new_content.autosubmit_field === new_content.fields[i].name) {
                                        node.autosubmit = new_content.fields[i].value;
                                    }
                                }

                                managerDatastorePassword.save_datastore_content(datastore, [path]);
                                manager.handle_datastore_content_changed(datastore);
                            };

                            return manager.get_datastore_with_id(closest_share['datastore_id'])
                                .then(onSuccess, onError);
                        }

                        //managerDatastorePassword.save_datastore_content(datastore, [path]);
                    };

                    var bp = itemBlueprint.get_blueprint(node.type);

                    if (bp.hasOwnProperty('preUpdate')) {
                        bp.preUpdate(node, secret_object)
                            .then(onSuccess, onError);
                    } else {
                        managerSecret.write_secret(
                            node.secret_id,
                            node.secret_key,
                            secret_object,
                            new_content['callback_data']['callback_url'],
                            new_content['callback_data']['callback_user'],
                            new_content['callback_data']['callback_pass'])
                            .then(onSuccess, onError);
                    }

                }

                if ($window.innerWidth > 1199) {
                    $rootScope.$broadcast('show-entry-big', {
                        node: node,
                        path: path,
                        data: data,
                        onClose: function() {},
                        onSave: onSave
                    });
                } else {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/edit-entry.html',
                        controller: 'ModalEditEntryCtrl',
                        backdrop: 'static',
                        size: size,
                        resolve: {
                            node: function () {
                                return node;
                            },
                            path: function () {
                                return path;
                            },
                            data: function () {
                                return data;
                            }
                        }
                    });

                    modalInstance.result.then(onSave, function () {
                        // cancel triggered
                    });
                }
            };

            if (typeof(node.secret_id) === 'undefined') {
                if (node.hasOwnProperty('type')) {
                    var bp = itemBlueprint.get_blueprint(node.type);
                    if (bp.hasOwnProperty('convertToSecret')) {
                        onSuccess(bp.convertToSecret(node));
                        return;
                    }
                }
                onSuccess(node)
            } else {
                managerSecret.read_secret(node.secret_id, node.secret_key)
                    .then(onSuccess, onError);
            }

        };

        /**
         * our little helper function that actually checks if and item can move
         *
         * @param element The item to move
         * @param target The target where to put it
         *
         * @returns {boolean} Returns weather its ok to move the item or not
         */
        var canMoveItem = function(element, target) {
            
            if (element.hasOwnProperty('type') && element.type === 'user') {
                return true;
            }

            // prevent the move of shares without grant rights into different shares
            if (element.share_rights.grant === false && element.hasOwnProperty('parent_share_id')
                && target.hasOwnProperty('share_id') && target['share_id'] !== element['parent_share_id']) {

                alert("Sorry, but you you cannot move a share without grant rights into another share.");
                return false;
            }


            // prevent the move of shares without grant rights into different shares
            if (element.share_rights.grant === false && element.hasOwnProperty('parent_share_id')
                && !target.hasOwnProperty('share_id') && target.hasOwnProperty('parent_share_id') && target['parent_share_id'] !== element['parent_share_id']) {

                alert("Sorry, but you you cannot move a share without grant rights into another share.");
                return false;
            }

            return true;
        };

        /**
         * takes any element like shares, folders, items ... and checks if they can be moved
         *
         * @param element The element (shares, folders, items ...) to move
         * @param target The target where to put it
         *
         * @returns {boolean} Returns weather its ok to move the element or not
         */
        var canMoveFolder = function(element, target) {
            var i;

            // Start of the actual rights checking

            // prevent the move of anything into a target without right writes
            if (target.hasOwnProperty("share_rights") && target.share_rights.write === false) {
                alert("Sorry, but you don't have write rights on target");
                return false;
            }

            // we are moving a share, so its unnecessary to check any lower item / folder rights
            if (element.hasOwnProperty('share_id')) {
                return canMoveItem(element, target);
            }

            // checks if we maybe have an item itself
            if (element.hasOwnProperty('type')) {
                if (canMoveItem(element, target) === false) {
                    return false;
                }
            }

            // checks if we have a folder with items
            if (element.hasOwnProperty('items') && element.items.length > 0) {
                for (i = element.items.length - 1; i >= 0; i--) {
                    if (canMoveItem(element.items[i], target) === false) {
                        return false;
                    }
                }
            }

            // checks if we have a folder with folders
            if (element.hasOwnProperty('folders') && element.folders.length > 0) {
                for (i = element.folders.length - 1; i >= 0; i--) {
                    if (canMoveFolder(element.folders[i], target) === false) {
                        return false;
                    }
                }
            }

            // Nothing is blocking our move
            return true;
        };

        /**
         * @ngdoc
         * @name psonocli.managerWidget#check_if_parent_changed
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Tests if a parent changed or stayed the same
         *
         * Returns true if the parent changed
         * Returns false if the parent stayed the same
         *
         * If its unsure what to do this function will return false
         *
         * @param element The element that is changing
         * @param target The new parent
         *
         * @returns {boolean}
         */
        var check_if_parent_changed = function (element, target) {

            var test1 = target.hasOwnProperty('share_id') &&
                typeof(target['share_id']) !== 'undefined' &&
                target['share_id'] !== null &&
                target['share_id'] !== '' && (
                    !element.hasOwnProperty("parent_share_id") ||
                    typeof(element['parent_share_id']) === 'undefined' ||
                    element['parent_share_id'] === null ||
                    target['share_id'] !== element['parent_share_id']
                );

            var test2 = target.hasOwnProperty('datastore_id') &&
                typeof(target['datastore_id']) !== 'undefined' &&
                target['datastore_id'] !== null &&
                target['datastore_id'] !== '' && (
                    !element.hasOwnProperty("parent_datastore_id") ||
                    typeof(element['parent_datastore_id']) === 'undefined' ||
                    element['parent_datastore_id'] === null ||
                    target['datastore_id'] !== element['parent_datastore_id']
                );

            var test3 = target.hasOwnProperty('parent_datastore_id') &&
                typeof(target['parent_datastore_id']) !== 'undefined' &&
                target['parent_datastore_id'] !== null &&
                target['parent_datastore_id'] !== '' && (
                    !element.hasOwnProperty("parent_datastore_id") ||
                    typeof(element['parent_datastore_id']) === 'undefined' ||
                    element['parent_datastore_id'] === null ||
                    target['parent_datastore_id'] !== element['parent_datastore_id']
                );

            var test4 = target.hasOwnProperty('parent_share_id') &&
                typeof(target['parent_share_id']) !== 'undefined' &&
                target['parent_share_id'] !== null &&
                target['parent_share_id'] !== '' && (
                    !element.hasOwnProperty("parent_share_id") ||
                    typeof(element['parent_share_id']) === 'undefined' ||
                    element['parent_share_id'] === null ||
                    target['parent_share_id'] !== element['parent_share_id']
                );

            return test1 || test2 || test3 || test4;
        };


        /**
         * @ngdoc
         * @name psonocli.managerWidget#move_item
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Move an item (or folder) from one position to anther
         *
         * @param {TreeObject} datastore The datastore
         * @param {Array} item_path the current path of the item
         * @param {Array} target_path the path where we want to put the item
         * @param {string} type type of the item ('items' or 'folders')
         * @param {string} datastore_type The type of the datastore (e.g. 'password' or 'user')
         */
        var move_item = function(datastore, item_path, target_path, type, datastore_type) {

            var i;
            var closest_parent;
            var closest_share_info;

            var orig_item_path = item_path.slice();
            orig_item_path.pop();

            var orig_target_path;

            if (type !== 'items' && type !== 'folders') {
                return
            }
            
            var onSuccess = function (datastore) {
                if (target_path === null || typeof(target_path) === 'undefined') {
                    orig_target_path = [];
                } else {
                    orig_target_path = target_path.slice();
                }

                var target = datastore;
                if (target_path !== null && typeof(target_path) !== 'undefined') {
                    // find drop zone
                    var val1 = managerDatastorePassword.find_in_datastore(target_path, datastore);
                    target = val1[0][val1[1]];
                }

                // find element
                try {
                    var val2 = managerDatastorePassword.find_in_datastore(item_path, datastore);
                } catch (e) {
                    return;
                }

                var element = val2[0][val2[1]];

                // check if we have folders / items array, otherwise create the array
                if (!target.hasOwnProperty(type)) {
                    target[type] = [];
                }

                //prevent the move of shares if rights are not sufficient
                if (!canMoveFolder(element, target)) {
                    return;
                }

                // add the element to the other folders / items
                target[type].push(element);


                // delete the array at hte current position
                val2[0].splice(val2[1], 1);

                var target_path_copy = orig_target_path.slice();
                var target_path_copy2 = orig_target_path.slice();
                var target_path_copy3 = orig_target_path.slice();
                var item_path_copy = orig_item_path.slice();
                target_path_copy.push(element.id);
                item_path_copy.push(element.id);

                // lets populate our child shares that we need to handle
                var child_shares = [];
                if (element.hasOwnProperty("share_id")) {
                    //we moved a share
                    child_shares.push({
                        share: element,
                        path: []
                    });
                } else {
                    managerDatastorePassword.get_all_child_shares_by_path([], datastore, child_shares, element);
                }
                var secret_links = managerDatastorePassword.get_all_secret_links(element);
                var file_links = managerDatastorePassword.get_all_file_links(element);

                // lets update for every child_share the share_index
                for (i = child_shares.length - 1; i >= 0; i--) {
                    managerDatastorePassword.on_share_moved(
                        child_shares[i].share.share_id, item_path_copy.concat(child_shares[i].path),
                        target_path_copy.concat(child_shares[i].path), datastore, 1,
                        child_shares[i].path.length + 1);
                }

                managerDatastorePassword.update_paths_recursive(datastore, []);

                // and save everything (before we update the links and might lose some necessary rights)
                if (datastore_type === 'password') {
                    managerDatastorePassword.handle_datastore_content_changed(datastore);
                    managerDatastorePassword.save_datastore_content(datastore, [orig_item_path, orig_target_path]);
                } else {
                    managerDatastoreUser.save_datastore_content(datastore, [orig_item_path, orig_target_path]);
                }


                var timeout = 0;

                // adjust the links for every child_share (and therefore update the rights)
                for (i = child_shares.length - 1; i >= 0; i--) {
                    (function(child_share) {
                        timeout = timeout + 50;
                        $timeout(function(){
                            closest_share_info = managerShare.get_closest_parent_share(
                                target_path_copy.concat(child_share.path), datastore, datastore, 1
                            );
                            closest_parent = closest_share_info['closest_share'];

                            managerShareLink.on_share_moved(child_share.share.id, closest_parent);
                        }, timeout);
                    })(child_shares[i])
                }

                // if parent_share or parent_datastore did not change, then we are done here
                if (!check_if_parent_changed(element, target)) {
                    return;
                }

                // adjust the links for every secret link (and therefore update the rights)
                for (i = secret_links.length - 1; i >= 0; i--) {
                    (function(secret_link) {
                        timeout = timeout + 50;
                        $timeout(function(){
                            closest_share_info = managerShare.get_closest_parent_share(
                                target_path_copy2.concat(secret_link.path), datastore, datastore, 0
                            );
                            closest_parent = closest_share_info['closest_share'];
                            managerSecretLink.on_secret_moved(secret_link.id, closest_parent);
                        }, timeout);
                    })(secret_links[i])
                }

                // adjust the links for every file link (and therefore update the rights)
                for (i = file_links.length - 1; i >= 0; i--) {
                    (function(file_link) {
                        timeout = timeout + 50;
                        $timeout(function(){
                            closest_share_info = managerShare.get_closest_parent_share(
                                target_path_copy2.concat(file_link.path), datastore, datastore, 0
                            );
                            closest_parent = closest_share_info['closest_share'];
                            managerFileLink.on_file_moved(file_link.id, closest_parent);
                        }, timeout);
                    })(file_links[i])
                }

                // update the parents inside of the new target
                closest_share_info = managerShare.get_closest_parent_share(
                    target_path_copy3, datastore, datastore, 0
                );
                closest_parent = closest_share_info['closest_share'];

                var new_parent_datastore_id = undefined;
                var new_parent_share_id = undefined;
                if (closest_parent.hasOwnProperty('datastore_id')) {
                    new_parent_datastore_id = closest_parent.datastore_id;
                } else {
                    new_parent_share_id = closest_parent.share_id;
                }

                element.parent_datastore_id = new_parent_datastore_id;
                element.parent_share_id = new_parent_share_id;

                managerDatastorePassword.update_parents(element, new_parent_share_id, new_parent_datastore_id);
            }
            
            
            if (datastore_type === 'password') {
                return managerDatastorePassword.get_password_datastore(datastore.datastore_id).then(onSuccess);
            } else {
                return managerDatastore.get_datastore_with_id(datastore.datastore_id).then(onSuccess);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerWidget#delete_item
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Called when an item is supposed to be deleted
         * 
         * For Password Datastore:
         * It will be marked as deleted or really deleted if it is already marked as deleted.
         * 
         * For User Datastore:
         * It will always permanently trigger the deletion
         *
         * @param {TreeObject} datastore The datastore
         * @param {object} item The item to delete
         * @param {Array} path The path to the item
         * @param {string} datastore_type The type of the datastore (e.g. 'password' or 'user')
         */
        var delete_item = function(datastore, item, path, datastore_type) {
            if (datastore_type === 'user' || (item.hasOwnProperty('deleted') && item['deleted'])) {
                delete_item_permanent(datastore, item, path, datastore_type);
            } else {
                mark_item_as_deleted(datastore, item, path, datastore_type);
            }
        }

        /**
         * @ngdoc
         * @name psonocli.managerWidget#mark_item_as_deleted
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Marks an item as deleted
         *
         * @param {TreeObject} datastore The datastore
         * @param {object} item The item to delete
         * @param {Array} path The path to the item
         * @param {string} datastore_type The type of the datastore (e.g. 'password' or 'user')
         */
        var mark_item_as_deleted = function(datastore, item, path, datastore_type) {

            var onSuccess, onError;
            var element_path_that_changed = path.slice();
            element_path_that_changed.pop();

            var search = managerDatastorePassword.find_in_datastore(path.slice(), datastore);
            var element = search[0][search[1]];

            element['deleted'] = true;
            
            var closest_share_info = managerShare.get_closest_parent_share(path.slice(), datastore,
                datastore, 1);

            var closest_share = closest_share_info['closest_share'];
            
            if (datastore_type === 'password') {
                if (closest_share.hasOwnProperty('share_id')) {
                    // refresh share content before updating the share
                    onSuccess = function(content) {
                        var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], content.data);
                        element = search[0][search[1]];

                        element['deleted'] = true;
                        
                        managerShare.write_share(closest_share['share_id'], content.data, closest_share['share_secret_key']);
                        managerDatastorePassword.handle_datastore_content_changed(datastore);
                    };
    
                    onError = function(e) {
                        // pass
    
                    };
                    managerShare.read_share(closest_share['share_id'], closest_share['share_secret_key'])
                        .then(onSuccess, onError);
    
                } else {
                    // refresh datastore content before updating it
                    onError = function(result) {
                        // pass
                    };
    
                    onSuccess = function (datastore) {
                        var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], datastore);
                        element = search[0][search[1]];

                        element['deleted'] = true;
    
                        managerDatastorePassword.save_datastore_content(datastore, [element_path_that_changed]);
                        managerDatastorePassword.handle_datastore_content_changed(datastore);
                    };
    
                    managerDatastore.get_datastore_with_id(closest_share['datastore_id'])
                        .then(onSuccess, onError);
                }
            } else if(datastore_type === 'user') {
                managerDatastoreUser.save_datastore_content(datastore, [element_path_that_changed]);
            }
            
        }

        /**
         * @ngdoc
         * @name psonocli.managerWidget#reverse_mark_item_as_deleted
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Reverse "Marks an item as deleted"
         *
         * @param {TreeObject} datastore The datastore
         * @param {object} item The item to delete
         * @param {Array} path The path to the item
         * @param {string} datastore_type The type of the datastore (e.g. 'password' or 'user')
         */
        var reverse_mark_item_as_deleted = function(datastore, item, path, datastore_type) {

            var onSuccess, onError;
            var element_path_that_changed = path.slice();
            element_path_that_changed.pop();

            var search = managerDatastorePassword.find_in_datastore(path.slice(), datastore);
            var element = search[0][search[1]];

            delete element['deleted'];
            
            var closest_share_info = managerShare.get_closest_parent_share(path.slice(), datastore,
                datastore, 1);

            var closest_share = closest_share_info['closest_share'];
            
            if (datastore_type === 'password') {
                if (closest_share.hasOwnProperty('share_id')) {
                    // refresh share content before updating the share
                    onSuccess = function(content) {
                        var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], content.data);
                        element = search[0][search[1]];

                        delete element['deleted'];
                        
                        managerShare.write_share(closest_share['share_id'], content.data, closest_share['share_secret_key']);
                        managerDatastorePassword.handle_datastore_content_changed(datastore);
                    };
    
                    onError = function(e) {
                        // pass
    
                    };
                    managerShare.read_share(closest_share['share_id'], closest_share['share_secret_key'])
                        .then(onSuccess, onError);
    
                } else {
                    // refresh datastore content before updating it
                    onError = function(result) {
                        // pass
                    };
    
                    onSuccess = function (datastore) {
                        var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], datastore);
                        element = search[0][search[1]];

                        delete element['deleted'];
    
                        managerDatastorePassword.save_datastore_content(datastore, [element_path_that_changed]);
                        managerDatastorePassword.handle_datastore_content_changed(datastore);
                    };
    
                    managerDatastore.get_datastore_with_id(closest_share['datastore_id'])
                        .then(onSuccess, onError);
                }
            } else if(datastore_type === 'user') {
                managerDatastoreUser.save_datastore_content(datastore, [element_path_that_changed]);
            }
            
        }

        /**
         * @ngdoc
         * @name psonocli.managerWidget#delete_item_permanent
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Deletes an item (or folder) for real from a datastore
         * Takes care that the link structure on the server is updated
         *
         * @param {TreeObject} datastore The datastore
         * @param {object} item The item to delete
         * @param {Array} path The path to the item
         * @param {string} datastore_type The type of the datastore (e.g. 'password' or 'user')
         */
        var delete_item_permanent = function(datastore, item, path, datastore_type) {

            var i;
            var onSuccess, onError;

            var element_path_that_changed = path.slice();
            element_path_that_changed.pop();

            var search = managerDatastorePassword.find_in_datastore(path.slice(), datastore);

            var closest_share_info = managerShare.get_closest_parent_share(path.slice(), datastore,
                datastore, 1);

            var closest_share = closest_share_info['closest_share'];

            // update visual representation
            if (search) {
                // remove element from element holding structure (folders or items array)
                search[0].splice(search[1], 1);
            }

            // lets populate our child shares that we need to handle, e.g a we deleted a folder that contains some shares
            var child_shares = [];
            var secret_links = [];
            var file_links = [];

            // and save everything (before we update the links and might lose some necessary rights)
            if (datastore_type === 'password') {

                if (closest_share.hasOwnProperty('share_id')) {
                    // refresh share content before updating the share
                    onSuccess = function(content) {
                        var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], content.data);
                        var element = search[0][search[1]];

                        if (element.hasOwnProperty("share_id")) {
                            //we deleted a share
                            child_shares.push({
                                share: element,
                                path: []
                            });
                        } else {
                            managerDatastorePassword.get_all_child_shares_by_path([], datastore, child_shares, element);
                        }

                        secret_links = managerDatastorePassword.get_all_secret_links(element);
                        file_links = managerDatastorePassword.get_all_file_links(element);

                        // lets update for every child_share the share_index
                        for (i = child_shares.length - 1; i >= 0; i--) {
                            managerDatastorePassword.delete_from_share_index(
                                content.data,
                                child_shares[i].share.share_id,
                                closest_share_info['relative_path'].concat(child_shares[i].path)
                            );
                        }

                        if (search) {
                            // remove element from element holding structure (folders or items array)
                            search[0].splice(search[1], 1);
                        }

                        managerShare.write_share(closest_share['share_id'], content.data, closest_share['share_secret_key']);

                        var timeout = 0;
                        
                        // Update all the "links" so the server has the updated link structure
                        // adjust the links for every child_share (and therefore update the rights)
                        for (i = child_shares.length - 1; i >= 0; i--) {
                            (function(child_share) {
                                timeout = timeout + 50;
                                $timeout(function(){
                                    managerShareLink.on_share_deleted(child_share.share.id);
                                }, timeout);
                            })(child_shares[i])
                        }
                        // adjust the links for every secret link (and therefore update the rights)
                        for (i = secret_links.length - 1; i >= 0; i--) {
                            (function(secret_link) {
                                timeout = timeout + 50;
                                $timeout(function(){
                                    managerSecretLink.on_secret_deleted(secret_link.id);
                                }, timeout);
                            })(secret_links[i])
                        }

                        // adjust the links for every file link (and therefore update the rights)
                        for (i = file_links.length - 1; i >= 0; i--) {
                            (function(file_link) {
                                timeout = timeout + 50;
                                $timeout(function(){
                                    managerFileLink.on_file_deleted(file_link.id);
                                }, timeout);
                            })(file_links[i])
                        }
                        managerDatastorePassword.handle_datastore_content_changed(datastore);
                    };

                    onError = function(e) {
                        // pass

                    };
                    return managerShare.read_share(closest_share['share_id'], closest_share['share_secret_key'])
                        .then(onSuccess, onError);

                } else {
                    // refresh datastore content before updating it
                    onError = function(result) {
                        // pass
                    };

                    onSuccess = function (datastore) {
                        var search = managerDatastorePassword.find_in_datastore(closest_share_info['relative_path'], datastore);
                        var element = search[0][search[1]];

                        if (element.hasOwnProperty("share_id")) {
                            //we deleted a share
                            child_shares.push({
                                share: element,
                                path: []
                            });
                        } else {
                            managerDatastorePassword.get_all_child_shares_by_path([], datastore, child_shares, element);
                        }

                        secret_links = managerDatastorePassword.get_all_secret_links(element);
                        file_links = managerDatastorePassword.get_all_file_links(element);

                        // lets update for every child_share the share_index
                        for (i = child_shares.length - 1; i >= 0; i--) {
                            managerDatastorePassword.delete_from_share_index(
                                datastore,
                                child_shares[i].share.share_id,
                                closest_share_info['relative_path'].concat(child_shares[i].path)
                            );
                        }

                        if (search) {
                            // remove element from element holding structure (folders or items array)
                            search[0].splice(search[1], 1);
                        }

                        managerDatastorePassword.save_datastore_content(datastore, [element_path_that_changed]);

                        var timeout = 0;
                        
                        // Update all the "links" so the server has the updated link structure
                        // adjust the links for every child_share (and therefore update the rights)
                        for (i = child_shares.length - 1; i >= 0; i--) {
                            (function(child_share) {
                                timeout = timeout + 50;
                                $timeout(function(){
                                    managerShareLink.on_share_deleted(child_share.share.id);
                                }, timeout);
                            })(child_shares[i])
                        }
                        // adjust the links for every secret link (and therefore update the rights)
                        for (i = secret_links.length - 1; i >= 0; i--) {
                            (function(secret_link) {
                                timeout = timeout + 50;
                                $timeout(function(){
                                    managerSecretLink.on_secret_deleted(secret_link.id);
                                }, timeout);
                            })(secret_links[i])
                        }

                        // adjust the links for every file link (and therefore update the rights)
                        for (i = file_links.length - 1; i >= 0; i--) {
                            (function(file_link) {
                                timeout = timeout + 50;
                                $timeout(function(){
                                    managerFileLink.on_file_deleted(file_link.id);
                                }, timeout);
                            })(file_links[i])
                        }
                        
                        managerDatastorePassword.handle_datastore_content_changed(datastore);
                    };

                    return managerDatastore.get_datastore_with_id(closest_share['datastore_id'])
                        .then(onSuccess, onError);
                }
            } else if(datastore_type === 'user') {
                return managerDatastoreUser.save_datastore_content(datastore, [element_path_that_changed]);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerWidget#find_in_structure
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Go through the structure to find the object specified with the path
         *
         * @param {Array} path The path to the object you search as list of ids
         * @param {TreeObject} structure The structure object tree
         * @returns {boolean|Array} False if not present or a list of two objects where the first is the List Object containing the searchable object and the second the index
         */
        var find_in_structure = function (path, structure) {
            var to_search = path.shift();
            var n;

            if (path.length === 0) {
                // found the object
                // check if its a folder, if yes return the folder list and the index
                if (structure.hasOwnProperty('folders')) {
                    for (n = 0; n < structure.folders.length; n++) {
                        if (structure.folders[n].id === to_search) {
                            return [structure.folders, n];
                            // structure.folders.splice(n, 1);
                            // return true;
                        }
                    }
                }
                // check if its a file, if yes return the file list and the index
                if (structure.hasOwnProperty('items')) {
                    for (n = 0; n < structure.items.length; n++) {
                        if (structure.items[n].id === to_search) {
                            return [structure.items, n];
                            // structure.items.splice(n, 1);
                            // return true;
                        }
                    }
                }
                // something went wrong, couldn't find the file / folder here
                return false;
            }

            for (n = 0; n < structure.folders.length; n++) {
                if (structure.folders[n].id === to_search) {
                    return find_in_structure(path, structure.folders[n]);
                }
            }
            return false;
        };

        /**
         * @ngdoc
         * @name psonocli.managerWidget#item_icon
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Returns the class of the icon used to display a specific item
         *
         * @param {object} item An item from the datastore
         *
         * @returns {string} Returns the css class
         */
        var item_icon = function (item) {
            var iconClassMap = {
                    txt: 'fa fa-file-text-o',
                    log: 'fa fa-file-text-o',
                    jpg: 'fa fa-file-image-o blue',
                    jpeg: 'fa fa-file-image-o blue',
                    png: 'fa fa-file-image-o orange',
                    gif: 'fa fa-file-image-o',
                    pdf: 'fa fa-file-pdf-o',
                    wav: 'fa fa-file-audio-o',
                    mp3: 'fa fa-file-audio-o',
                    wma: 'fa fa-file-audio-o',
                    avi: 'fa fa-file-video-o',
                    mov: 'fa fa-file-video-o',
                    mkv: 'fa fa-file-video-o',
                    flv: 'fa fa-file-video-o',
                    mp4: 'fa fa-file-video-o',
                    mpg: 'fa fa-file-video-o',
                    doc: 'fa fa-file-word-o',
                    dot: 'fa fa-file-word-o',
                    docx: 'fa fa-file-word-o',
                    docm: 'fa fa-file-word-o',
                    dotx: 'fa fa-file-word-o',
                    dotm: 'fa fa-file-word-o',
                    docb: 'fa fa-file-word-o',
                    xls: 'fa fa-file-excel-o',
                    xlt: 'fa fa-file-excel-o',
                    xlm: 'fa fa-file-excel-o',
                    xla: 'fa fa-file-excel-o',
                    xll: 'fa fa-file-excel-o',
                    xlw: 'fa fa-file-excel-o',
                    xlsx: 'fa fa-file-excel-o',
                    xlsm: 'fa fa-file-excel-o',
                    xlsb: 'fa fa-file-excel-o',
                    xltx: 'fa fa-file-excel-o',
                    xltm: 'fa fa-file-excel-o',
                    xlam: 'fa fa-file-excel-o',
                    csv: 'fa fa-file-excel-o',
                    ppt: 'fa fa-file-powerpoint-o',
                    pptx: 'fa fa-file-powerpoint-o',
                    zip: 'fa fa-file-archive-o',
                    tar: 'fa fa-file-archive-o',
                    gz: 'fa fa-file-archive-o',
                    '7zip': 'fa fa-file-archive-o'
                },
                defaultIconClass = 'fa fa-file-o';

            if(item.type === 'bookmark') {
                return 'fa fa-bookmark-o'
            }
            if(item.type === 'note') {
                return 'fa fa-sticky-note-o'
            }

            if(item.type === 'application_password') {
                return 'fa fa-cube'
            }

            if(item.type === 'website_password') {
                return 'fa fa-key'
            }

            if(item.type === 'totp') {
                return 'fa fa-qrcode'
            }

            if(item.type === 'user') {
                return 'fa fa-user'
            }

            if(item.type === 'mail_gpg_own_key') {
                return 'fa fa-lock'
            }

            if(item.type === 'environment_variables') {
                return 'fa fa-superscript'
            }

            var pattern = /\.(\w+)$/,
                match = pattern.exec(item.name),
                ext = match && match[1];

            return iconClassMap[ext] || defaultIconClass;
        };

        return {
            open_new_folder: open_new_folder,
            open_edit_folder: open_edit_folder,
            find_in_structure: find_in_structure,
            open_new_item: open_new_item,
            open_edit_item: open_edit_item,
            move_item: move_item,
            delete_item: delete_item,
            reverse_mark_item_as_deleted: reverse_mark_item_as_deleted,
            item_icon: item_icon
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerWidget", ['$rootScope', '$window', '$uibModal', '$timeout', 'managerDatastorePassword', 'managerDatastoreUser',
        'managerDatastore', 'managerShare', 'managerSecret',
        'managerShareLink', 'managerSecretLink', 'managerFileLink', 'itemBlueprint', 'cryptoLibrary', managerWidget]);

}(angular));