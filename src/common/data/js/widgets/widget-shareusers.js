(function(angular, uuid) {
    'use strict';

    /**
     * Module for the shareusers widget
     */
    var module = angular.module('psonocli');


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
     *
     * @description
     * Main Controller for the shareusers widget
     */
    module.controller('ShareusersCtrl', ["$scope", "$interval", "managerSecret", "managerDatastoreUser",
        "$uibModal", "shareBlueprint", "managerWidget", "$timeout", "dropDownMenuWatcher",
        function ($scope, $interval, managerSecret, managerDatastoreUser, $uibModal, shareBlueprint,
                  managerWidget, $timeout, dropDownMenuWatcher) {

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
                managerWidget.open_new_folder(undefined, [], $scope.structure.data, managerDatastoreUser);
            };

            /**
             * Opens the modal for a new user entry
             *
             * @param parent
             * @param path
             * @param size
             */
            var open_new_item = function (parent, path, size) {

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
                        id: uuid.v4(),
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
                        user_object.data[content.fields[i].name] = content.fields[i].value;
                    }

                    parent.items.push(user_object);

                    managerDatastoreUser.save_datastore($scope.structure.data);

                }, function () {
                    // cancel triggered
                });
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

                        // lets save all the rest in the normal data fields
                        node.data[content.fields[i].name] = content.fields[i].value;
                    }

                    managerDatastoreUser.save_datastore($scope.structure.data);

                }, function () {
                    // cancel triggered
                });
            };

            // Shareusers Structure Management

            $scope.structure = {data: {}};

            managerDatastoreUser.get_user_datastore()
                .then(function (data) {
                    $scope.structure.data = data;
                });


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
                 * Triggered once someone selects an item
                 *
                 * @param item
                 * @param breadcrumbs
                 */
                onItemSelect: function (item, breadcrumbs, id_breadcrumbs) {
                    $scope.breadcrumbs = breadcrumbs;
                    $scope.node = item;
                    //managerSecret.onItemSelect(item);
                },
                /**
                 * Triggered once someone clicks on a node
                 *
                 * @param node
                 * @param path
                 */
                onNodeClick: function (node, path) {
                    //managerSecret.onNodeClick(node, path);
                },
                /**
                 * Triggered once someone clicks the delete node entry
                 *
                 * @param node The node in question
                 * @param path The path to the node
                 */
                onDeleteNode: function (node, path) {
                    // TODO ask for confirmation

                    var val = managerWidget.find_in_structure(path, $scope.structure.data);
                    if (val)
                        val[0].splice(val[1], 1);
                    managerDatastoreUser.save_datastore($scope.structure.data);
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
                 */
                onDeleteItem: function (item, path) {
                    // TODO ask for confirmation

                    var val = managerWidget.find_in_structure(path, $scope.structure.data);
                    if (val)
                        val[0].splice(val[1], 1);

                    managerDatastoreUser.save_datastore($scope.structure.data);
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

                /**
                 * triggered once someone wants to move an item
                 *
                 * @param item_path
                 * @param target_path
                 */
                onItemDropComplete: function (item_path, target_path) {

                    var target = $scope.structure.data;
                    if (target_path !== null) {
                        // find drop zone
                        var val1 = managerWidget.find_in_structure(target_path, $scope.structure.data);
                        target = val1[0][val1[1]];
                    }
                    // find element
                    var val2 = managerWidget.find_in_structure(item_path, $scope.structure.data);

                    if (val2 === false) {
                        return;
                    }
                    var element = val2[0][val2[1]];

                    // check if we have folders, otherwise create the array
                    if (!target.hasOwnProperty('items')) {
                        target.items = [];
                    }

                    // add the element to the other folders
                    target.items.push(element);

                    // delete the array at hte current position
                    val2[0].splice(val2[1], 1);

                    managerDatastoreUser.save_datastore($scope.structure.data);
                },

                /**
                 * triggered once someone wants to move a folder
                 *
                 * @param item_path
                 * @param target_path
                 */
                onFolderDropComplete: function (item_path, target_path) {


                    var target = $scope.structure.data;
                    if (target_path !== null) {
                        // find drop zone
                        var val1 = managerWidget.find_in_structure(target_path, $scope.structure.data);
                        target = val1[0][val1[1]];
                    }

                    // find element
                    var val2 = managerWidget.find_in_structure(item_path, $scope.structure.data);

                    if (val2 === false) {
                        return;
                    }
                    var element = val2[0][val2[1]];

                    // check if we have folders, otherwise create the array
                    if (!target.hasOwnProperty('folders')) {
                        target.folders = [];
                    }

                    // add the element to the other folders
                    target.folders.push(element);

                    // delete the array at hte current position
                    val2[0].splice(val2[1], 1);

                    managerDatastoreUser.save_datastore($scope.structure.data);
                },
                /**
                 * blocks move if context menus are open
                 *
                 * @returns {boolean}
                 */
                blockMove: function () {
                    return contextMenusOpen > 0;
                },
                contextMenuOnShow: $scope.contextMenuOnShow,
                contextMenuOnClose: $scope.contextMenuOnClose,

                textConfig: {
                    'new_entry': {name: 'New User', icon: 'fa fa-user-plus'}
                },

                getAdditionalButtons: shareBlueprint.get_additional_functions,
                item_icon: managerWidget.item_icon
            };

        }]);
    

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalShareNewEntryCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.shareBlueprint
     * @requires psonocli.browserClient
     *
     * @description
     * Controller for the "New Entry" modal
     */
    module.controller('ModalShareNewEntryCtrl', ['$scope', '$uibModalInstance', 'shareBlueprint', 'browserClient', 'helper', 'parent', 'path',
        function ($scope, $uibModalInstance, shareBlueprint, browserClient, helper, parent, path) {

            $scope.parent = parent;
            $scope.path = path;
            $scope.name = '';
            $scope.content = '';
            $scope.isCollapsed = true;


            $scope.errors = [];

            $scope.reset = function() {
                $scope.submitted = false;
            };

            $scope.bp = {
                all: shareBlueprint.get_blueprints(),
                selected: shareBlueprint.get_default_blueprint()
            };

            $scope.has_advanced = shareBlueprint.has_advanced;

            $scope.form_control = {'block_submit': true};

            var onSuccess = function(config) {

                /* Server selection with preselection */
                $scope.servers = config['backend_servers'];
                $scope.filtered_servers = $scope.servers;
                $scope.selected_server = $scope.servers[0];
                $scope.selected_server_title = $scope.selected_server.title;
                $scope.selected_server_url = $scope.selected_server.url;
                $scope.selected_server_domain = helper.get_domain($scope.selected_server.url);
            };

            var onError = function() {

            };

            browserClient.get_config().then(onSuccess, onError);

            /**
             * Triggered once someone clicks the save button in the modal
             */
            $scope.save = function () {

                if ($scope.newEntryForm.$invalid) {
                    return;
                }

                $uibModalInstance.close($scope.bp.selected);
            };

            /**
             * Triggered once someone clicks the cancel button in the modal
             */
            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };
        }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalShareEditEntryCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.shareBlueprint
     *
     * @description
     * Controller for the "Edit Entry" modal
     */
    module.controller('ModalShareEditEntryCtrl', ['$scope', '$uibModalInstance', 'shareBlueprint', 'node', 'path', 'data',
        function ($scope, $uibModalInstance, shareBlueprint, node, path, data) {

            $scope.node = node;
            $scope.path = path;
            $scope.name = node.name;
            $scope.content = '';
            $scope.isCollapsed = true;

            $scope.errors = [];

            $scope.reset = function() {
                $scope.submitted = false;
            };

            $scope.bp = {
                all: shareBlueprint.get_blueprints(),
                selected: shareBlueprint.get_blueprint(node.type)
            };

            for (var i = $scope.bp.selected.fields.length - 1; i >= 0; i--) {
                if (data.hasOwnProperty($scope.bp.selected.fields[i].name)) {
                    $scope.bp.selected.fields[i].value = data[$scope.bp.selected.fields[i].name];
                }
            }

            $scope.has_advanced = shareBlueprint.has_advanced;

            /**
             * Triggered once someone clicks the save button in the modal
             */
            $scope.save = function () {

                if ($scope.editEntryForm.$invalid) {
                    return;
                }

                $uibModalInstance.close($scope.bp.selected);
            };

            /**
             * Triggered once someone clicks the cancel button in the modal
             */
            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            if (typeof $scope.bp.selected.onEditModalOpen !== 'undefined') {
                $scope.bp.selected.onEditModalOpen($scope.bp.selected);
            }
        }]);

}(angular, uuid));