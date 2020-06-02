(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ChooseFolderCtrl
     * @requires $scope
     * @requires $uibModal
     * @requires $timeout
     * @requires ngTree.dropDownMenuWatcher
     * @requires psonocli.manager
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.itemBlueprint
     * @requires psonocli.managerWidget
     * @requires psonocli.message
     *
     * @description
     * Main Controller for the acceptshare widget
     */
    angular.module('psonocli').controller('ChooseFolderCtrl', ["$scope", "manager", "managerDatastorePassword", "managerDatastoreUser",
        "$uibModal", "itemBlueprint", "managerWidget",
        "message", "$timeout", 'dropDownMenuWatcher',
        function($scope, manager, managerDatastorePassword, managerDatastoreUser,
                 $uibModal, itemBlueprint, managerWidget, message,
                 $timeout, dropDownMenuWatcher){

            $scope.contextMenuOnShow = contextMenuOnShow;
            $scope.contextMenuOnClose = contextMenuOnClose;
            $scope.openNewFolder = openNewFolder;
            $scope.openNewItem = openNewItem;

            $scope.structure = { data: {}} ;

            $scope.init = function(datastore, datastore_type) {
                $scope.datastore = datastore;
                $scope.datastore_type = datastore_type;
            };

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
                    message.emit("node_breadcrumbs_update",
                        {'breadcrumbs': breadcrumbs, 'id_breadcrumbs': id_breadcrumbs});
                },
                /**
                 * Triggered once someone clicks the delete node entry
                 *
                 * @param node The node in question
                 * @param path The path to the node
                 *
                 * @returns {*}
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
                    if ($scope.datastore_type === 'password') {
                        managerWidget.open_edit_folder(node, path, $scope.structure.data, managerDatastorePassword)
                    } else if ($scope.datastore_type === 'user') {
                        managerWidget.open_edit_folder(node, path, $scope.structure.data, managerDatastoreUser)
                    }
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
                    open_edit_item(item, path);
                },
                /**
                 * Triggered once someone clicks the move node entry
                 *
                 * @param item_path The path of the node in question
                 */
                onMoveNode: function (item_path) {

                    var search = managerDatastorePassword.find_in_datastore(item_path, $scope.structure.data);
                    var item = search[0][search[1]];

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/choose-folder.html',
                        controller: 'ModalChooseFolderCtrl',
                        resolve: {
                            title: function () {
                                return 'MOVE_FOLDER';
                            },
                            datastore: function() {
                                return $scope.structure.data;
                            },
                            datastore_type: function() {
                                return $scope.datastore_type;
                            },
                            item: function() {
                                return item;
                            }
                        }
                    });

                    modalInstance.result.then(function (breadcrumbs) {
                        // User clicked the prime button
                        return move_item($scope, item_path, breadcrumbs['id_breadcrumbs'], 'folders');
                    }, function () {
                        // cancel triggered
                    });
                },

                /**
                 * Triggered once someone wants to move a node entry
                 *
                 * @param item_path The path of the item
                 */
                onMoveItem: function (item_path) {

                    var search = managerDatastorePassword.find_in_datastore(item_path, $scope.structure.data);
                    var item = search[0][search[1]];

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/choose-folder.html',
                        controller: 'ModalChooseFolderCtrl',
                        resolve: {
                            title: function () {
                                return 'MOVE_ENTRY';
                            },
                            datastore: function() {
                                return $scope.structure.data;
                            },
                            datastore_type: function() {
                                return $scope.datastore_type;
                            },
                            item: function() {
                                return item;
                            }
                        }
                    });

                    modalInstance.result.then(function (breadcrumbs) {
                        move_item($scope, item_path, breadcrumbs['id_breadcrumbs'], 'items')
                    }, function () {
                        // cancel triggered
                    });
                },

                /**
                 * Triggered once someone wants to create a new folder
                 *
                 * @param parent The parent for the new folder
                 * @param path The path to the parent
                 */
                onNewFolder: function (parent, path) {
                    if ($scope.datastore_type === 'password') {
                        managerWidget.open_new_folder(parent, path, $scope.structure.data, managerDatastorePassword);
                    } else if ($scope.datastore_type === 'user') {
                        managerWidget.open_new_folder(parent, path, $scope.structure.data, managerDatastoreUser);
                    }
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

                /**
                 * Triggered once someone clicks on an additional button
                 *
                 * @param item
                 * @param path
                 * @param myFunction
                 */
                onAdditionalButtonItem: function(item, path, myFunction) {
                    myFunction(item,path);
                },

                /**
                 * Filters out share folders which we cannot read nor write to as possible target for our accept share
                 *
                 * @param node
                 * @returns {boolean}
                 */
                isSelectable: function (node) {
                    // filter out all targets that are a share if the item is not allowed to be shared
                    if ($scope.$parent.item.hasOwnProperty('share_rights') && !$scope.$parent.item.share_rights.grant && node.share_id) {
                        return false
                    }
                    // filter out all targets that are inside of a share if the item is not allowed to be shared
                    if ($scope.$parent.item.hasOwnProperty('share_right_grant') && !$scope.$parent.item.share_right_grant && node.parent_share_id) {
                        return false
                    }

                    // filter out all targets that are a share or are inside of a share if the shared object contains shares that don't allow grant
                    if ($scope.$parent.item.hasOwnProperty('folders') && (node.parent_share_id || node.share_id)) {
                        var child_shares = [];
                        managerDatastorePassword.get_all_child_shares($scope.$parent.item, -1, child_shares);
                        for (var i = 0; i < child_shares.length; i++) {
                            if (!child_shares[i]['share'].hasOwnProperty('share_rights')) {
                                return false;
                            }
                            if (!child_shares[i]['share']['share_rights']['grant']) {
                                return false;
                            }
                        }
                    }

                    return ! node.hasOwnProperty('share_rights') || !! (node.share_rights.read && node.share_rights.write)
                },
                contextMenuOnShow: $scope.contextMenuOnShow,
                contextMenuOnClose: $scope.contextMenuOnClose,

                getAdditionalButtons: itemBlueprint.get_additional_functions,
                item_icon: managerWidget.item_icon
            };

            activate();

            function activate() {

                var onSuccess = function (data) {
                    $scope.structure.data = data;
                    $scope.structure.loaded = true;
                };

                if ($scope.datastore_type === 'password') {
                    managerDatastorePassword.get_password_datastore()
                        .then(onSuccess);
                } else if ($scope.datastore_type === 'user') {
                    managerDatastoreUser.get_user_datastore()
                        .then(onSuccess);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ChooseFolderCtrl#contextMenuOnShow
             * @methodOf psonocli.controller:ChooseFolderCtrl
             *
             * @description
             * Counts the open context menus counter up
             *
             * @param {string} div_id The id of the div
             */
            function contextMenuOnShow(div_id) {
                dropDownMenuWatcher.on_open(div_id);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ChooseFolderCtrl#contextMenuOnClose
             * @methodOf psonocli.controller:ChooseFolderCtrl
             *
             * @description
             * Counts the open context menus counter down
             *
             * @param {string} div_id The id of the div
             */
            function contextMenuOnClose(div_id) {
                dropDownMenuWatcher.on_close(div_id);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ChooseFolderCtrl#openNewFolder
             * @methodOf psonocli.controller:ChooseFolderCtrl
             *
             * @description
             * Forwards the call to open the modal for a new folder
             *
             * @param {object} event The event triggering this
             */
            function openNewFolder(event) {

                if ($scope.datastore_type === 'password') {
                    managerWidget.open_new_folder(undefined, [], $scope.structure.data, managerDatastorePassword);
                } else if ($scope.datastore_type === 'user') {
                    managerWidget.open_new_folder(undefined, [], $scope.structure.data, managerDatastoreUser);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ChooseFolderCtrl#contextMenuOnClose
             * @methodOf psonocli.controller:ChooseFolderCtrl
             *
             * @description
             * Opens the modal for a new entry
             *
             * @param {object} parent The parent object
             * @param {array} path The path
             * @param {string} size The size of the modal
             */
            function open_new_item (parent, path, size) {
                managerWidget.open_new_item($scope.structure.data, parent, path, size);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ChooseFolderCtrl#openNewItem
             * @methodOf psonocli.controller:ChooseFolderCtrl
             *
             * @description
             * Forwards the call to open the modal for a new item
             *
             * @param {object} event The event triggering this
             */
            function openNewItem(event) {
                open_new_item(undefined, []);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ChooseFolderCtrl#open_edit_item
             * @methodOf psonocli.controller:ChooseFolderCtrl
             *
             * @description
             * Opens the modal to edit a entry
             *
             * @param {object} node The item to edit
             * @param {array} path The path
             * @param {string} size The size of the modal
             */
            function open_edit_item (node, path, size) {
                managerWidget.open_edit_item($scope.structure.data, node, path, size);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ChooseFolderCtrl#move_item
             * @methodOf psonocli.controller:ChooseFolderCtrl
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
                managerWidget.move_item(scope.structure.data, item_path, target_path, type, $scope.datastore_type);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ChooseFolderCtrl#delete_item
             * @methodOf psonocli.controller:ChooseFolderCtrl
             *
             * @description
             * Deletes an item from the datastore
             *
             * @param {object} scope the scope
             * @param {object} item the item
             * @param {array} path the path to the item
             */
            function delete_item(scope, item, path) {
                managerWidget.delete_item(scope.structure.data, item, path, $scope.datastore_type);
            }

        }]);

}(angular));