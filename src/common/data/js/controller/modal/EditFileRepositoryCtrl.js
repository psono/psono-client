(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditFileRepositoryCtrl
     * @requires $scope
     * @requires $q
     * @requires $uibModal
     * @requires $uibModalInstance
     * @requires psonocli.managerFileRepository
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "Edit File Repository" modal in Other
     */
    angular.module('psonocli').controller('ModalEditFileRepositoryCtrl', ['$scope', '$q', '$uibModal', '$uibModalInstance',
        'managerFileRepository', 'managerDatastorePassword', 'helper', 'DTOptionsBuilder', 'DTColumnDefBuilder',
        'languagePicker', 'file_repository',
        function ($scope, $q, $uibModal, $uibModalInstance,
                  managerFileRepository, managerDatastorePassword, helper, DTOptionsBuilder, DTColumnDefBuilder,
                  languagePicker, file_repository) {

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

            $scope.errors = [];
            $scope.file_repository = file_repository;
            $scope.title = '';
            $scope.types = managerFileRepository.get_possible_types();
            $scope.storage_config = {

            };

            $scope.cancel = cancel;
            $scope.save = save;
            $scope.toggle_input_type = toggle_input_type;

            activate();

            function activate() {
                console.log(file_repository);
                $scope.title = file_repository.title;
                $scope.selected_type = file_repository.type;
                $scope.active = file_repository.active;
                $scope.read = file_repository.read;
                $scope.write = file_repository.write;
                $scope.grant = file_repository.grant;
                if (file_repository.type === 'gcp_cloud_storage') {
                    $scope.storage_config['gcp_cloud_storage_bucket'] = file_repository.gcp_cloud_storage_bucket;
                    $scope.storage_config['gcp_cloud_storage_json_key'] = file_repository.gcp_cloud_storage_json_key
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditFileRepositoryCtrl#save
             * @methodOf psonocli.controller:ModalEditFileRepositoryCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {

                $scope.errors = [];

                if (!$scope.title) {
                    $scope.errors.push('TITLE_IS_REQUIRED');
                    return;
                }

                if (!$scope.selected_type) {
                    $scope.errors.push('TYPE_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'gcp_cloud_storage' && !$scope.storage_config['gcp_cloud_storage_bucket']) {
                    $scope.errors.push('BUCKET_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'gcp_cloud_storage' && !$scope.storage_config['gcp_cloud_storage_json_key']) {
                    $scope.errors.push('JSON_KEY_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'gcp_cloud_storage' && !helper.is_valid_json($scope.storage_config['gcp_cloud_storage_json_key'])) {
                    $scope.errors.push('JSON_KEY_IS_INVALID');
                    return;
                }

                if ($scope.modalEditFileRepositoryForm.$invalid) {
                    return;
                }
                var onError = function(result) {
                    // pass
                    console.log(result);
                };

                var onSuccess = function(result) {
                    $uibModalInstance.close();
                };

                return managerFileRepository.update_file_repository(file_repository.id, $scope.title, $scope.selected_type,
                    $scope.storage_config['gcp_cloud_storage_bucket'], $scope.storage_config['gcp_cloud_storage_json_key'], $scope.active)
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditFileRepositoryCtrl#toggle_input_type
             * @methodOf psonocli.controller:ModalEditFileRepositoryCtrl
             *
             * @description
             * Triggered once someone clicks Toggle button on an input field
             */
            function toggle_input_type(id) {

                if (document.getElementById(id).type === 'text') {
                    document.getElementById(id).type = 'password';
                } else {
                    document.getElementById(id).type = 'text';
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditFileRepositoryCtrl#close
             * @methodOf psonocli.controller:ModalEditFileRepositoryCtrl
             *
             * @description
             * Triggered once someone clicks the close button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('close');
            }

        }]
    );
}(angular));
