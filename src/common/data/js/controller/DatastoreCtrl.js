(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:DatastoreCtrl
     * @requires $scope
     * @requires $uibModal
     * @requires $routeParams
     * @requires $timeout
     * @requires ngTree.dropDownMenuWatcher
     * @requires psonocli.manager
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.itemBlueprint
     * @requires psonocli.managerWidget
     * @requires psonocli.managerSecret
     *
     * @description
     * Main Controller for the datastore widget
     */
    angular.module('psonocli').controller('DatastoreCtrl', ["$scope", "$uibModal", "$routeParams", "$timeout",
        "manager", "managerDatastorePassword",
        "itemBlueprint", "managerWidget", "managerSecret", "dropDownMenuWatcher",
        function($scope, $uibModal, $routeParams, $timeout,
                 manager, managerDatastorePassword,
                 itemBlueprint, managerWidget, managerSecret, dropDownMenuWatcher){
            var contextMenusOpen = 0;

            $scope.contextMenuOnShow = contextMenuOnShow;
            $scope.contextMenuOnClose = contextMenuOnClose;
            $scope.openNewFolder = openNewFolder;
            $scope.openNewItem = openNewItem;

            $scope.tosearchTreeFilter = $routeParams.default_search;
            $scope.structure = { data: {}} ;
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
                },
                /**
                 * Triggered once someone selects an item
                 *
                 * @param item
                 * @param breadcrumbs
                 * @param id_breadcrumbs
                 */
                onItemSelect: function (item, breadcrumbs, id_breadcrumbs) {
                    $scope.breadcrumbs = breadcrumbs;
                    $scope.node = item;
                },
                /**
                 * Triggered once someone clicks on a node
                 *
                 * @param node
                 * @param path
                 */
                onNodeClick: function(node, path) {
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
                    managerWidget.open_edit_folder(node, path, $scope.structure.data, managerDatastorePassword)
                },

                /**
                 * Triggered once someone clicks on a node entry
                 * Forwards to the opener of the "open-secret.html" page
                 *
                 * @param item The item in question
                 * @param path The path to the item
                 */
                on_item_click: function (item, path) {

                    return managerSecret.on_item_click(item, path);
                },

                /**
                 * Triggered once someone wants to delete a node entry
                 *
                 * @param item The item in question
                 * @param path The path to the item
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
                 * triggered once someone wants to move an item
                 *
                 * @param item_path
                 * @param target_path
                 */
                onItemDropComplete: function (item_path, target_path) {
                    return move_item($scope, item_path, target_path, 'items');
                },

                /**
                 * triggered once someone wants to move a folder
                 *
                 * @param item_path
                 * @param target_path
                 */
                onFolderDropComplete: function (item_path, target_path) {
                    return move_item($scope, item_path, target_path, 'folders');
                },
                /**
                 * blocks move if context menus are open
                 *
                 * @returns {boolean}
                 */
                blockMove: function() {
                    return contextMenusOpen > 0;
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

                        managerDatastorePassword.modifyTreeForSearch($scope.tosearchTreeFilter, undefined, $scope.structure.data);
                    });

                var update_datastore = function(value) {
                    $scope.structure.data = value;
                    managerDatastorePassword.modifyTreeForSearch($scope.tosearchTreeFilter, $scope.structure.data);
                };
                managerDatastorePassword.register('save_datastore_content', update_datastore);
                $scope.$on('$destroy', function() {
                    managerDatastorePassword.unregister('save_datastore_content', update_datastore);
                })
            }

            $scope.$watch('tosearchTreeFilter', function(newValue, oldValue) {
                managerDatastorePassword.modifyTreeForSearch(newValue, oldValue, $scope.structure.data);
            });

            /**
             * clears the input field for the tree search
             */
            $scope.clearSearchTreeForm = function () {
                $scope.tosearchTreeFilter = '';
            };

            function contextMenuOnShow(div_id) {
                dropDownMenuWatcher.on_open(div_id);
                contextMenusOpen++;
            }

            function contextMenuOnClose(div_id) {
                dropDownMenuWatcher.on_close(div_id);
                $timeout(function() {
                    contextMenusOpen--;
                }, 0);
            }

            // Modals
            function openNewFolder (event) {
                managerWidget.open_new_folder(undefined, [], $scope.structure.data, managerDatastorePassword);
            }

            /**
             * Opens the modal for a new entry
             *
             * @param parent
             * @param path
             * @param size
             */
            function open_new_item (parent, path, size) {
                managerWidget.open_new_item($scope.structure.data, parent, path, size);
            }

            function openNewItem(event) {
                open_new_item(undefined, []);
            }

            /**
             * Opens the modal to edit a entry
             *
             * @param node
             * @param path
             * @param size
             */
            function open_edit_item (node, path, size) {
                managerWidget.open_edit_item($scope.structure.data, node, path, size);
            }

            /**
             * Move an item
             *
             * @param scope the scope
             * @param item_path the path of the item
             * @param target_path the path where we want to put the item
             * @param type type of the item (item or folder)
             */
            function move_item(scope, item_path, target_path, type) {
                managerWidget.move_item(scope.structure.data, item_path, target_path, type);
            }

            /**
             * Deletes an item from the datastore
             *
             * @param scope the scope
             * @param item the item
             * @param path the path to the item
             */
            function delete_item(scope, item, path) {
                managerWidget.delete_item(scope.structure.data, item, path);
            }

        }]);


}(angular));