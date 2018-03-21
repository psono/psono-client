(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalPickUserCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "Pick User" modal
     */
    angular.module('psonocli').controller('ModalPickUserCtrl', ['$scope', '$uibModalInstance', 'helper','data',
        function ($scope, $uibModalInstance, helper, data) {

            $scope.errors = [];
            $scope.save = save;
            $scope.cancel = cancel;
            $scope.data = data;

            /**
             * @ngdoc
             * @name psonocli.controller:ModalPickUserCtrl#save
             * @methodOf psonocli.controller:ModalPickUserCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save(user) {

                $uibModalInstance.close(user);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalPickUserCtrl#cancel
             * @methodOf psonocli.controller:ModalPickUserCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));
