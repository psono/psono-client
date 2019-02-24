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
                DTColumnDefBuilder.newColumnDef(4)
            ];

            $scope.create_new_file_repository = create_new_file_repository;
            $scope.edit_file_repository = edit_file_repository;
            $scope.delete_file_repository = delete_file_repository;

            $scope.file_repositorys_disabled = managerFileRepository.file_repositorys_disabled();

            $scope.file_repositorys=[];

            activate();
            function activate() {
                read_file_repositorys();
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherFileRepositoryCtrl#read_file_repositorys
             * @methodOf psonocli.controller:OtherFileRepositoryCtrl
             *
             * @description
             * Reads all api keys from the backend
             */
            function read_file_repositorys() {
                managerFileRepository.read_file_repositorys().then(function (file_repositorys) {
                    $scope.file_repositorys=file_repositorys;
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

                    read_file_repositorys();

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
             * edits an file_repositorys
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

                        for (var i = $scope.file_repositorys.length - 1; i >= 0; i--) {
                            if ($scope.file_repositorys[i].id !== file_repository.id) {
                                continue;
                            }
                            $scope.file_repositorys.splice(i, 1);
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
        }]
    );
}(angular));