(function(angular, uuid) {
    'use strict';

    /**
     * Module for the shareusers widget
     */
    var module = angular.module('adf.widget.shareusers', ['adf.provider']);

    /**
     * Config for the shareusers widget
     */
    module.config(function(dashboardProvider){
        dashboardProvider
            .widget('shareusers', {
                title: 'Trusted Users',
                description: 'provides the shareusers',
                templateUrl: 'view/shareusers-view.html',
                controller: 'shareusersController',
                controllerAs: 'shareusers',
                edit: {
                    templateUrl: 'view/shareusers-edit.html'
                }
            });
    });

    /**
     * Main Controller for the shareusers widget
     */
    module.controller('shareusersController', ["$scope", "$interval", "config", "managerSecret", "managerDatastoreUser",
        "$modal", "shareBlueprint", "managerAdfWidget", "$timeout",
        function ($scope, $interval, config, managerSecret, managerDatastoreUser, $modal, shareBlueprint,
                  managerAdfWidget, $timeout) {

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
                managerAdfWidget.openNewFolder(undefined, [], $scope.structure.data, managerDatastoreUser);
            };

            /**
             * Opens the modal for a new user entry
             *
             * @param parent
             * @param path
             * @param size
             */
            var openNewItem = function (parent, path, size) {

                var modalInstance = $modal.open({
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
                        if (!user_object.name && content.title_field == content.fields[i].name) {
                            user_object.name = content.fields[i].value;
                        }
                        if (content.hasOwnProperty("urlfilter_field")
                            && content.urlfilter_field == content.fields[i].name) {
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

                var modalInstance = $modal.open({
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
                        if (!new_name && content.title_field == content.fields[i].name) {
                            node.name = content.fields[i].value;
                        }

                        // found a urlfilter field, lets put it into our urlfilter
                        if (content.hasOwnProperty("urlfilter_field")
                            && content.urlfilter_field == content.fields[i].name) {
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
                    managerSecret.onNodeSelect(node);
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
                    managerSecret.onItemSelect(item);
                },
                /**
                 * Triggered once someone clicks on a node
                 *
                 * @param node
                 * @param path
                 */
                onNodeClick: function (node, path) {
                    managerSecret.onNodeClick(node, path);
                },
                /**
                 * Triggered once someone clicks the delete node entry
                 *
                 * @param node The node in question
                 * @param path The path to the node
                 */
                onDeleteNode: function (node, path) {
                    // TODO ask for confirmation

                    var val = managerAdfWidget.findInStructure(path, $scope.structure.data);
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
                    managerAdfWidget.openEditFolder(node, path, $scope.structure.data, managerDatastoreUser);
                },

                /**
                 * Triggered once someone clicks on a node entry
                 *
                 * @param item The item in question
                 * @param path The path to the item
                 */
                onItemClick: function (item, path) {
                    managerSecret.onItemClick(item, path);
                },

                /**
                 * Triggered once someone wants to delete a node entry
                 *
                 * @param item The item in question
                 * @param path The path to the item
                 */
                onDeleteItem: function (item, path) {
                    // TODO ask for confirmation

                    var val = managerAdfWidget.findInStructure(path, $scope.structure.data);
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
                    openEditItem(item, path)
                },

                /**
                 * Triggered once someone wants to create a new folder
                 *
                 * @param parent The parent for the new folder
                 * @param path The path to the parent
                 */
                onNewFolder: function (parent, path) {
                    managerAdfWidget.openNewFolder(parent, path, $scope.structure.data, managerDatastoreUser);
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
                 * triggered once someone wants to move an item
                 *
                 * @param item_path
                 * @param target_path
                 */
                onItemDropComplete: function (item_path, target_path) {

                    var target = $scope.structure.data;
                    if (target_path !== null) {
                        // find drop zone
                        var val1 = managerAdfWidget.findInStructure(target_path, $scope.structure.data);
                        target = val1[0][val1[1]];
                    }
                    // find element
                    var val2 = managerAdfWidget.findInStructure(item_path, $scope.structure.data);

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
                        var val1 = managerAdfWidget.findInStructure(target_path, $scope.structure.data);
                        target = val1[0][val1[1]];
                    }

                    // find element
                    var val2 = managerAdfWidget.findInStructure(item_path, $scope.structure.data);

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
                itemIcon: managerAdfWidget.itemIcon
            };

        }]);
    

    /**
     * Controller for the "New Entry" modal
     */
    module.controller('ModalShareNewEntryCtrl', ['$scope', '$modalInstance', 'shareBlueprint', 'parent', 'path',
        function ($scope, $modalInstance, shareBlueprint, parent, path) {

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

            /**
             * Triggered once someone clicks the save button in the modal
             */
            $scope.save = function () {

                if ($scope.newEntryForm.$invalid) {
                    return;
                }

                $modalInstance.close($scope.bp.selected);
            };

            /**
             * Triggered once someone clicks the cancel button in the modal
             */
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }]);

    /**
     * Controller for the "Edit Entry" modal
     */
    module.controller('ModalShareEditEntryCtrl', ['$scope', '$modalInstance', 'shareBlueprint', 'node', 'path', 'data',
        function ($scope, $modalInstance, shareBlueprint, node, path, data) {

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

                $modalInstance.close($scope.bp.selected);
            };

            /**
             * Triggered once someone clicks the cancel button in the modal
             */
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            if (typeof $scope.bp.selected.onEditModalOpen !== 'undefined') {
                $scope.bp.selected.onEditModalOpen($scope.bp.selected);
            }
        }]);

})(angular, uuid);