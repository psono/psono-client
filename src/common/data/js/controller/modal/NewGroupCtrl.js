(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalNewGroupCtrl
     * @requires $scope
     * @requires $uibModalInstance
     *
     * @description
     * Controller for the "New Group" modal
     */
    angular.module('psonocli').controller('ModalNewGroupCtrl', ['$scope', '$uibModalInstance',
        function ($scope, $uibModalInstance) {

            $scope.save = save;
            $scope.cancel = cancel;
            $scope.name = '';

            /**
             * @ngdoc
             * @name psonocli.controller:ModalNewGroupCtrl#save
             * @methodOf psonocli.controller:ModalNewGroupCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {

                if ($scope.newGroupForm.$invalid) {
                    return;
                }

                $uibModalInstance.close($scope.name);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalNewGroupCtrl#cancel
             * @methodOf psonocli.controller:ModalNewGroupCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));
