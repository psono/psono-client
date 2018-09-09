(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalGoOfflineCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires $uibModalInstance
     * @requires $uibModal
     * @requires psonocli.offlineCache
     *
     * @description
     * Controller for the "Go Offline" modal
     */
    angular.module('psonocli').controller('ModalGoOfflineCtrl', ['$scope', '$rootScope', '$uibModalInstance', '$uibModal',
        'offlineCache', 'managerDatastore', 'managerDatastorePassword', 'managerExport', 'helper',
        function ($scope, $rootScope, $uibModalInstance, $uibModal,
                  offlineCache, managerDatastore, managerDatastorePassword, managerExport, helper) {

            $scope.cancel = cancel;
            $scope.approve = approve;

            $scope.state = {
                started_load_all_datastores: false,
                open_requests: 0,
                closed_requests: 0,
                finished_load_all_datastores: false,
                password: '',
                password_repeat: ''
            };

            activate();

            function activate() {
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalGoOfflineCtrl#approve
             * @methodOf psonocli.controller:ModalGoOfflineCtrl
             *
             * @description
             * Triggered once someone clicks the approve button
             *
             */
            function approve() {
                var test_result = helper.is_valid_password($scope.state.password, $scope.state.password_repeat);
                if (test_result !== true) {
                    $scope.state.errors = [
                        test_result
                    ];
                    return;
                }

                $scope.state.started_load_all_datastores = true;

                offlineCache.set_encryption_password($scope.state.password);
                offlineCache.enable();

                managerExport.on('get-secret-started', function(){
                    $scope.state.open_requests = $scope.state.open_requests + 1;
                });

                managerExport.on('get-secret-complete', function(){
                    $scope.state.closed_requests = $scope.state.closed_requests + 1;
                });


                managerDatastore.get_datastore_overview(true)
                    .then(load_all_datastores)
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalGoOfflineCtrl#potentially_close_modal
             * @methodOf psonocli.controller:ModalGoOfflineCtrl
             *
             * @description
             * Checks whether the caching of the datastore is completed or not and closes the modal once done.
             */
            function potentially_close_modal() {
                if ($scope.state.closed_requests === $scope.state.open_requests) {
                    offlineCache.save();
                    $uibModalInstance.close();
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalGoOfflineCtrl#approve
             * @methodOf psonocli.controller:ModalGoOfflineCtrl
             *
             * @description
             * Main function to load the datastore including all shares and secrets
             *
             * @param datastore_overview
             */
            function load_all_datastores(datastore_overview) {

                for (var i = 0; i < datastore_overview.data.datastores.length; i++) {
                    $scope.state.open_requests = $scope.state.open_requests + 1;
                    if (datastore_overview.data.datastores[i]['type'] === 'password') {
                        managerDatastorePassword.get_password_datastore(datastore_overview.data.datastores[i]['id'])
                            .then(function(datastore) {
                                $scope.state.closed_requests = $scope.state.closed_requests + 1;
                                $scope.state.open_requests = $scope.state.open_requests + 1;
                                managerExport.get_all_secrets(datastore).then(function() {
                                    $scope.state.closed_requests = $scope.state.closed_requests + 1;
                                    potentially_close_modal();
                                });
                            });
                    } else {
                        managerDatastore.get_datastore_with_id(datastore_overview.data.datastores[i]['id']).then(function(datastore) {
                            $scope.state.closed_requests = $scope.state.closed_requests + 1;
                            potentially_close_modal();
                        })
                    }
                }
                $scope.state.finished_load_all_datastores = true;
                potentially_close_modal();
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalGoOfflineCtrl#cancel
             * @methodOf psonocli.controller:ModalGoOfflineCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                offlineCache.disable();
                offlineCache.clear();

                $uibModalInstance.dismiss('cancel');
            }

        }]
    );
}(angular));