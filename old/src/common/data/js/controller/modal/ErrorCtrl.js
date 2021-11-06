(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalErrorCtrl
     * @requires $scope
     * @requires $uibModalInstance
     *
     * @description
     * Controller for the "error" modal
     */
    angular.module('psonocli').controller('ModalErrorCtrl', ['$scope', '$uibModalInstance', 'title', 'description',
        function ($scope, $uibModalInstance, title, description) {

            $scope.cancel = cancel;

            $scope.title = title;
            $scope.description = description;

            /**
             * @ngdoc
             * @name psonocli.controller:ModalErrorCtrl#cancel
             * @methodOf psonocli.controller:ModalErrorCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));
