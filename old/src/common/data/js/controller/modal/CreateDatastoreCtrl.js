(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalCreateDatastoreCtrl
     * @requires $scope
     * @requires $q
     * @requires $uibModalInstance
     *
     * @description
     * Controller for the "Create Datastore" modal in Other
     */
    angular.module('psonocli').controller('ModalCreateDatastoreCtrl', ['$scope', '$q', '$uibModalInstance',
        function ($scope, $q, $uibModalInstance) {

            $scope.cancel = cancel;
            $scope.save = save;

            activate();

            function activate() {
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalCreateDatastoreCtrl#save
             * @methodOf psonocli.controller:ModalCreateDatastoreCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {

                if ($scope.modalCreateDatastoreForm.$invalid) {
                    return;
                }

                $uibModalInstance.close({
                    'description': $scope.description,
                    'is_default': !!$scope.is_default
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalCreateDatastoreCtrl#close
             * @methodOf psonocli.controller:ModalCreateDatastoreCtrl
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
