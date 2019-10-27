(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ChooseSecretsCtrl
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
    angular.module('psonocli').controller('ChooseSecretsCtrl', ["$scope", "manager", "managerDatastorePassword",
        "$uibModal", "itemBlueprint", "managerWidget",
        "message", "$timeout", 'dropDownMenuWatcher',
        function($scope, manager, managerDatastorePassword,
                 $uibModal, itemBlueprint, managerWidget, message,
                 $timeout, dropDownMenuWatcher){

            $scope.contextMenuOnShow = contextMenuOnShow;
            $scope.contextMenuOnClose = contextMenuOnClose;
            $scope.openNewFolder = openNewFolder;
            $scope.openNewItem = openNewItem;

            $scope.structure = { data: {}} ;

            $scope.options = {
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
                    managerWidget.open_edit_folder(node, path, $scope.structure.data, managerDatastorePassword)
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
                    message.emit("item_breadcrumbs_update",
                        {'item': item, 'path': path});
                },
                /**
                 * Triggered once someone clicks the move node entry
                 *
                 * @param item_path The path of the node in question
                 */
                onMoveNode: function (item_path) {

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
                                return 'password';
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
                                return 'password';
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
                    managerWidget.open_new_folder(parent, path, $scope.structure.data, managerDatastorePassword);
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
                    return ! node.hasOwnProperty('share_rights') || !! (node.share_rights.read)
                },
                contextMenuOnShow: $scope.contextMenuOnShow,
                contextMenuOnClose: $scope.contextMenuOnClose,

                getAdditionalButtons: itemBlueprint.get_additional_functions,
                item_icon: managerWidget.item_icon
            };

            activate();

            function activate() {
                managerDatastorePassword.get_password_datastore()
                    .then(function(data) {
                        $scope.structure.data = data;
                        $scope.structure.loaded = true;
                    });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ChooseSecretsCtrl#contextMenuOnShow
             * @methodOf psonocli.controller:ChooseSecretsCtrl
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
             * @name psonocli.controller:ChooseSecretsCtrl#contextMenuOnClose
             * @methodOf psonocli.controller:ChooseSecretsCtrl
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
             * @name psonocli.controller:ChooseSecretsCtrl#openNewFolder
             * @methodOf psonocli.controller:ChooseSecretsCtrl
             *
             * @description
             * Forwards the call to open the modal for a new folder
             *
             * @param {object} event The event triggering this
             */
            function openNewFolder(event) {
                managerWidget.open_new_folder(undefined, [], $scope.structure.data, managerDatastorePassword);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ChooseSecretsCtrl#contextMenuOnClose
             * @methodOf psonocli.controller:ChooseSecretsCtrl
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
             * @name psonocli.controller:ChooseSecretsCtrl#openNewItem
             * @methodOf psonocli.controller:ChooseSecretsCtrl
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
             * @name psonocli.controller:ChooseSecretsCtrl#move_item
             * @methodOf psonocli.controller:ChooseSecretsCtrl
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
                managerWidget.move_item(scope.structure.data, item_path, target_path, type, 'password');
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ChooseSecretsCtrl#delete_item
             * @methodOf psonocli.controller:ChooseSecretsCtrl
             *
             * @description
             * Deletes an item from the datastore
             *
             * @param {object} scope the scope
             * @param {object} item the item
             * @param {array} path the path to the item
             */
            function delete_item(scope, item, path) {
                managerWidget.delete_item(scope.structure.data, item, path, 'password');
            }

        }]);

}(angular));