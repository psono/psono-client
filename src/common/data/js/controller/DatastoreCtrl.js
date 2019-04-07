(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:DatastoreCtrl
     * @requires $rootScope
     * @requires $scope
     * @requires $uibModal
     * @requires $routeParams
     * @requires $timeout
     * @requires ngTree.dropDownMenuWatcher
     * @requires psonocli.manager
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.managerDatastore
     * @requires psonocli.offlineCache
     * @requires psonocli.itemBlueprint
     * @requires psonocli.managerWidget
     * @requires psonocli.managerSecret
     *
     * @description
     * Main Controller for the datastore widget
     */
    angular.module('psonocli').controller('DatastoreCtrl', ["$q", "$rootScope", "$scope", "$uibModal", "$routeParams",
        "$timeout", "manager", "managerDatastorePassword", 'managerDatastore', 'offlineCache', "itemBlueprint",
        "managerWidget", "managerSecret", "dropDownMenuWatcher", "managerFileTransfer",
        function($q, $rootScope, $scope, $uibModal, $routeParams,
                 $timeout, manager, managerDatastorePassword, managerDatastore, offlineCache, itemBlueprint,
                 managerWidget, managerSecret, dropDownMenuWatcher, managerFileTransfer){

            $scope.contextMenuOnShow = contextMenuOnShow;
            $scope.contextMenuOnClose = contextMenuOnClose;
            $scope.openNewFolder = openNewFolder;
            $scope.openNewItem = openNewItem;
            $scope.show_share_content = false;

            $scope.tosearchTreeFilter = $routeParams.default_search;
            $scope.structure = {
                data: {},
                loaded: false
            } ;
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
                 * Triggered once someone clicks the delete node entry
                 *
                 * @param node The node in question
                 * @param path The path to the node
                 */
                onDeleteNode: function (node, path) {
                    return delete_item($scope, node, path);
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
                 * Forwards to the opener of the "open-secret.html" page or the file download
                 *
                 * @param item The item in question
                 * @param path The path to the item
                 */
                on_item_click: function (item, path) {
                    if (item.type === 'file') {
                        return managerFileTransfer.on_item_click(item, path);
                    } else {
                        return managerSecret.on_item_click(item, path);
                    }
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
                 * Triggered once someone wants to move a node entry
                 *
                 * @param item_path The path of the item
                 * @param target_path The path to target folder
                 */
                onMoveItem: function (item_path, target_path) {
                    return move_item($scope, item_path, target_path, 'items');
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
                contextMenuOnShow: $scope.contextMenuOnShow,
                contextMenuOnClose: $scope.contextMenuOnClose,

                getAdditionalButtons: itemBlueprint.get_additional_functions,
                item_icon: managerWidget.item_icon
            };

            activate();

            function activate() {
                $scope.offline = offlineCache.is_active();
                $rootScope.$on('offline_mode_enabled', function() {
                    $scope.offline = true;
                });

                $rootScope.$on('offline_mode_disabled', function() {
                    $scope.offline = false;
                    load_datastore();
                });

                load_datastore().then(function(){
                    managerDatastore.register('on_datastore_overview_update', load_datastore);
                });
                managerDatastorePassword.register('save_datastore_content', update_datastore);
                $scope.$on('$destroy', function() {
                    managerDatastorePassword.unregister('save_datastore_content', update_datastore);
                });

                $rootScope.$on('show-entry-big', function(evt, args) {
                    $scope.show_share_content = true;
                    $timeout(function() {
                        $rootScope.$broadcast('show-entry-big-load', args);
                    }, 0);
                });

                $rootScope.$on('close-entry-big', function(data) {
                    $scope.show_share_content = false;
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:DatastoreCtrl#load_datastore
             * @methodOf psonocli.controller:DatastoreCtrl
             *
             * @description
             * Loads the datastore
             */
            function load_datastore() {
                return $q(function (resolve) {
                    if (offlineCache.is_active() && offlineCache.is_locked()) {

                        var modalInstance = $uibModal.open({
                            templateUrl: 'view/modal/unlock-offline-cache.html',
                            controller: 'ModalUnlockOfflineCacheCtrl',
                            backdrop: 'static',
                            resolve: {
                            }
                        });

                        modalInstance.result.then(function () {
                            // pass, will be catched later with the on_set_encryption_key event
                        }, function () {
                            $rootScope.$broadcast('force_logout', '');
                        });
                        offlineCache.on_set_encryption_key(function() {
                            resolve(load());
                            modalInstance.close();
                        })
                    } else {
                        resolve(load());
                    }

                    function load() {

                        $scope.structure.data = {};
                        $scope.structure.loaded = false;

                        return managerDatastorePassword.get_password_datastore()
                            .then(function(data) {
                                $scope.structure.data = data;
                                $scope.structure.loaded = true;

                                autoupload_edit_item();

                                managerDatastorePassword.modifyTreeForSearch($scope.tosearchTreeFilter, $scope.structure.data);
                            });
                    }
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:DatastoreCtrl#update_datastore
             * @methodOf psonocli.controller:DatastoreCtrl
             *
             * @description
             * Called for every update on the datastore
             *
             * @param datastore The new datastore
             */
            function update_datastore(datastore) {
                $scope.structure.data = datastore;
                managerDatastorePassword.modifyTreeForSearch($scope.tosearchTreeFilter, $scope.structure.data);
            }

            /**
             * all about the datastore search:
             */
            var filterTimeout;
            $scope.$watch('tosearchTreeFilter', function(newValue) {
                if (filterTimeout) {
                    $timeout.cancel(filterTimeout);
                }
                filterTimeout = $timeout(function() {
                    managerDatastorePassword.modifyTreeForSearch(newValue, $scope.structure.data);
                }, 300); // delay 300 ms
            });

            /**
             * clears the input field for the tree search
             */
            $scope.clearSearchTreeForm = function () {
                $scope.tosearchTreeFilter = '';
            };

            function contextMenuOnShow(div_id) {
                dropDownMenuWatcher.on_open(div_id);
            }

            function contextMenuOnClose(div_id) {
                dropDownMenuWatcher.on_close(div_id);
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
             * Triggered during loading of the datastore controller.
             * Checks if secret_id for editing is registered in $routeParams.
             * If it is, it will search the path and open the widget form to edit it.
             */
            function autoupload_edit_item() {
                if (typeof($routeParams.secret_type) === 'undefined') {
                    return;
                }
                var paths = managerDatastorePassword.search_in_datastore($routeParams.secret_id, $scope.structure.data, function(secret_id, item) {
                    return item.hasOwnProperty('secret_id') && item.secret_id === secret_id;
                });
                if (paths.length === 0) {
                    return
                }
                var search = managerDatastorePassword.find_in_datastore(paths[0], $scope.structure.data);
                var node = search[0][search[1]];

                managerWidget.open_edit_item($scope.structure.data, node, paths[0]);
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
                managerWidget.delete_item(scope.structure.data, item, path, 'password');
            }

        }]);


}(angular));