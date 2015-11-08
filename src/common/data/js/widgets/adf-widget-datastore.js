(function(angular, uuid) {
    'use strict';

    /**
     * Module for the datastore widget
     */
    var module = angular.module('adf.widget.datastore', ['adf.provider']);

    /**
     * Config for the datastore widget
     */
    module.config(function(dashboardProvider){
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
    });

    /**
     * Main Controller for the datastore widget
     */
    module.controller('datastoreController', ["$scope", "$interval", "config", "manager", "$modal",
    function($scope, $interval, config, manager, $modal){

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

                manager.save_password_datastore($scope.structure.data);

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

                manager.save_password_datastore($scope.structure.data);

            }, function () {
                // cancel triggered
            });
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
                controller: 'ModalNewEntryCtrl',
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

            modalInstance.result.then(function (name, content) {
                // $scope.name = name;
                // $scope.content = content;
                alert("Sexy" + name);
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
                controller: 'ModalEditEntryCtrl',
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

            modalInstance.result.then(function (name, content) {
                // $scope.name = name;
                // $scope.content = content;
                alert("Sexy" + name);
            }, function () {
                // cancel triggered
            });
        };

        // Datastore Structure Management

        $scope.structure = { data: {}} ;

        manager.get_password_datastore('password', 'default')
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
            onNodeSelect: function (node, breadcrums) {
                $scope.breadcrums = breadcrums;
                $scope.node = node;
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
                manager.save_password_datastore($scope.structure.data);
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

                manager.save_password_datastore($scope.structure.data);
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
            $scope.$broadcast('show-errors-check-validity');

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
            $scope.$broadcast('show-errors-check-validity');

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
    module.controller('ModalNewEntryCtrl', ['$scope', '$modalInstance', 'parent', 'path',
    function ($scope, $modalInstance, parent, path) {

        $scope.parent = parent;
        $scope.path = path;
        $scope.name = '';
        $scope.content = '';

        /**
         * Triggered once someone clicks the save button in the modal
         */
        $scope.save = function () {
            $scope.$broadcast('show-errors-check-validity');

            if ($scope.newEntryForm.$invalid) {
                return;
            }

            $modalInstance.close($scope.name, $scope.content);
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
    module.controller('ModalEditEntryCtrl', ['$scope', '$modalInstance', 'node', 'path',
    function ($scope, $modalInstance, node, path) {

        $scope.node = node;
        $scope.path = path;
        $scope.name = node.name;
        $scope.content = '';

        /**
         * Triggered once someone clicks the save button in the modal
         */
        $scope.save = function () {
            $scope.$broadcast('show-errors-check-validity');

            if ($scope.editEntryForm.$invalid) {
                return;
            }

            $modalInstance.close($scope.name, $scope.content);
        };

        /**
         * Triggered once someone clicks the cancel button in the modal
         */
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);


})(angular, uuid);