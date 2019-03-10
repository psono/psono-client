(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:OtherFileRepositoryCtrl
     * @requires $scope
     * @requires $uibModal
     * @requires psonocli.managerFileRepository
     *
     * @description
     * Controller for the Datastore tab in the "Others" menu
     */
    angular.module('psonocli').controller('OtherFileRepositoryCtrl', ['$scope', '$uibModal', 'managerFileRepository', 'languagePicker', 'DTOptionsBuilder', 'DTColumnDefBuilder',
        function ($scope, $uibModal, managerFileRepository, languagePicker, DTOptionsBuilder, DTColumnDefBuilder) {

            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withLanguageSource('translations/datatables.' + languagePicker.get_active_language_code() + '.json');

            $scope.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1),
                DTColumnDefBuilder.newColumnDef(2),
                DTColumnDefBuilder.newColumnDef(3),
                DTColumnDefBuilder.newColumnDef(4),
                DTColumnDefBuilder.newColumnDef(5)
            ];

            $scope.create_new_file_repository = create_new_file_repository;
            $scope.edit_file_repository = edit_file_repository;
            $scope.delete_file_repository = delete_file_repository;
            $scope.accept = accept;
            $scope.decline = decline;

            $scope.file_repositories_disabled = managerFileRepository.file_repositories_disabled();

            $scope.file_repositories=[];

            activate();
            function activate() {
                read_file_repositories();
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherFileRepositoryCtrl#read_file_repositories
             * @methodOf psonocli.controller:OtherFileRepositoryCtrl
             *
             * @description
             * Reads all api keys from the backend
             */
            function read_file_repositories() {
                managerFileRepository.read_file_repositories().then(function (file_repositories) {
                    $scope.file_repositories=file_repositories;
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherFileRepositoryCtrl#create_new_file_repository
             * @methodOf psonocli.controller:OtherFileRepositoryCtrl
             *
             * @description
             * Creates a new datastore
             */
            function create_new_file_repository() {


                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/create-file-repository.html',
                    controller: 'ModalCreateFileRepositoryCtrl',
                    resolve: {}
                });

                modalInstance.result.then(function () {

                    read_file_repositories();

                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherFileRepositoryCtrl#edit_file_repository
             * @methodOf psonocli.controller:OtherFileRepositoryCtrl
             *
             * @description
             * edits an file_repositories
             *
             * @param {TreeObject} file_repository The file_repository to edit
             */
            function edit_file_repository(file_repository) {

                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(file_repository) {

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/edit-file-repository.html',
                        controller: 'ModalEditFileRepositoryCtrl',
                        size: 'lg',
                        resolve: {
                            file_repository: function () {
                                return file_repository;
                            }
                        }
                    });

                    modalInstance.result.then(function (form) {
                        // save triggered
                    }, function () {
                        // cancel triggered
                    });
                };
                return managerFileRepository.read_file_repository(file_repository['id'])
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherFileRepositoryCtrl#delete_file_repository
             * @methodOf psonocli.controller:OtherFileRepositoryCtrl
             *
             * @description
             * deletes an file_repository
             *
             * @param {TreeObject} file_repository The file_repository to delete
             */
            function delete_file_repository(file_repository) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/verify.html',
                    controller: 'ModalVerifyCtrl',
                    resolve: {
                        title: function () {
                            return 'DELETE_FILE_REPOSITORY';
                        },
                        description: function () {
                            return 'DELETE_FILE_REPOSITORY_WARNING';
                        }
                    }
                });

                modalInstance.result.then(function () {
                    // User clicked the yes button

                    var onSuccess = function(){

                        for (var i = $scope.file_repositories.length - 1; i >= 0; i--) {
                            if ($scope.file_repositories[i].id !== file_repository.id) {
                                continue;
                            }
                            $scope.file_repositories.splice(i, 1);
                        }

                    };

                    var onError = function() {
                        //pass
                    };

                    managerFileRepository.delete_file_repository(file_repository.id)
                        .then(onSuccess, onError);


                }, function () {
                    // cancel triggered
                });

            }


            /**
             * @ngdoc
             * @name psonocli.controller:OtherFileRepositoryCtrl#accept
             * @methodOf psonocli.controller:OtherFileRepositoryCtrl
             *
             * @description
             * accepts an file_repository
             *
             * @param {TreeObject} file_repository The file_repository to accept
             */
            function accept(file_repository) {

                var onSuccess = function(){

                    for (var i = $scope.file_repositories.length - 1; i >= 0; i--) {
                        if ($scope.file_repositories[i].id !== file_repository.id) {
                            continue;
                        }
                        $scope.file_repositories[i].accepted = true;
                        break;
                    }

                };

                var onError = function() {
                    //pass
                };

                managerFileRepository.accept(file_repository.file_repository_right_id)
                    .then(onSuccess, onError);
            }


            /**
             * @ngdoc
             * @name psonocli.controller:OtherFileRepositoryCtrl#decline
             * @methodOf psonocli.controller:OtherFileRepositoryCtrl
             *
             * @description
             * declines an file_repository
             *
             * @param {TreeObject} file_repository The file_repository to decline
             */
            function decline(file_repository) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/verify.html',
                    controller: 'ModalVerifyCtrl',
                    resolve: {
                        title: function () {
                            return 'DELETE_FILE_REPOSITORY_RIGHT';
                        },
                        description: function () {
                            return 'DELETE_FILE_REPOSITORY_RIGHT_WARNING';
                        }
                    }
                });

                modalInstance.result.then(function () {
                    // User clicked the yes button

                    var onSuccess = function(){

                        for (var i = $scope.file_repositories.length - 1; i >= 0; i--) {
                            if ($scope.file_repositories[i].id !== file_repository.id) {
                                continue;
                            }
                            $scope.file_repositories.splice(i, 1);
                            break;
                        }

                    };

                    var onError = function() {
                        //pass
                    };

                    managerFileRepository.decline(file_repository.file_repository_right_id)
                        .then(onSuccess, onError);


                }, function () {
                    // cancel triggered
                });
            }

        }]
    );
}(angular));