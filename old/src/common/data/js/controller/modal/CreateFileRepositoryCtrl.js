(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalCreateFileRepositoryCtrl
     * @requires $scope
     * @requires $q
     * @requires $uibModal
     * @requires $uibModalInstance
     * @requires psonocli.managerFileRepository
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "Create File Repository" modal in Other
     */
    angular.module('psonocli').controller('ModalCreateFileRepositoryCtrl', ['$scope', '$q', '$uibModal', '$uibModalInstance',
        'managerFileRepository', 'helper',
        function ($scope, $q, $uibModal, $uibModalInstance,
                  managerFileRepository, helper) {

            $scope.errors = [];
            $scope.title = '';
            $scope.types = managerFileRepository.get_possible_types();
            $scope.selected_type = '';
            $scope.storage_config = {

            };

            $scope.cancel = cancel;
            $scope.save = save;

            activate();

            function activate() {

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalCreateFileRepositoryCtrl#save
             * @methodOf psonocli.controller:ModalCreateFileRepositoryCtrl
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

                var aws_regions = [
                    'us-east-1', // USA Ost (Nord-Virginia)
                    'us-east-2', // USA Ost (Ohio)
                    'us-west-1', // USA West (Nordkalifornien)
                    'us-west-2', // USA West (Oregon)
                    'ap-south-1', // Asien-Pazifik (Mumbai)
                    'ap-northeast-1', // Asien-Pazifik (Tokio)
                    'ap-northeast-2', // Asien-Pazifik (Seoul
                    'ap-northeast-3', // Asien-Pazifik (Osaka-Lokal)
                    'ap-southeast-1', // Asien-Pazifik (Singapur)
                    'ap-southeast-2', // Asien-Pazifik (Sydney)
                    'ca-central-1', // Kanada (Zentral)
                    'cn-north-1', // China (Peking)
                    'cn-northwest-1', // China (Ningxia)
                    'eu-central-1', // EU (Frankfurt)
                    'eu-west-1', // EU (Irland)
                    'eu-west-2', // EU (London)
                    'eu-west-3', // EU (Paris)
                    'eu-north-1', // EU (Stockholm)
                    'sa-east-1', // Südamerika (Sao Paulo)
                    'us-gov-east-1', // AWS GovCloud (USA Ost)
                    'us-gov-west-1' // AWS GovCloud (USA)
                ];

                if ($scope.selected_type === 'aws_s3' && aws_regions.indexOf($scope.storage_config['aws_s3_region']) === -1) {
                    $scope.errors.push('REGION_IS_INVALID');
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

                if ($scope.selected_type === 'azure_blob' && !$scope.storage_config['azure_blob_storage_account_name']) {
                    $scope.errors.push('ACCOUNT_NAME_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'azure_blob' && !$scope.storage_config['azure_blob_storage_account_primary_key']) {
                    $scope.errors.push('PRIMARY_KEY_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'azure_blob' && !$scope.storage_config['azure_blob_storage_account_container_name']) {
                    $scope.errors.push('CONTAINER_NAME_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'backblaze' && !$scope.storage_config['backblaze_bucket']) {
                    $scope.errors.push('BUCKET_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'backblaze' && !$scope.storage_config['backblaze_region']) {
                    $scope.errors.push('REGION_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'backblaze' && !$scope.storage_config['backblaze_access_key_id']) {
                    $scope.errors.push('ACCESS_KEY_ID_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'backblaze' && !$scope.storage_config['backblaze_secret_access_key']) {
                    $scope.errors.push('SECRET_ACCESS_KEY_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'other_s3' && !$scope.storage_config['other_s3_bucket']) {
                    $scope.errors.push('BUCKET_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'other_s3' && !$scope.storage_config['other_s3_region']) {
                    $scope.errors.push('REGION_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'other_s3' && !$scope.storage_config['other_s3_endpoint_url']) {
                    $scope.errors.push('URL_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'other_s3' && !$scope.storage_config['other_s3_access_key_id']) {
                    $scope.errors.push('ACCESS_KEY_ID_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'other_s3' && !$scope.storage_config['other_s3_secret_access_key']) {
                    $scope.errors.push('SECRET_ACCESS_KEY_IS_REQUIRED');
                    return;
                }



                if ($scope.selected_type === 'do_spaces' && !$scope.storage_config['do_space']) {
                    $scope.errors.push('SPACE_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'do_spaces' && !$scope.storage_config['do_region']) {
                    $scope.errors.push('REGION_IS_REQUIRED');
                    return;
                }

                var do_spaces_regions = [
                    'ams3',
                    'fra1',
                    'nyc3',
                    'sfo2',
                    'sgp1'
                ];

                if ($scope.selected_type === 'do_spaces' && do_spaces_regions.indexOf($scope.storage_config['do_region']) === -1) {
                    $scope.errors.push('REGION_IS_INVALID');
                    return;
                }

                if ($scope.selected_type === 'do_spaces' && !$scope.storage_config['do_key']) {
                    $scope.errors.push('KEY_IS_REQUIRED');
                    return;
                }

                if ($scope.selected_type === 'do_spaces' && !$scope.storage_config['do_secret']) {
                    $scope.errors.push('SECRET_IS_REQUIRED');
                    return;
                }


                if ($scope.modalCreateFileRepositoryForm.$invalid) {
                    return;
                }
                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(result) {
                    $uibModalInstance.close();
                };

                return managerFileRepository.create_file_repository(
                    $scope.title,
                    $scope.selected_type,
                    $scope.storage_config['gcp_cloud_storage_bucket'],
                    $scope.storage_config['gcp_cloud_storage_json_key'],
                    $scope.storage_config['aws_s3_bucket'],
                    $scope.storage_config['aws_s3_region'],
                    $scope.storage_config['aws_s3_access_key_id'],
                    $scope.storage_config['aws_s3_secret_access_key'],
                    $scope.storage_config['azure_blob_storage_account_name'],
                    $scope.storage_config['azure_blob_storage_account_primary_key'],
                    $scope.storage_config['azure_blob_storage_account_container_name'],
                    $scope.storage_config['backblaze_bucket'],
                    $scope.storage_config['backblaze_region'],
                    $scope.storage_config['backblaze_access_key_id'],
                    $scope.storage_config['backblaze_secret_access_key'],
                    $scope.storage_config['other_s3_bucket'],
                    $scope.storage_config['other_s3_region'],
                    $scope.storage_config['other_s3_endpoint_url'],
                    $scope.storage_config['other_s3_access_key_id'],
                    $scope.storage_config['other_s3_secret_access_key'],
                    $scope.storage_config['do_space'],
                    $scope.storage_config['do_region'],
                    $scope.storage_config['do_key'],
                    $scope.storage_config['do_secret']
                )
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalCreateFileRepositoryCtrl#close
             * @methodOf psonocli.controller:ModalCreateFileRepositoryCtrl
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
