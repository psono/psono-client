(function(angular, uuid) {
    'use strict';

    /**
     * Module for the acceptshare widget
     */
    var module = angular.module('adf.widget.acceptshare', ['adf.provider']);

    /**
     * Config for the acceptshare widget
     */
    module.config(function(dashboardProvider){
        dashboardProvider
            .widget('acceptshare', {
                title: 'Accept Share',
                description: 'provides the accept share',
                templateUrl: 'view/accept-share-view.html',
                controller: 'acceptShareController',
                controllerAs: 'acceptShare',
                edit: {
                    templateUrl: 'view/accept-share-edit.html'
                }
            });
    });

    /**
     * Main Controller for the acceptshare widget
     */
    module.controller('acceptShareController', ["$scope", "config", "manager", "managerDatastorePassword",
        "$modal", "itemBlueprint", "managerAdfWidget",
        "message", "$timeout",
        function($scope, config, manager, managerDatastorePassword,
                 $modal, itemBlueprint, managerAdfWidget, message,
                 $timeout){

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

                // hide shares if the user has no grant rights


                var hide_shares = function (share) {

                    for (var share_id in share.share_index) {
                        if (!share.share_index.hasOwnProperty(share_id)) {
                            continue;
                        }

                        for (var i = share.share_index[share_id].paths.length - 1; i >= 0; i--) {
                            var path_copy = share.share_index[share_id].paths[i].slice();
                            var search = managerDatastorePassword.find_in_datastore(path_copy, share);

                            var obj = search[0][search[1]];

                            obj.is_selectable = false;
                        }
                    }
                };

                if (!config.item.share_right_grant) {
                    // hide share if the user has no grant rights
                    hide_shares(data);
                }

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
                    message.emit("modal_accept_share_breadcrumbs_update",
                        {'breadcrumbs': breadcrumbs, 'id_breadcrumbs': id_breadcrumbs});
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



})(angular, uuid);