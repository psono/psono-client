(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalDeleteAccountCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.managerDatastoreUser
     *
     * @description
     * Controller for the "Delete Account" modal
     */
    angular.module('psonocli').controller('ModalDeleteAccountCtrl', ['$scope', '$uibModalInstance', 'managerDatastoreUser',
        function ($scope, $uibModalInstance, managerDatastoreUser) {

            $scope.errors = [];
            $scope.form = {
                password: ''
            };

            $scope.close = close;
            $scope.delete_account = delete_account;

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDeleteAccountCtrl#delete_account
             * @methodOf psonocli.controller:ModalDeleteAccountCtrl
             *
             * @description
             * Triggered once someone clicks the delete button in the modal
             */
            function delete_account() {

                $scope.errors = [];

                if ($scope.form.password === null || $scope.form.password.length === 0) {
                    $scope.errors = ['Old password empty'];
                    return;
                }

                var onError = function(data) {
                    if (data.hasOwnProperty('non_field_errors')) {
                        $scope.errors = data.non_field_errors;
                    } else {
                        console.log(data);
                        alert("Error, should not happen.");
                    }
                };

                var onSuccess = function(e) {
                    $uibModalInstance.dismiss('close');
                };

                managerDatastoreUser.delete_account($scope.form.password).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDeleteAccountCtrl#close
             * @methodOf psonocli.controller:ModalDeleteAccountCtrl
             *
             * @description
             * Triggered once someone clicks the close button in the modal
             */
            function close() {
                $uibModalInstance.dismiss('close');
            }
        }]
    );
}(angular));
