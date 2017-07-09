(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditDatastoreCtrl
     * @requires $scope
     * @requires $q
     * @requires $uibModalInstance
     *
     * @description
     * Controller for the "Edit Datastore" modal in Other
     */
    angular.module('psonocli').controller('ModalEditDatastoreCtrl', ['$scope', '$q', '$uibModalInstance',
        'data_store',
        function ($scope, $q, $uibModalInstance,
                  data_store) {

            $scope.data_store = data_store;

            $scope.cancel = cancel;
            $scope.save = save;

            activate();

            function activate() {
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditDatastoreCtrl#save
             * @methodOf psonocli.controller:ModalEditDatastoreCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {

                if ($scope.modalEditDatastoreForm.$invalid) {
                    return;
                }

                $uibModalInstance.close($scope.data_store);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditDatastoreCtrl#close
             * @methodOf psonocli.controller:ModalEditDatastoreCtrl
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
