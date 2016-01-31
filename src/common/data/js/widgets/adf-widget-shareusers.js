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
                title: 'Shareusers',
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
    module.controller('shareusersController', ["$scope", "$interval", "config", "manager", "managerDatastore", "$modal",
        "shareBlueprint",
        function($scope, $interval, config, manager, managerDatastore, $modal, shareBlueprint){

            // Modals

            /**
             * Opens the modal to create a new folder
             *
             * @param parent The parent of the new folder
             * @param path The path to the parent of the new folder
             * @param size The size of the modal
             */
            var openNewFolder = function (parent, path, size) {

                var modalInstance = $modal.open({
                    templateUrl: 'view/modal-new-folder.html',
                    controller: 'ModalNewFolderCtrl',
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

                modalInstance.result.then(function (name) {
                    if (typeof parent === 'undefined') {
                        parent = $scope.structure.data;
                    }

                    if (typeof parent.folders === 'undefined') {
                        parent.folders = [];
                    }
                    parent.folders.push({
                        id: uuid.v4(),
                        name: name
                    });

                    managerDatastore.save_user_datastore($scope.structure.data);

                }, function () {
                    // cancel triggered
                });
            };

            $scope.openNewFolder = function (event) {
                openNewFolder(undefined, []);
            };

            /**
             * Opens the modal to edit a folder
             *
             * @param node The node you want to edit
             * @param path The path to the node
             * @param size The size of the modal
             */
            var openEditFolder = function (node, path, size) {

                var modalInstance = $modal.open({
                    templateUrl: 'view/modal-edit-folder.html',
                    controller: 'ModalEditFolderCtrl',
                    size: size,
                    resolve: {
                        node: function () {
                            return node;
                        },
                        path: function () {
                            return path;
                        }
                    }
                });

                modalInstance.result.then(function (name) {
                    node.name = name;

                    managerDatastore.save_user_datastore($scope.structure.data);

                }, function () {
                    // cancel triggered
                });
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

                    var shareusers_object = {
                        id: uuid.v4(),
                        type: content.id,
                        data: {}
                    };

                    if (shareBlueprint.get_blueprint(content.id).getName) {
                        shareusers_object.name = shareBlueprint.get_blueprint(content.id).getName(content.columns);
                    }

                    for (var i = 0; i < content.columns.length; i++) {

                        if (!content.columns[i].hasOwnProperty("value")) {
                            continue;
                        }
                        if (!shareusers_object.name && content.title_column == content.columns[i].name) {
                            shareusers_object.name = content.columns[i].value;
                        }
                        if (content.hasOwnProperty("urlfilter_column")
                            && content.urlfilter_column == content.columns[i].name) {
                            shareusers_object.urlfilter = content.columns[i].value;
                        }
                        shareusers_object.data[content.columns[i].name] = content.columns[i].value;
                    }

                    parent.items.push(shareusers_object);

                    managerDatastore.save_user_datastore($scope.structure.data);

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

                    var secret_object = {};

                    for (var i = 0; i < content.columns.length; i++) {

                        if (!content.columns[i].hasOwnProperty("value")) {
                            continue;
                        }
                        if (content.title_column == content.columns[i].name) {
                            node.name = content.columns[i].value;
                        }
                        if (content.hasOwnProperty("urlfilter_column")
                            && content.urlfilter_column == content.columns[i].name) {
                            node.urlfilter = content.columns[i].value;
                        }
                        secret_object[content.columns[i].name] = content.columns[i].value;
                    }

                    managerDatastore.save_user_datastore($scope.structure.data);

                }, function () {
                    // cancel triggered
                });
            };

            // Shareusers Structure Management

            $scope.structure = { data: {}} ;

            managerDatastore.get_user_datastore()
                .then(function (data) {$scope.structure.data = data;});


            /**
             * Go through the structure to find the object specified with the path
             *
             * @param path The path to the object you search as list of ids
             * @param structure The structure object tree
             * @returns {*} False if not present or a list of two objects where the first is the List Object containing the searchable object and the second the index
             */
            var findInStructure = function (path, structure) {
                var to_search = path.shift();
                var n = undefined;

                if (path.length == 0) {
                    // found the object
                    // check if its a folder, if yes return the folder list and the index
                    if (structure.hasOwnProperty('folders')) {
                        for (n = 0; n < structure.folders.length; n++) {
                            if (structure.folders[n].id == to_search) {
                                return [structure.folders, n];
                                // structure.folders.splice(n, 1);
                                // return true;
                            }
                        }
                    }
                    // check if its a file, if yes return the file list and the index
                    if (structure.hasOwnProperty('items')) {
                        for (n = 0; n < structure.items.length; n++) {
                            if (structure.items[n].id == to_search) {
                                return [structure.items, n];
                                // structure.items.splice(n, 1);
                                // return true;
                            }
                        }
                    }
                    // something went wrong, couldn't find the file / folder here
                    return false;
                }

                for (n = 0; n < structure.folders.length; n++) {
                    if (structure.folders[n].id == to_search) {
                        return findInStructure(path, structure.folders[n]);
                    }
                }
                return false;
            };

            $scope.options = {
                /**
                 * Triggered once someone selects a node
                 *
                 * @param node
                 * @param breadcrums
                 */
                onNodeSelect: function (node, breadcrums) {
                    $scope.breadcrums = breadcrums;
                    $scope.node = node;
                    manager.onNodeSelect(node);
                },
                /**
                 * Triggered once someone selects an item
                 *
                 * @param item
                 * @param breadcrums
                 */
                onItemSelect: function (item, breadcrums) {
                    $scope.breadcrums = breadcrums;
                    $scope.node = item;
                    manager.onItemSelect(item);
                },
                /**
                 * Triggered once someone clicks on a node
                 *
                 * @param node
                 * @param path
                 */
                onNodeClick: function(node, path) {
                    manager.onNodeClick(node, path);
                },
                /**
                 * Triggered once someone clicks the delete node entry
                 *
                 * @param node The node in question
                 * @param path The path to the node
                 */
                onDeleteNode: function (node, path) {
                    // TODO ask for confirmation

                    var val = findInStructure(path, $scope.structure.data);
                    if (val)
                        val[0].splice(val[1], 1);
                    managerDatastore.save_user_datastore($scope.structure.data);
                },

                /**
                 * Triggered once someone wants to edit a node entry
                 *
                 * @param node The node in question
                 * @param path The path to the node
                 */
                onEditNode: function (node, path) {
                    openEditFolder(node, path)
                },

                /**
                 * Triggered once someone clicks on a node entry
                 *
                 * @param item The item in question
                 * @param path The path to the item
                 */
                onItemClick: function (item, path) {
                    manager.onItemClick(item, path);
                },

                /**
                 * Triggered once someone wants to delete a node entry
                 *
                 * @param item The item in question
                 * @param path The path to the item
                 */
                onDeleteItem: function (item, path) {
                    // TODO ask for confirmation

                    var val = findInStructure(path, $scope.structure.data);
                    if (val)
                        val[0].splice(val[1], 1);

                    managerDatastore.save_user_datastore($scope.structure.data);
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
                    openNewFolder(parent, path)
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
                    var val1 = findInStructure(target_path, $scope.structure.data);
                    target = val1[0][val1[1]];
                }
                // find element
                var val2 = findInStructure(item_path, $scope.structure.data);

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

                managerDatastore.save_user_datastore($scope.structure.data);
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
                    var val1 = findInStructure(target_path, $scope.structure.data);
                    target = val1[0][val1[1]];
                }

                // find element
                var val2 = findInStructure(item_path, $scope.structure.data);

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

                managerDatastore.save_user_datastore($scope.structure.data);
            },

            /**
             * Returns the class of the icon used to display a specific item
             *
             * @param item
             * @returns {*|string}
             */
            itemIcon: function (item) {
                var iconClassMap = {
                        txt: 'fa fa-file-text-o',
                        log: 'fa fa-file-text-o',
                        jpg: 'fa fa-file-image-o blue',
                        jpeg: 'fa fa-file-image-o blue',
                        png: 'fa fa-file-image-o orange',
                        gif: 'fa fa-file-image-o',
                        pdf: 'fa fa-file-pdf-o',
                        wav: 'fa fa-file-audio-o',
                        mp3: 'fa fa-file-audio-o',
                        wma: 'fa fa-file-audio-o',
                        avi: 'fa fa-file-video-o',
                        mov: 'fa fa-file-video-o',
                        mkv: 'fa fa-file-video-o',
                        flv: 'fa fa-file-video-o',
                        mp4: 'fa fa-file-video-o',
                        mpg: 'fa fa-file-video-o',
                        doc: 'fa fa-file-word-o',
                        dot: 'fa fa-file-word-o',
                        docx: 'fa fa-file-word-o',
                        docm: 'fa fa-file-word-o',
                        dotx: 'fa fa-file-word-o',
                        dotm: 'fa fa-file-word-o',
                        docb: 'fa fa-file-word-o',
                        xls: 'fa fa-file-excel-o',
                        xlt: 'fa fa-file-excel-o',
                        xlm: 'fa fa-file-excel-o',
                        xla: 'fa fa-file-excel-o',
                        xll: 'fa fa-file-excel-o',
                        xlw: 'fa fa-file-excel-o',
                        xlsx: 'fa fa-file-excel-o',
                        xlsm: 'fa fa-file-excel-o',
                        xlsb: 'fa fa-file-excel-o',
                        xltx: 'fa fa-file-excel-o',
                        xltm: 'fa fa-file-excel-o',
                        xlam: 'fa fa-file-excel-o',
                        csv: 'fa fa-file-excel-o',
                        ppt: 'fa fa-file-powerpoint-o',
                        pptx: 'fa fa-file-powerpoint-o',
                        zip: 'fa fa-file-archive-o',
                        tar: 'fa fa-file-archive-o',
                        gz: 'fa fa-file-archive-o',
                        '7zip': 'fa fa-file-archive-o'
                    },
                    defaultIconClass = 'fa fa-file-o';

                    var pattern = /\.(\w+)$/,
                        match = pattern.exec(item.name),
                        ext = match && match[1];

                    return iconClassMap[ext] || defaultIconClass;
                }
            };

        }]);


    /**
     * Controller for the "New Folder" modal
     */
    module.controller('ModalNewFolderCtrl', ['$scope', '$modalInstance', 'parent', 'path',
        function ($scope, $modalInstance, parent, path) {

            $scope.parent = parent;
            $scope.path = path;
            $scope.name = '';

            /**
             * Triggered once someone clicks the save button in the modal
             */
            $scope.save = function () {

                if ($scope.newFolderForm.$invalid) {
                    return;
                }

                $modalInstance.close($scope.name);
            };

            /**
             * Triggered once someone clicks the cancel button in the modal
             */
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }]);


    /**
     * Controller for the "Edit Folder" modal
     */
    module.controller('ModalEditFolderCtrl', ['$scope', '$modalInstance', 'node', 'path',
        function ($scope, $modalInstance, node, path) {

            $scope.node = node;
            $scope.path = path;
            $scope.name = node.name;

            /**
             * Triggered once someone clicks the save button in the modal
             */
            $scope.save = function () {

                if ($scope.editFolderForm.$invalid) {
                    return;
                }

                $modalInstance.close($scope.name);
            };

            /**
             * Triggered once someone clicks the cancel button in the modal
             */
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
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

            for (var i = 0; i < $scope.bp.selected.columns.length; i++) {
                if (data.hasOwnProperty($scope.bp.selected.columns[i].name)) {
                    $scope.bp.selected.columns[i].value = data[$scope.bp.selected.columns[i].name];
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
        }]);


})(angular, uuid);