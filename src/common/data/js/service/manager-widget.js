(function (angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerWidget
     * @requires $uibModal
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.managerShare
     * @requires psonocli.managerSecret
     * @requires psonocli.managerShareLink
     * @requires psonocli.managerSecretLink
     * @requires psonocli.itemBlueprint
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Service that is something like the base class for adf widgets
     */

    var managerWidget = function ($uibModal, managerDatastorePassword, managerShare, managerSecret, managerShareLink,
                                     managerSecretLink, itemBlueprint, cryptoLibrary) {


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
                templateUrl: 'view/modal-new-folder.html',
                controller: 'ModalNewFolderCtrl',
                backdrop: 'static',
                resolve: {
                    parent: function () {
                        return parent;
                    },
                    path: function () {
                        return path;
                    }
                }
            });

            modalInstance.result.then(function (name) {
                if (typeof parent === 'undefined') {
                    parent = data_structure;
                }

                if (typeof parent.folders === 'undefined') {
                    parent.folders = [];
                }
                parent.folders.push({
                    id: cryptoLibrary.generate_uuid(),
                    name: name
                });

                parent['expanded'] = true;

                manager.save_datastore_content(data_structure, [path]);

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
                templateUrl: 'view/modal-edit-folder.html',
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
                node.name = name;

                manager.save_datastore_content(data_structure, [path]);

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
         */
        var open_new_item = function (datastore, parent, path, size) {
            var modalInstance = $uibModal.open({
                templateUrl: 'view/modal-new-entry.html',
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

                if (typeof parent === 'undefined') {
                    parent = datastore;
                }

                if (typeof parent.items === 'undefined') {
                    parent.items = [];
                }
                var link_id = cryptoLibrary.generate_uuid();

                var datastore_object = {
                    id: link_id,
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
                    secret_object[content.fields[i].name] = content.fields[i].value;
                }

                var onError = function(result) {
                    // pass
                };

                var closest_share = managerShare.get_closest_parent_share(path.slice(), datastore,
                    datastore, 0);

                var parent_share_id, parent_datastore_id;

                if (closest_share.hasOwnProperty('share_id')) {
                    parent_share_id = closest_share['share_id'];
                } else {
                    parent_datastore_id = closest_share['datastore_id'];
                }

                var onSuccess = function(e) {
                    datastore_object['secret_id'] = e.secret_id;
                    datastore_object['secret_key'] = e.secret_key;

                    parent.items.push(datastore_object);

                    parent['expanded'] = true;

                    managerDatastorePassword.save_datastore_content(datastore, [path]);

                    // reset form fields
                    for (var i = content.fields.length - 1; i >= 0; i--) {
                        if (!content.fields[i].hasOwnProperty("value")) {
                            continue;
                        }
                        content.fields[i].value = '';
                    }

                };

                managerSecret.create_secret(secret_object, link_id, parent_datastore_id, parent_share_id)
                    .then(onSuccess, onError);

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
         * @param {Array} path The path to the parent
         * @param {string} size The size of the modal
         */
        var open_edit_item = function(datastore, node, path, size) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(data) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-edit-entry.html',
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

                modalInstance.result.then(function (content) {

                    var secret_object = {};

                    for (var i = content.fields.length - 1; i >= 0; i--) {

                        if (!content.fields[i].hasOwnProperty("value")) {
                            continue;
                        }
                        if (content.title_field === content.fields[i].name) {
                            node.name = content.fields[i].value;
                        }
                        if (content.hasOwnProperty("urlfilter_field")
                            && content.urlfilter_field === content.fields[i].name) {
                            node.urlfilter = content.fields[i].value;
                        }
                        if (content.hasOwnProperty("autosubmit_field")
                            && content.autosubmit_field === content.fields[i].name) {
                            node.autosubmit = content.fields[i].value;
                        }
                        secret_object[content.fields[i].name] = content.fields[i].value;
                    }

                    var onError = function(result) {
                        // pass
                    };

                    var onSuccess = function(e) {
                        managerDatastorePassword.save_datastore_content(datastore, [path]);
                    };

                    managerSecret.write_secret(node.secret_id, node.secret_key, secret_object)
                        .then(onSuccess, onError);

                }, function () {
                    // cancel triggered
                });
            };

            managerSecret.read_secret(node.secret_id, node.secret_key)
                .then(onSuccess, onError);
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
         * @name psonocli.managerWidget#move_item
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Move an item from one position to anther
         *
         * @param {TreeObject} datastore The datastore
         * @param {Array} item_path the current path of the item
         * @param {Array} target_path the path where we want to put the item
         * @param {string} type type of the item ('item' or 'folder')
         */
        var move_item = function(datastore, item_path, target_path, type) {

            var i;
            var closest_parent;

            var orig_item_path = item_path.slice();
            orig_item_path.pop();

            var orig_target_path;

            if (target_path === null) {
                orig_target_path = [];
            } else {
                orig_target_path = target_path.slice();
            }

            var target = datastore;
            if (target_path !== null) {
                // find drop zone
                var val1 = managerDatastorePassword.find_in_datastore(target_path, datastore);
                target = val1[0][val1[1]];
            }

            // find element
            var val2 = managerDatastorePassword.find_in_datastore(item_path, datastore);

            if (val2 === false) {
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
                managerDatastorePassword.get_all_child_shares([], datastore, child_shares, 1, element);
            }
            var secret_links = managerDatastorePassword.get_all_secret_links(element);

            // lets update for every child_share the share_index
            for (i = child_shares.length - 1; i >= 0; i--) {
                managerDatastorePassword.on_share_moved(
                    child_shares[i].share.share_id, item_path_copy.concat(child_shares[i].path),
                    target_path_copy.concat(child_shares[i].path), datastore, 1,
                    child_shares[i].path.length + 1);
            }

            // and save everything (before we update the links and might lose some necessary rights)
            managerDatastorePassword.save_datastore_content(datastore, [orig_item_path, orig_target_path]);

            // adjust the links for every child_share (and therefore update the rights)
            for (i = child_shares.length - 1; i >= 0; i--) {
                closest_parent = managerShare.get_closest_parent_share(
                    target_path_copy.concat(child_shares[i].path), datastore, datastore, 1
                );

                managerShareLink.on_share_moved(child_shares[i].share.id, closest_parent);
            }

            var check_parent = function (element, target, type) {
                return element.hasOwnProperty("parent_" + type + "_id") && target.hasOwnProperty("parent_" + type + "_id")
                    && (target['parent_' + type + '_id'] === element['parent_' + type + '_id']
                    || (target.hasOwnProperty('share_id') && target[type + '_id'] === element['parent_' + type + '_id']));
            };


            // if parent_share or parent_datastore did not change, then we are done here
            if (check_parent(element, target, 'share') || check_parent(element, target, 'datastore')) {
                return;
            }

            // adjust the links for every secret link (and therefore update the rights)
            for (i = secret_links.length - 1; i >= 0; i--) {
                closest_parent = managerShare.get_closest_parent_share(
                    target_path_copy2.concat(secret_links[i].path), datastore, datastore, 1
                );
                managerSecretLink.on_secret_moved(secret_links[i].id, closest_parent);
            }
            if (secret_links.length > 0) {
                managerDatastorePassword.update_parents(closest_parent, closest_parent.parent_share_id, closest_parent.parent_datastore_id);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerWidget#delete_item
         * @methodOf psonocli.managerWidget
         *
         * @description
         * Deletes and item from datastore
         *
         * @param {TreeObject} datastore The datastore
         * @param {object} item The item to delete
         * @param {Array} path The path to the item
         */
        var delete_item = function(datastore, item, path) {

            var i;
            // TODO ask for confirmation

            var item_path_copy = path.slice();
            var element_path_that_changed = path.slice();
            element_path_that_changed.pop();

            var search = managerDatastorePassword.find_in_datastore(path, datastore);
            var element = search[0][search[1]];

            if (search) {
                // remove element from element holding structure (folders or items array)
                search[0].splice(search[1], 1);
            }

            // lets populate our child shares that we need to handle, e.g a we deleted a folder that contains some shares
            var child_shares = [];
            if (element.hasOwnProperty("share_id")) {
                //we deleted a share
                child_shares.push({
                    share: element,
                    path: []
                });
            } else {
                managerDatastorePassword.get_all_child_shares([], datastore, child_shares, 1, element);
            }

            var secret_links = managerDatastorePassword.get_all_secret_links(element);

            // lets update for every child_share the share_index
            for (i = child_shares.length - 1; i >= 0; i--) {
                managerDatastorePassword.on_share_deleted(
                    child_shares[i].share.share_id,
                    item_path_copy.concat(child_shares[i].path),
                    datastore,
                    child_shares[i].path.length + 1
                );
            }

            // and save everything (before we update the links and might lose some necessary rights)
            managerDatastorePassword.save_datastore_content(datastore, [element_path_that_changed]);

            // adjust the links for every child_share (and therefore update the rights)
            for (i = child_shares.length - 1; i >= 0; i--) {
                managerShareLink.on_share_deleted(child_shares[i].share.id);
            }
            // adjust the links for every secret link (and therefore update the rights)
            for (i = secret_links.length - 1; i >= 0; i--) {
                managerSecretLink.on_secret_deleted(secret_links[i].id);
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

            if(item.type === 'website_password') {
                return 'fa fa-key'
            }

            if(item.type === 'user') {
                return 'fa fa-user'
            }

            if(item.type === 'mail_gpg_own_key') {
                return 'fa fa-lock'
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
            item_icon: item_icon
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerWidget", ['$uibModal', 'managerDatastorePassword', 'managerShare', 'managerSecret',
        'managerShareLink', 'managerSecretLink', 'itemBlueprint', 'cryptoLibrary', managerWidget]);

}(angular));