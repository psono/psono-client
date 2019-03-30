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
        'managerFileRepository', 'managerDatastorePassword', 'managerDatastoreUser', 'helper',
        'DTOptionsBuilder', 'DTColumnDefBuilder',  'languagePicker', 'file_repository',
        function ($scope, $q, $uibModal, $uibModalInstance,
                  managerFileRepository, managerDatastorePassword, managerDatastoreUser, helper,
                  DTOptionsBuilder, DTColumnDefBuilder, languagePicker, file_repository) {

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
            $scope.toggle_read = toggle_read;
            $scope.toggle_write = toggle_write;
            $scope.toggle_grant = toggle_grant;
            $scope.delete_file_repository_right = delete_file_repository_right;
            $scope.create_file_repository_right = create_file_repository_right;

            activate();

            function activate() {
                $scope.title = file_repository.title;
                $scope.selected_type = file_repository.type;
                $scope.active = file_repository.active;
                $scope.read = file_repository.read;
                $scope.write = file_repository.write;
                $scope.grant = file_repository.grant;
                if (file_repository.type === 'gcp_cloud_storage') {
                    $scope.storage_config['gcp_cloud_storage_bucket'] = file_repository.gcp_cloud_storage_bucket;
                    $scope.storage_config['gcp_cloud_storage_json_key'] = file_repository.gcp_cloud_storage_json_key;
                }
                if (file_repository.type === 'aws_s3') {
                    $scope.storage_config['aws_s3_bucket'] = file_repository.aws_s3_bucket;
                    $scope.storage_config['aws_s3_region'] = file_repository.aws_s3_region;
                    $scope.storage_config['aws_s3_access_key_id'] = file_repository.aws_s3_access_key_id;
                    $scope.storage_config['aws_s3_secret_access_key'] = file_repository.aws_s3_secret_access_key;
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

                if ($scope.selected_type === 'aws_s3' && !$scope.storage_config['aws_s3_bucket']) {
                    $scope.errors.push('BUCKET_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'aws_s3' && !$scope.storage_config['aws_s3_region']) {
                    $scope.errors.push('REGION_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'aws_s3' && !$scope.storage_config['aws_s3_access_key_id']) {
                    $scope.errors.push('ACCESS_KEY_ID_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'aws_s3' && !$scope.storage_config['aws_s3_secret_access_key']) {
                    $scope.errors.push('SECRET_ACCESS_KEY_IS_REQUIRED');
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

                return managerFileRepository.update_file_repository(
                    file_repository.id,
                    $scope.title,
                    $scope.selected_type,
                    $scope.storage_config['gcp_cloud_storage_bucket'],
                    $scope.storage_config['gcp_cloud_storage_json_key'],
                    $scope.active,
                    $scope.storage_config['aws_s3_bucket'],
                    $scope.storage_config['aws_s3_region'],
                    $scope.storage_config['aws_s3_access_key_id'],
                    $scope.storage_config['aws_s3_secret_access_key']
                )
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
             * @name psonocli.controller:ModalEditFileRepositoryCtrl#toggle_read
             * @methodOf psonocli.controller:ModalEditFileRepositoryCtrl
             *
             * @description
             * Triggered once someone clicks read Toggle button on a right for a user
             *
             * @param file_repository_right
             */
            function toggle_read(file_repository_right) {
                var onError = function(result) {
                    // pass
                    console.log(result);
                };

                var onSuccess = function(result) {
                    file_repository_right.read = !file_repository_right.read;
                };

                managerFileRepository.update_file_repository_right(file_repository_right.id, !file_repository_right.read, file_repository_right.write, file_repository_right.grant)
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditFileRepositoryCtrl#toggle_write
             * @methodOf psonocli.controller:ModalEditFileRepositoryCtrl
             *
             * @description
             * Triggered once someone clicks read Toggle button on a right for a user
             *
             * @param file_repository_right
             */
            function toggle_write(file_repository_right) {
                var onError = function(result) {
                    // pass
                    console.log(result);
                };

                var onSuccess = function(result) {
                    file_repository_right.write = !file_repository_right.write;
                };

                managerFileRepository.update_file_repository_right(file_repository_right.id, file_repository_right.read, !file_repository_right.write, file_repository_right.grant)
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditFileRepositoryCtrl#toggle_grant
             * @methodOf psonocli.controller:ModalEditFileRepositoryCtrl
             *
             * @description
             * Triggered once someone clicks read Toggle button on a right for a user
             *
             * @param file_repository_right
             */
            function toggle_grant(file_repository_right) {
                var onError = function(result) {
                    // pass
                    console.log(result);
                };

                var onSuccess = function(result) {
                    file_repository_right.grant = !file_repository_right.grant;
                };

                managerFileRepository.update_file_repository_right(file_repository_right.id, file_repository_right.read, file_repository_right.write, !file_repository_right.grant)
                    .then(onSuccess, onError);

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditFileRepositoryCtrl#delete_file_repository_right
             * @methodOf psonocli.controller:ModalEditFileRepositoryCtrl
             *
             * @description
             * Triggered once someone clicks on the delete button for a right
             *
             * @param file_repository_right
             */
            function delete_file_repository_right(file_repository_right) {
                var onError = function(result) {
                    // pass
                    console.log(result);
                };

                var onSuccess = function(result) {

                    helper.remove_from_array($scope.file_repository.file_repository_rights, file_repository_right, function (a, b) {
                        return a.id === b.id;
                    });
                };

                managerFileRepository.delete_file_repository_right(file_repository_right.id)
                    .then(onSuccess, onError);

            }



            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditFileRepositoryCtrl#create_file_repository_right
             * @methodOf psonocli.controller:ModalEditFileRepositoryCtrl
             *
             * @description
             * Create and add the created file repository right to the file_repository_rights array
             */
            function create_and_add_file_repository_right(user) {

                var onError = function(result) {
                    // pass
                    console.log(result);
                };

                var onSuccess = function(result) {
                    $scope.file_repository.file_repository_rights.push({
                        id: result.file_repository_right_id,
                        user_username: user['data']['user_username'],
                        read: false,
                        write: false,
                        grant: false,
                        accepted: false
                    });
                };

                return managerFileRepository.create_file_repository_right($scope.file_repository.id, user['data']['user_id'], false, false, false)
                    .then(onSuccess, onError);

            }



            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditFileRepositoryCtrl#create_file_repository_right
             * @methodOf psonocli.controller:ModalEditFileRepositoryCtrl
             *
             * @description
             * Triggered once someone clicks on the Create Right button for a right to create a file repository right
             */
            function create_file_repository_right() {

                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(result) {
                    if (typeof(result) === "undefined") {
                        // abort button was clicked
                        return;
                    }
                    for (var i = 0; i < result['users'].length; i++) {
                        create_and_add_file_repository_right(result['users'][i]);
                    }
                };

                return managerDatastoreUser.select_users()
                    .then(onSuccess, onError);

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
