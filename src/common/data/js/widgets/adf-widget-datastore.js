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
                controller: 'DatastoreCtrl',
                controllerAs: 'datastore',
                edit: {
                    templateUrl: 'view/datastore-edit.html'
                }
            });
    }]);


    /**
     * @ngdoc controller
     * @name psonocli.controller:DatastoreCtrl
     * @requires $scope
     * @requires config
     * @requires $uibModal
     * @requires $timeout
     * @requires ngTree.dropDownMenuWatcher
     * @requires psonocli.manager
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.itemBlueprint
     * @requires psonocli.managerAdfWidget
     * @requires psonocli.managerSecret
     *
     * @description
     * Main Controller for the datastore widget
     */
    module.controller('DatastoreCtrl', ["$scope", "config", "manager", "managerDatastorePassword",
        "$uibModal", "itemBlueprint", "managerAdfWidget", "managerSecret", "$timeout", "dropDownMenuWatcher",
        function($scope, config, manager, managerDatastorePassword,
                 $uibModal, itemBlueprint, managerAdfWidget, managerSecret, $timeout, dropDownMenuWatcher){

            var contextMenusOpen = 0;

            $scope.contextMenuOnShow = function(div_id) {
                dropDownMenuWatcher.on_open(div_id);
                contextMenusOpen++;
            };

            $scope.contextMenuOnClose = function(div_id) {
                dropDownMenuWatcher.on_close(div_id);
                $timeout(function() {
                    contextMenusOpen--;
                }, 0);
            };

            // Modals
            $scope.open_new_folder = function (event) {
                managerAdfWidget.open_new_folder(undefined, [], $scope.structure.data, managerDatastorePassword);
            };

            /**
             * Opens the modal for a new entry
             *
             * @param parent
             * @param path
             * @param size
             */
            var open_new_item = function (parent, path, size) {
                managerAdfWidget.open_new_item($scope.structure.data, parent, path, size);
            };
            $scope.open_new_item = function (event) {
                open_new_item(undefined, []);
            };

            /**
             * Opens the modal to edit a entry
             *
             * @param node
             * @param path
             * @param size
             */
            var open_edit_item = function (node, path, size) {
                managerAdfWidget.open_edit_item($scope.structure.data, node, path, size);
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
            var move_item = function(scope, item_path, target_path, type) {
                managerAdfWidget.move_item(scope.structure.data, item_path, target_path, type);
            };

            /**
             * Deletes an item from the datastore
             *
             * @param scope the scope
             * @param item the item
             * @param path the path to the item
             */
            var delete_item = function(scope, item, path) {
                managerAdfWidget.delete_item(scope.structure.data, item, path);
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
                    return delete_item($scope, node, path);
                },

                /**
                 * Triggered once someone wants to edit a node entry
                 *
                 * @param node The node in question
                 * @param path The path to the node
                 */
                onEditNode: function (node, path) {
                    managerAdfWidget.open_edit_folder(node, path, $scope.structure.data, managerDatastorePassword)
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
                    managerAdfWidget.open_new_folder(parent, path, $scope.structure.data, managerDatastorePassword);
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
                item_icon: managerAdfWidget.item_icon
            };

        }]);


}(angular));