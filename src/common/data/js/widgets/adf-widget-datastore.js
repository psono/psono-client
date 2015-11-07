'use strict';

angular.module('adf.widget.datastore', ['adf.provider'])
    .config(function(dashboardProvider){
        dashboardProvider
            .widget('datastore', {
                title: 'Datastore',
                description: 'provides the datastore',
                templateUrl: 'datastore.view.html',
                controller: 'datastoreController',
                controllerAs: 'datastore',
                edit: {
                    templateUrl: 'datastore.edit.html'
                }
            });
    })
    .controller('datastoreController', ["$scope", "$interval", "config", "manager", "$modal",
    function($scope, $interval, config, manager, $modal){

        // Modals

        var openNewFolder = function (node, path, size) {

            var modalInstance = $modal.open({
                templateUrl: 'view/modal-new-folder.html',
                controller: 'ModalNewFolderCtrl',
                size: size,
                resolve: {
                    node: function () {
                        return node;
                    },
                    path: function () {
                        return path;
                    }
                },
                node: node,
                path: path
            });

            modalInstance.result.then(function (name) {
                alert("Sexy" + name);
            }, function () {
                // cancel triggered
            });
        };

        var openNewEntry = function (node, path, size) {

            var modalInstance = $modal.open({
                templateUrl: 'view/modal-new-entry.html',
                controller: 'ModalNewEntryCtrl',
                size: size,
                resolve: {
                    node: function () {
                        return node;
                    },
                    path: function () {
                        return path;
                    }
                },
                node: node,
                path: path
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

        $scope.structure = [];

        manager.get_password_datastore()
            .then(function (data) {$scope.structure = data;});

        var findInStructure = function (path, structure) {
            var to_search = path.shift();
            var n = undefined;

            if (path.length == 0) {
                // found the object
                // check if its a folder, if yes return the folder list and the index
                for (n = 0; n < structure.folders.length; n++) {
                    if (structure.folders[n].id == to_search) {
                        return [structure.folders, n];
                        // structure.folders.splice(n, 1);
                        // return true;
                    }
                }
                // check if its a file, if yes return the file list and the index
                for (n = 0; n < structure.items.length; n++) {
                    if (structure.items[n].id == to_search) {
                        return [structure.items, n];
                        // structure.items.splice(n, 1);
                        // return true;
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

            onDeleteNode: function (node, path) {
                var val = findInStructure(path, $scope.structure);
                if (val)
                    val[0].splice(val[1], 1);
            },
            onEditNode: function (node, path) {
                //console.log(node);
            },

            onDeleteItem: function (item, path) {
                var val = findInStructure(path, $scope.structure);
                if (val)
                    val[0].splice(val[1], 1);
            },
            onEditItem: function (item, path) {
                //console.log(item);
            },

            onNewFolder: function (node, path) {
                console.log(node);
                console.log(path);
                openNewFolder(node, path)
            },
            onNewEntry: function (node, path) {
                console.log(node);
                console.log(path);
                openNewEntry(node, path)
            },

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

angular.module('adf.widget.datastore').controller('ModalNewFolderCtrl', function ($scope, $modalInstance, node, path) {

    $scope.node = node;
    $scope.path = path;
    $scope.name = '';

    $scope.ok = function () {
        $scope.$broadcast('show-errors-check-validity');

        if ($scope.newFolderForm.$invalid) {
            return;
        }

        // TODO add the new folder

        $modalInstance.close($scope.name);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('adf.widget.datastore').controller('ModalNewEntryCtrl', function ($scope, $modalInstance, node, path) {

    $scope.node = node;
    $scope.path = path;
    $scope.name = '';
    $scope.content = '';

    $scope.ok = function () {
        $scope.$broadcast('show-errors-check-validity');

        if ($scope.newEntryForm.$invalid) {
            return;
        }

        // TODO add the new folder

        $modalInstance.close($scope.name, $scope.content);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

