(function(angular) {
    'use strict';

    /**
     * Module for the datastore widget
     */
    var module = angular.module('adf.widget.datastore', ['adf.provider']);


    /**
     * Config for the datastore widget
     */
    module.config(['dashboardProvider', function(dashboardProvider){
        dashboardProvider
            .widget('datastore', {
                title: 'Datastore',
                description: 'provides the datastore',
                templateUrl: 'view/datastore-view.html',
                controller: 'datastoreController',
                controllerAs: 'datastore',
                edit: {
                    templateUrl: 'view/datastore-edit.html'
                }
            });
    }]);


    /**
     * Main Controller for the datastore widget
     */
    module.controller('datastoreController', ["$scope", "config", "manager", "managerDatastorePassword",
        "$uibModal", "itemBlueprint", "managerAdfWidget", "managerSecret", "$timeout",
        function($scope, config, manager, managerDatastorePassword,
                 $uibModal, itemBlueprint, managerAdfWidget, managerSecret, $timeout){

            var contextMenusOpen = 0;

            $scope.contextMenuOnShow = function() {
                contextMenusOpen++;
            };

            $scope.contextMenuOnClose = function() {
                $timeout(function() {
                    contextMenusOpen--;
                }, 0);
            };

            // Modals
            $scope.openNewFolder = function (event) {
                managerAdfWidget.openNewFolder(undefined, [], $scope.structure.data, managerDatastorePassword);
            };

            /**
             * Opens the modal for a new entry
             *
             * @param parent
             * @param path
             * @param size
             */
            var openNewItem = function (parent, path, size) {
                managerAdfWidget.openNewItem($scope.structure.data, parent, path, size);
            };
            $scope.openNewItem = function (event) {
                openNewItem(undefined, []);
            };

            /**
             * Opens the modal to edit a entry
             *
             * @param node
             * @param path
             * @param size
             */
            var openEditItem = function (node, path, size) {
                managerAdfWidget.openEditItem($scope.structure.data, node, path, size);
            };

            // Datastore Structure Management
            $scope.structure = { data: {}} ;

            var fill_password_datastore = function(data) {
                $scope.structure.data = data;
            };

            managerDatastorePassword.get_password_datastore()
                .then(fill_password_datastore);

            /**
             * Move an item
             *
             * @param scope the scope
             * @param item_path the path of the item
             * @param target_path the path where we want to put the item
             * @param type type of the item (item or folder)
             */
            var moveItem = function(scope, item_path, target_path, type) {
                managerAdfWidget.moveItem(scope.structure.data, item_path, target_path, type);
            };

            /**
             * Deletes an item from the datastore
             *
             * @param scope the scope
             * @param item the item
             * @param path the path to the item
             */
            var deleteItem = function(scope, item, path) {
                managerAdfWidget.deleteItem(scope.structure.data, item, path);
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
                    return deleteItem($scope, node, path);
                },

                /**
                 * Triggered once someone wants to edit a node entry
                 *
                 * @param node The node in question
                 * @param path The path to the node
                 */
                onEditNode: function (node, path) {
                    managerAdfWidget.openEditFolder(node, path, $scope.structure.data, managerDatastorePassword)
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
                    return deleteItem($scope, item, path);
                },

                /**
                 * Triggered once someone wants to edit a node entry
                 *
                 * @param item The item in question
                 * @param path The path to the item
                 */
                onEditItem: function (item, path) {
                    openEditItem(item, path)
                },

                /**
                 * Triggered once someone wants to create a new folder
                 *
                 * @param parent The parent for the new folder
                 * @param path The path to the parent
                 */
                onNewFolder: function (parent, path) {
                    managerAdfWidget.openNewFolder(parent, path, $scope.structure.data, managerDatastorePassword);
                },

                /**
                 * Triggered once someone wants to create a new Item
                 *
                 * @param parent The parent for the new item
                 * @param path The path to the parent
                 */
                onNewItem: function (parent, path) {
                    openNewItem(parent, path)
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
                    return moveItem($scope, item_path, target_path, 'items');
                },

                /**
                 * triggered once someone wants to move a folder
                 *
                 * @param item_path
                 * @param target_path
                 */
                onFolderDropComplete: function (item_path, target_path) {
                    return moveItem($scope, item_path, target_path, 'folders');
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
                itemIcon: managerAdfWidget.itemIcon
            };

        }]);


})(angular);