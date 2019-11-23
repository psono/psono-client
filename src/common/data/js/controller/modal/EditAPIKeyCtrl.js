(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditAPIKeyCtrl
     * @requires $scope
     * @requires $q
     * @requires $uibModal
     * @requires $uibModalInstance
     * @requires psonocli.managerAPIKeys
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "Edit API Key" modal in Other
     */
    angular.module('psonocli').controller('ModalEditAPIKeyCtrl', ['$scope', '$q', '$uibModal', '$uibModalInstance',
        'managerAPIKeys', 'managerDatastorePassword', 'helper', 'api_key',
        function ($scope, $q, $uibModal, $uibModalInstance,
                  managerAPIKeys, managerDatastorePassword, helper, api_key) {

            $scope.server = managerAPIKeys.get_server_parameter();
            $scope.api_key = api_key;
            $scope.title = '';
            $scope.restrict_to_secrets = true;
            $scope.allow_insecure_access = false;
            $scope.allow_insecure_access = true;
            $scope.secrets = {
                'data': []
            };

            $scope.cancel = cancel;
            $scope.save = save;
            $scope.add_new_secret = add_new_secret;
            $scope.remove_secret = remove_secret;
            $scope.toggle_input_type = toggle_input_type;

            activate();

            function activate() {

                $scope.title = api_key.title;
                $scope.restrict_to_secrets = api_key.restrict_to_secrets;
                $scope.allow_insecure_access = api_key.allow_insecure_access;
                $scope.active = api_key.active;

                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(secrets) {
                    $scope.secrets['data'] = secrets;
                    for(var i = 0; i < secrets.length; i++) {

                    }
                };
                managerAPIKeys.read_api_key_secrets(api_key.id)
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditAPIKeyCtrl#save
             * @methodOf psonocli.controller:ModalEditAPIKeyCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {

                if ($scope.modalEditAPIKeyForm.$invalid) {
                    return;
                }
                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(result) {
                    api_key.title = $scope.title;
                    api_key.restrict_to_secrets = $scope.restrict_to_secrets;
                    api_key.allow_insecure_access = $scope.allow_insecure_access;
                    $uibModalInstance.close(api_key);
                };

                return managerAPIKeys.update_api_key(api_key.id, $scope.title, $scope.restrict_to_secrets, $scope.allow_insecure_access)
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditAPIKeyCtrl#add_new_secret
             * @methodOf psonocli.controller:ModalEditAPIKeyCtrl
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
                        managerAPIKeys.add_secret_to_api_key(api_key.id, api_key.secret_key, secrets[i].item)
                    }
                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditAPIKeyCtrl#remove_secret
             * @methodOf psonocli.controller:ModalEditAPIKeyCtrl
             *
             * @description
             * Triggered once someone clicks Trash button on a secret
             */
            function remove_secret(secret) {
                var onError = function(result) {
                    // pass
                };

                var onSuccess = function() {
                    helper.remove_from_array($scope.secrets['data'], secret, function(a, b) {
                        return a.id === b.id;
                    });
                };

                managerAPIKeys.delete_api_key_secret(secret.id)
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditAPIKeyCtrl#toggle_input_type
             * @methodOf psonocli.controller:ModalEditAPIKeyCtrl
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
             * @name psonocli.controller:ModalEditAPIKeyCtrl#close
             * @methodOf psonocli.controller:ModalEditAPIKeyCtrl
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
