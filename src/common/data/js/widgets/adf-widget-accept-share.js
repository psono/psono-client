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
    module.controller('acceptShareController', ["$scope", "$interval", "config", "manager", "managerDatastorePassword",
        "managerDatastoreUser", "managerSecret", "managerShare", "$modal", "itemBlueprint", "managerAdfWidget",
        "message", "$timeout",
        function($scope, $interval, config, manager, managerDatastorePassword,
                 managerDatastoreUser, managerSecret, managerShare, $modal, itemBlueprint, managerAdfWidget, message,
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

                var modalInstance = $modal.open({
                    templateUrl: 'view/modal-new-entry.html',
                    controller: 'ModalDatastoreNewEntryCtrl',
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

                    var datastore_object = {
                        id: uuid.v4(),
                        type: content.id
                    };
                    var secret_object = {};

                    if (itemBlueprint.get_blueprint(content.id).getName) {
                        datastore_object.name = itemBlueprint.get_blueprint(content.id).getName(content.fields);
                    }

                    for (var i = content.fields.length - 1; i >= 0; i--) {

                        if (!content.fields[i].hasOwnProperty("value")) {
                            continue;
                        }
                        if (!datastore_object.name && content.title_field == content.fields[i].name) {
                            datastore_object.name = content.fields[i].value;
                        }
                        if (content.hasOwnProperty("urlfilter_field")
                            && content.urlfilter_field == content.fields[i].name) {
                            datastore_object.urlfilter = content.fields[i].value;
                        }
                        secret_object[content.fields[i].name] = content.fields[i].value;
                    }

                    var onError = function(result) {
                        // pass
                    };

                    var onSuccess = function(e) {
                        datastore_object['secret_id'] = e.secret_id;
                        datastore_object['secret_key'] = e.secret_key;

                        parent.items.push(datastore_object);

                        managerDatastorePassword.save_acceptshare($scope.structure.data, [path]);
                    };

                    managerSecret.create_secret(secret_object)
                        .then(onSuccess, onError);

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


                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(data) {

                    var modalInstance = $modal.open({
                        templateUrl: 'view/modal-edit-entry.html',
                        controller: 'ModalEditEntryCtrl',
                        size: size,
                        resolve: {
                            node: function () {
                                return node;
                            },
                            path: function () {
                                return path;
                            },
                            data: function () {
                                return data;
                            }
                        }
                    });

                    modalInstance.result.then(function (content) {

                        var secret_object = {};

                        for (var i = content.fields.length - 1; i >= 0; i--) {

                            if (!content.fields[i].hasOwnProperty("value")) {
                                continue;
                            }
                            if (content.title_field == content.fields[i].name) {
                                node.name = content.fields[i].value;
                            }
                            if (content.hasOwnProperty("urlfilter_field")
                                && content.urlfilter_field == content.fields[i].name) {
                                node.urlfilter = content.fields[i].value;
                            }
                            secret_object[content.fields[i].name] = content.fields[i].value;
                        }

                        var onError = function(result) {
                            // pass
                        };

                        var onSuccess = function(e) {
                            managerDatastorePassword.save_datastore($scope.structure.data, [path]);
                        };

                        managerSecret.write_secret(node.secret_id, node.secret_key, secret_object)
                            .then(onSuccess, onError);

                    }, function () {
                        // cancel triggered
                    });
                };

                managerSecret.read_secret(node.secret_id, node.secret_key)
                    .then(onSuccess, onError);
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

                var orig_item_path = item_path.slice();
                orig_item_path.pop();

                var orig_target_path;

                if (target_path === null) {
                    orig_target_path = [];
                } else {
                    orig_target_path = target_path.slice();
                }

                var target = scope.structure.data;
                if (target_path !== null) {
                    // find drop zone
                    var val1 = managerDatastorePassword.find_in_datastore(target_path, scope.structure.data);
                    target = val1[0][val1[1]];
                }

                // find element
                var val2 = managerDatastorePassword.find_in_datastore(item_path, scope.structure.data);

                if (val2 === false) {
                    return;
                }
                var element = val2[0][val2[1]];

                // check if we have folders / items array, otherwise create the array
                if (!target.hasOwnProperty(type)) {
                    target[type] = [];
                }

                // add the element to the other folders / items
                target[type].push(element);

                // delete the array at hte current position
                val2[0].splice(val2[1], 1);

                if (element.hasOwnProperty("share_id")) {
                    // create absolute path of the elements
                    var target_path_copy = orig_target_path.slice();
                    var item_path_copy = orig_item_path.slice();

                    target_path_copy.push(element.id);
                    item_path_copy.push(element.id);

                    managerDatastorePassword.on_share_moved(element.share_id, item_path_copy, target_path_copy, scope.structure.data, 1, 1);
                }

                managerDatastorePassword.save_datastore(scope.structure.data, [orig_item_path, orig_target_path]);
            };

            /**
             * Deletes an item
             *
             * @param scope the scope
             * @param item the item
             * @param path the path to the item
             */
            var deleteItem = function(scope, item, path) {
                // TODO ask for confirmation

                var path_of_element_to_delete = path.slice();
                var element_path_that_changed = path.slice();
                element_path_that_changed.pop();

                var search = managerDatastorePassword.find_in_datastore(path, scope.structure.data);
                var element = search[0][search[1]];

                if (search)
                    search[0].splice(search[1], 1);

                if (element.hasOwnProperty("share_id")) {
                    managerDatastorePassword.on_share_deleted(element.share_id, path_of_element_to_delete, scope.structure.data, 1)
                } else {
                    managerDatastorePassword.on_share_deleted(null, path_of_element_to_delete, scope.structure.data, 1)
                }

                managerDatastorePassword.save_datastore(scope.structure.data, [element_path_that_changed]);
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
                    managerSecret.onNodeSelect(node);
                    message.emit("modal_accept_share_breadcrumbs_update",
                        {'breadcrumbs': breadcrumbs, 'id_breadcrumbs': id_breadcrumbs});
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
                    managerSecret.onItemSelect(item);
                },
                /**
                 * Triggered once someone clicks on a node
                 *
                 * @param node
                 * @param path
                 */
                onNodeClick: function(node, path) {
                    managerSecret.onNodeClick(node, path);
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


    /**
     * Controller for the "New Entry" modal
     */
    module.controller('ModalDatastoreNewEntryCtrl', ['$scope', '$modalInstance', 'itemBlueprint', 'parent', 'path',
        function ($scope, $modalInstance, itemBlueprint, parent, path) {

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
                all: itemBlueprint.get_blueprints(),
                selected: itemBlueprint.get_default_blueprint()
            };

            $scope.has_advanced = itemBlueprint.has_advanced;

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
    module.controller('ModalEditEntryCtrl', ['$scope', '$modalInstance', 'itemBlueprint', 'node', 'path', 'data',
        function ($scope, $modalInstance, itemBlueprint, node, path, data) {

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
                all: itemBlueprint.get_blueprints(),
                selected: itemBlueprint.get_blueprint(node.type)
            };

            for (var i = $scope.bp.selected.fields.length - 1; i >= 0; i--) {
                if (data.hasOwnProperty($scope.bp.selected.fields[i].name)) {
                    $scope.bp.selected.fields[i].value = data[$scope.bp.selected.fields[i].name];
                }
            }

            $scope.has_advanced = itemBlueprint.has_advanced;

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


    /**
     * Controller for the "Share Entry" modal
     */
    module.controller('ModalShareEntryCtrl', ['$scope', '$modalInstance', '$modal', 'shareBlueprint', 'managerDatastoreUser', 'node', 'path', 'users', 'DTOptionsBuilder', 'DTColumnDefBuilder',
        function ($scope, $modalInstance, $modal, shareBlueprint, managerDatastoreUser, node, path, users, DTOptionsBuilder, DTColumnDefBuilder) {


            $scope.dtOptions = DTOptionsBuilder.newOptions();
            $scope.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1).notSortable()
            ];

            $scope.node = node;
            $scope.path = path;
            $scope.users = users;
            $scope.rights = [{
                id: 'read',
                name: 'Read',
                default_value: true
            }, {
                id: 'write',
                name: 'Write',
                default_value: true
            }, {
                id: 'grant',
                name: 'Grant',
                default_value: true
            }];

            $scope.selected_users = [];
            $scope.selected_rights = [];

            // fills selected_rights array with the default values
            for (var i = $scope.rights.length - 1; i >= 0; i--) {
                if ($scope.rights[i].default_value) {
                    $scope.selected_rights.push($scope.rights[i].id);
                }
            }

            $scope.errors = [];

            /**
             * responsible to add a user to the known users datastore
             */
            $scope.addUser = function() {

                var modalInstance = $modal.open({
                    templateUrl: 'view/modal-new-entry.html',
                    controller: 'ModalShareNewEntryCtrl',
                    resolve: {
                        parent: function () {
                        },
                        path: function () {
                            return [];
                        }
                    }
                });

                modalInstance.result.then(function (content) {

                    managerDatastoreUser.get_user_datastore()
                        .then(function (parent) {

                            console.log(content);

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

                            managerDatastoreUser.save_datastore(parent).then(function() {

                                $scope.users.push(user_object);
                                $scope.selected_users.push(user_object.id);
                            }, function() {
                                // TODO handle error
                            });
                        });

                }, function () {
                    // cancel triggered
                });
            };



            /**
             * responsible to toggle selections of rights and users and adding it to the selected_rights / selected_users
             * array
             *
             * @param id
             * @param type
             */
            $scope.toggleSelect = function(id, type) {

                var search_array;
                if (type === 'right') {
                    search_array = $scope.selected_rights;
                } else {
                    search_array = $scope.selected_users;
                }

                var array_index = search_array.indexOf(id);
                if (array_index > -1) {
                    //its selected, lets deselect it
                    search_array.splice(array_index, 1);
                } else {
                    search_array.push(id);
                }
            };

            /**
             * Triggered once someone clicks the save button in the modal
             */
            $scope.save = function () {
                $modalInstance.close({
                    node: $scope.node,
                    path: $scope.path,
                    users: $scope.users,
                    selected_users: $scope.selected_users,
                    rights: $scope.rights,
                    selected_rights: $scope.selected_rights
                });
            };

            /**
             * Triggered once someone clicks the cancel button in the modal
             */
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }]);


})(angular, uuid);