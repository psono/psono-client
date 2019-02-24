(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditFileExchangeCtrl
     * @requires $scope
     * @requires $q
     * @requires $uibModal
     * @requires $uibModalInstance
     * @requires psonocli.managerFileExchange
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "Edit File Exchange" modal in Other
     */
    angular.module('psonocli').controller('ModalEditFileExchangeCtrl', ['$scope', '$q', '$uibModal', '$uibModalInstance',
        'managerFileExchange', 'managerDatastorePassword', 'helper', 'file_exchange',
        function ($scope, $q, $uibModal, $uibModalInstance,
                  managerFileExchange, managerDatastorePassword, helper, file_exchange) {

            $scope.errors = [];
            $scope.file_exchange = file_exchange;
            $scope.title = '';
            $scope.types = managerFileExchange.get_possible_types();
            $scope.storage_config = {

            };

            $scope.cancel = cancel;
            $scope.save = save;
            $scope.toggle_input_type = toggle_input_type;

            activate();

            function activate() {
                $scope.title = file_exchange.title;
                $scope.selected_type = file_exchange.type;
                $scope.active = file_exchange.active;
                if (file_exchange.type === 'gcp_cloud_storage') {
                    $scope.storage_config['gcp_cloud_storage_bucket'] = file_exchange.gcp_cloud_storage_bucket;
                    $scope.storage_config['gcp_cloud_storage_json_key'] = file_exchange.gcp_cloud_storage_json_key
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditFileExchangeCtrl#save
             * @methodOf psonocli.controller:ModalEditFileExchangeCtrl
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

                if ($scope.modalEditFileExchangeForm.$invalid) {
                    return;
                }
                var onError = function(result) {
                    // pass
                    console.log(result);
                };

                var onSuccess = function(result) {
                    $uibModalInstance.close();
                };

                return managerFileExchange.update_file_exchange(file_exchange.id, $scope.title, $scope.selected_type,
                    $scope.storage_config['gcp_cloud_storage_bucket'], $scope.storage_config['gcp_cloud_storage_json_key'], $scope.active)
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditFileExchangeCtrl#toggle_input_type
             * @methodOf psonocli.controller:ModalEditFileExchangeCtrl
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
             * @name psonocli.controller:ModalEditFileExchangeCtrl#close
             * @methodOf psonocli.controller:ModalEditFileExchangeCtrl
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
