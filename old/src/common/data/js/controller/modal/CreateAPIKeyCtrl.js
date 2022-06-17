(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalCreateAPIKeyCtrl
     * @requires $scope
     * @requires $q
     * @requires $uibModal
     * @requires $uibModalInstance
     * @requires psonocli.managerAPIKeys
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "Create Datastore" modal in Other
     */
    angular.module('psonocli').controller('ModalCreateAPIKeyCtrl', ['$scope', '$q', '$uibModal', '$uibModalInstance',
        'managerAPIKeys', 'helper',
        function ($scope, $q, $uibModal, $uibModalInstance,
                  managerAPIKeys, helper) {

            $scope.title = '';
            $scope.restrict_to_secrets = true;
            $scope.allow_insecure_access = false;
            $scope.allow_read_access = true;
            $scope.allow_write_access = false;
            $scope.secrets = {
                'data': []
            };

            $scope.cancel = cancel;
            $scope.save = save;
            $scope.add_new_secret = add_new_secret;
            $scope.remove_secret = remove_secret;

            activate();

            function activate() {
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalCreateAPIKeyCtrl#save
             * @methodOf psonocli.controller:ModalCreateAPIKeyCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {

                if ($scope.modalCreateAPIKeyForm.$invalid) {
                    return;
                }
                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(result) {
                    $uibModalInstance.close();
                };

                return managerAPIKeys.create_api_key($scope.title, $scope.restrict_to_secrets, $scope.allow_insecure_access, $scope.allow_read_access, $scope.allow_write_access, $scope.secrets['data'])
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalCreateAPIKeyCtrl#add_new_secret
             * @methodOf psonocli.controller:ModalCreateAPIKeyCtrl
             *
             * @description
             * Triggered once someone clicks Add Secret button
             */
            function add_new_secret() {



                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/choose-secrets.html',
                    controller: 'ModalChooseSecretsCtrl',
                    resolve: {
                        title: function () {
                            return 'ADD_SECRET_TO_API_KEY';
                        },
                        exclude_secrets: function () {
                            return $scope.secrets['data'];
                        }
                    }
                });

                modalInstance.result.then(function (secrets) {
                    for (var i = 0; i < secrets.length; i++) {
                        $scope.secrets['data'].push(secrets[i].item);
                    }
                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalCreateAPIKeyCtrl#remove_secret
             * @methodOf psonocli.controller:ModalCreateAPIKeyCtrl
             *
             * @description
             * Triggered once someone clicks Trash button on a secret
             */
            function remove_secret(secret) {
                helper.remove_from_array($scope.secrets['data'], secret, function(a, b) {
                    return a.id === b.id;
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalCreateAPIKeyCtrl#close
             * @methodOf psonocli.controller:ModalCreateAPIKeyCtrl
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
