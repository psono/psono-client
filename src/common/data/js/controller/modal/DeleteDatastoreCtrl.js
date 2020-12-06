(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalDeleteDatastoreCtrl
     * @requires $scope
     * @requires $q
     * @requires $uibModalInstance
     * @requires psonocli.managerDatastore
     * @requires psonocli.managerDatastoreUser
     *
     * @description
     * Controller for the "Edit Datastore" modal in Other
     */
    angular.module('psonocli').controller('ModalDeleteDatastoreCtrl', ['$scope', '$q', '$uibModalInstance',
        'managerDatastore', 'managerDatastoreUser',
        'data_store',
        function ($scope, $q, $uibModalInstance,
                  managerDatastore, managerDatastoreUser,
                  data_store) {

            $scope.user_authentication = managerDatastoreUser.get_authentication();

            $scope.data_store = data_store;
            $scope.data = {
                'password': ''
            };

            $scope.cancel = cancel;
            $scope.save = save;

            activate();

            function activate() {
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDeleteDatastoreCtrl#save
             * @methodOf psonocli.controller:ModalDeleteDatastoreCtrl
             *
             * @description
             * Triggered once someone clicks the delete button in the modal
             */
            function save() {
                if ($scope.modalDeleteDatastoreForm.$invalid) {
                    return;
                }

                var onError = function(data) {
                    console.log(data);

                    if (data.hasOwnProperty('message')) {
                        $scope.errors = [data.message];
                    } else {
                        alert("Error, should not happen.");
                    }
                };

                var onSuccess = function() {
                    $uibModalInstance.close();
                };
                managerDatastore.delete_datastore($scope.data_store.id, $scope.data['password'])
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDeleteDatastoreCtrl#close
             * @methodOf psonocli.controller:ModalDeleteDatastoreCtrl
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
