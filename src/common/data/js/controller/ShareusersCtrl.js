(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ShareusersCtrl
     * @requires $scope
     * @requires $interval
     * @requires $uibModal
     * @requires $timeout
     * @requires ngTree.dropDownMenuWatcher
     * @requires psonocli.managerSecret
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.shareBlueprint
     * @requires psonocli.managerWidget
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Main Controller for the shareusers widget
     */
    angular.module('psonocli').controller('ShareusersCtrl', ["$scope", "$interval", "managerSecret", "managerDatastoreUser",
        "$uibModal", "shareBlueprint", "managerWidget", "$timeout", "dropDownMenuWatcher", 'cryptoLibrary', 'managerDatastorePassword',
        function ($scope, $interval, managerSecret, managerDatastoreUser, $uibModal, shareBlueprint,
                  managerWidget, $timeout, dropDownMenuWatcher, cryptoLibrary, managerDatastorePassword) {

            $scope.contextMenuOnShow = contextMenuOnShow;
            $scope.contextMenuOnClose = contextMenuOnClose;
            $scope.openNewFolder = openNewFolder;
            $scope.openNewItem = openNewItem;

            $scope.structure = {data: {}};
            $scope.options = {
                /**
                 * Triggered once someone selects a node
                 *
                 * @param node
                 * @param breadcrumbs
                 * @param id_breadcrumbs
                 */
                onNodeSelect: function (node, breadcrumbs, id_breadcrumbs) {
                    $scope.breadcrumbs = breadcrumbs;
                    $scope.node = node;
                    //managerSecret.onNodeSelect(node);
                },
                /**
                 * Triggered once someone clicks the move node entry
                 *
                 * @param item_path The path of the node in question
                 * @param target_path The path to the target node
                 */
                onMoveNode: function (item_path, target_path) {
                    return move_item($scope, item_path, target_path, 'folders');
                },

                /**
                 * Triggered once someone wants to move a node entry
                 *
                 * @param item_path The path of the item
                 * @param target_path The path to target folder
                 */
                onMoveItem: function (item_path, target_path) {
                    return move_item($scope, item_path, target_path, 'items');
                },
                /**
                 * Triggered once someone clicks the delete node entry
                 *
                 * @param node The node in question
                 * @param path The path to the node
                 */
                onDeleteNode: function (node, path) {
                    return delete_item($scope, node, path);
                },

                /**
                 * Triggered once someone wants to edit a node entry
                 *
                 * @param node The node in question
                 * @param path The path to the node
                 */
                onEditNode: function (node, path) {
                    managerWidget.open_edit_folder(node, path, $scope.structure.data, managerDatastoreUser);
                },

                /**
                 * Triggered once someone clicks on a node entry
                 *
                 * @param item The item in question
                 * @param path The path to the item
                 */
                on_item_click: function (item, path) {
                    managerSecret.on_item_click(item, path);
                },

                /**
                 * Triggered once someone wants to delete a node entry
                 *
                 * @param item The item in question
                 * @param path The path to the item
                 *
                 * @returns {*}
                 */
                onDeleteItem: function (item, path) {
                    return delete_item($scope, item, path);
                },

                /**
                 * Triggered once someone wants to edit a node entry
                 *
                 * @param item The item in question
                 * @param path The path to the item
                 */
                onEditItem: function (item, path) {
                    open_edit_item(item, path)
                },

                /**
                 * Triggered once someone wants to create a new folder
                 *
                 * @param parent The parent for the new folder
                 * @param path The path to the parent
                 */
                onNewFolder: function (parent, path) {
                    managerWidget.open_new_folder(parent, path, $scope.structure.data, managerDatastoreUser);
                },

                /**
                 * Triggered once someone wants to create a new Item
                 *
                 * @param parent The parent for the new item
                 * @param path The path to the parent
                 */
                onNewItem: function (parent, path) {
                    open_new_item(parent, path)
                },
                contextMenuOnShow: $scope.contextMenuOnShow,
                contextMenuOnClose: $scope.contextMenuOnClose,

                textConfig: {
                    'new_entry': {name: 'New User', icon: 'fa fa-user-plus'}
                },

                getAdditionalButtons: shareBlueprint.get_additional_functions,
                item_icon: managerWidget.item_icon
            };


            activate();

            function activate() {
                managerDatastoreUser.get_user_datastore()
                    .then(function (data) {
                        $scope.structure.data = data;
                        $scope.structure.loaded = true;
                    });
            }

            function contextMenuOnShow(div_id) {
                dropDownMenuWatcher.on_open(div_id);
            }

            function contextMenuOnClose(div_id) {
                dropDownMenuWatcher.on_close(div_id);
            }

            // Modals

            function openNewFolder(event) {
                managerWidget.open_new_folder(undefined, [], $scope.structure.data, managerDatastoreUser);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ShareusersCtrl#open_new_item
             * @methodOf psonocli.controller:ShareusersCtrl
             *
             * @description
             * Opens the modal for a new user entry
             *
             * @param parent
             * @param path
             * @param size
             */
            function open_new_item(parent, path, size) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-new-entry.html',
                    controller: 'ModalShareNewEntryCtrl',
                    size: size,
                    resolve: {
                        parent: function () {
                            return parent;
                        },
                        path: function () {
                            return path;
                        },
                        hide_advanced: function () {
                            return true
                        }
                    }
                });

                modalInstance.result.then(function (content) {

                    if (typeof parent === 'undefined') {
                        parent = $scope.structure.data;
                    }

                    if (typeof parent.items === 'undefined') {
                        parent.items = [];
                    }

                    var user_object = {
                        id: cryptoLibrary.generate_uuid(),
                        type: content.id,
                        data: {}
                    };

                    if (shareBlueprint.get_blueprint(content.id).getName) {
                        user_object.name = shareBlueprint.get_blueprint(content.id).getName(content.fields);
                    }

                    for (var i = content.fields.length - 1; i >= 0; i--) {

                        if (!content.fields[i].hasOwnProperty("value")) {
                            continue;
                        }
                        if (!user_object.name && content.title_field === content.fields[i].name) {
                            user_object.name = content.fields[i].value;
                        }
                        if (content.hasOwnProperty("urlfilter_field")
                            && content.urlfilter_field === content.fields[i].name) {
                            user_object.urlfilter = content.fields[i].value;
                        }
                        if (content.hasOwnProperty("autosubmit_field")
                            && content.autosubmit_field === content.fields[i].name) {
                            user_object.autosubmit = content.fields[i].value;
                        }
                        user_object.data[content.fields[i].name] = content.fields[i].value;
                    }

                    // check if we do not already have the user in our trusted user datastore
                    // skip if we already have it
                    var existing_locations = managerDatastorePassword.search_in_datastore(user_object, $scope.structure.data, function(a, b) {
                        if (!a.hasOwnProperty('data')) {
                            return false
                        }
                        if (!b.hasOwnProperty('data')) {
                            return false
                        }
                        if (!a['data'].hasOwnProperty('user_public_key')) {
                            return false
                        }
                        if (!b['data'].hasOwnProperty('user_public_key')) {
                            return false
                        }
                        return a['data']['user_public_key'] === b['data']['user_public_key']
                    });

                    if (existing_locations.length < 1) {
                        parent.items.push(user_object);
                        managerDatastoreUser.save_datastore_content($scope.structure.data);
                    }


                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ShareusersCtrl#openNewItem
             * @methodOf psonocli.controller:ShareusersCtrl
             *
             * @description
             * Initiates the opening of the new item modal
             *
             * @param event
             */
            function openNewItem(event) {
                open_new_item(undefined, []);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ShareusersCtrl#open_edit_item
             * @methodOf psonocli.controller:ShareusersCtrl
             *
             * @description
             * Opens the modal to edit a entry
             *
             * @param node
             * @param path
             * @param size
             */
            function open_edit_item(node, path, size) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-edit-entry.html',
                    controller: 'ModalShareEditEntryCtrl',
                    size: size,
                    resolve: {
                        node: function () {
                            return node;
                        },
                        path: function () {
                            return path;
                        },
                        data: function () {
                            return node.data;
                        }
                    }
                });

                modalInstance.result.then(function (content) {

                    var new_name;
                    if (shareBlueprint.get_blueprint(content.id).getName) {
                        new_name = shareBlueprint.get_blueprint(content.id).getName(content.fields);
                        node.name = new_name;
                    }

                    // lets loop all input fields
                    for (var i = content.fields.length - 1; i >= 0; i--) {

                        // skips all fields without a value set
                        if (!content.fields[i].hasOwnProperty("value")) {
                            continue;
                        }

                        // found title and if title not yet set , lets save it as title
                        if (!new_name && content.title_field === content.fields[i].name) {
                            node.name = content.fields[i].value;
                        }

                        // found a urlfilter field, lets put it into our urlfilter
                        if (content.hasOwnProperty("urlfilter_field")
                            && content.urlfilter_field === content.fields[i].name) {
                            node.urlfilter = content.fields[i].value;
                        }

                        // found a autosubmit field, lets put it into our autosubmit
                        if (content.hasOwnProperty("autosubmit_field")
                            && content.autosubmit_field === content.fields[i].name) {
                            node.autosubmit = content.fields[i].value;
                        }

                        // lets save all the rest in the normal data fields
                        node.data[content.fields[i].name] = content.fields[i].value;
                    }

                    managerDatastoreUser.save_datastore_content($scope.structure.data);

                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ShareusersCtrl#move_item
             * @methodOf psonocli.controller:ShareusersCtrl
             *
             * @description
             * Moves an item
             *
             * @param {object} scope the scope
             * @param {array} item_path the path of the item
             * @param {array} target_path the path where we want to put the item
             * @param {string} type type of the item (item or folder)
             */
            function move_item(scope, item_path, target_path, type) {
                managerWidget.move_item(scope.structure.data, item_path, target_path, type);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ShareusersCtrl#delete_item
             * @methodOf psonocli.controller:ShareusersCtrl
             *
             * @description
             * Deletes an item from the datastore
             *
             * @param {object} scope the scope
             * @param {object} item the item
             * @param {array} path the path to the item
             */
            function delete_item(scope, item, path) {
                managerWidget.delete_item(scope.structure.data, item, path);
            }

        }]);

}(angular));