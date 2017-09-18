(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalShowRecoverycodeCtrl
     * @requires $scope
     * @requires $uibModalInstance
     *
     * @description
     * Controller for the "Show Recoverycode" modal
     */
    angular.module('psonocli').controller('ModalShowRecoverycodeCtrl', ['$scope', '$uibModalInstance', 'recovery_information',
        function ($scope, $uibModalInstance, recovery_information) {

            $scope.close = close;
            $scope.recovery_information = recovery_information;

            /**
             * @ngdoc
             * @name psonocli.controller:ModalShowRecoverycodeCtrl#close
             * @methodOf psonocli.controller:ModalShowRecoverycodeCtrl
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
