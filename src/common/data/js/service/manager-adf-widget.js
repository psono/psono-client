(function (angular) {
    'use strict';

    /**
     * managerAdfWidget is a base class for adf widgets
     *
     */

    var managerAdfWidget = function ($modal) {


        /**
         * Opens the modal to create a new folder
         *
         * @param parent The parent of the new folder
         * @param path The path to the parent of the new folder
         * @param data_structure the data structure
         * @param manager manager responsible for
         */
        var openNewFolder = function (parent, path, data_structure, manager) {

            var modalInstance = $modal.open({
                templateUrl: 'view/modal-new-folder.html',
                controller: 'ModalNewFolderCtrl',
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
                    parent = data_structure;
                }

                if (typeof parent.folders === 'undefined') {
                    parent.folders = [];
                }
                parent.folders.push({
                    id: uuid.v4(),
                    name: name
                });

                manager.save_datastore(data_structure, [path]);

            }, function () {
                // cancel triggered
            });
        };

        /**
         * Opens the modal to edit a folder
         *
         * @param node The node you want to edit
         * @param path The path to the node
         * @param data_structure the data structure
         * @param manager manager responsible for
         * @param size The size of the modal
         */
        var openEditFolder = function (node, path, data_structure, manager, size) {

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

                manager.save_datastore(data_structure, [path]);

            }, function () {
                // cancel triggered
            });
        };
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

        /**
         * Returns the class of the icon used to display a specific item
         *
         * @param item
         * @returns {*|string}
         */
        var itemIcon = function (item) {
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
        };

        return {
            openNewFolder: openNewFolder,
            openEditFolder: openEditFolder,
            findInStructure: findInStructure,
            itemIcon: itemIcon
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("managerAdfWidget", ['$modal', managerAdfWidget]);


    /**
     * Controller for the "New Folder" modal
     */
    app.controller('ModalNewFolderCtrl', ['$scope', '$modalInstance', 'parent', 'path',
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
    app.controller('ModalEditFolderCtrl', ['$scope', '$modalInstance', 'node', 'path',
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

}(angular));