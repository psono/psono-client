(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalDeleteOtherSessionsCtrl
     * @requires $scope
     * @requires $q
     * @requires $uibModalInstance
     * @requires psonocli.managerDatastoreUser
     *
     * @description
     * Controller for the "Edit Datastore" modal in Other
     */
    angular.module('psonocli').controller('ModalDeleteOtherSessionsCtrl', ['$scope', '$q', '$uibModalInstance', 'managerDatastoreUser',
        function ($scope, $q, $uibModalInstance, managerDatastoreUser) {
            $scope.cancel = cancel;
            $scope.save = save;

            activate();

            function activate() {
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDeleteOtherSessionsCtrl#save
             * @methodOf psonocli.controller:ModalDeleteOtherSessionsCtrl
             *
             * @description
             * Triggered once someone clicks the delete button in the modal
             */
            function save() {

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

                managerDatastoreUser.delete_other_sessions()
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDeleteOtherSessionsCtrl#close
             * @methodOf psonocli.controller:ModalDeleteOtherSessionsCtrl
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
