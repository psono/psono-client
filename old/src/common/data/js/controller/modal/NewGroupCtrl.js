(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalNewGroupCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "New Group" modal
     */
    angular.module('psonocli').controller('ModalNewGroupCtrl', ['$scope', '$uibModalInstance', 'helper',
        function ($scope, $uibModalInstance, helper) {

            $scope.errors = [];
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

                $scope.errors = [];
                var test_result;

                test_result = helper.is_valid_group_name($scope.name);

                if (test_result !== true) {
                    $scope.errors.push(test_result);
                    return;
                }

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
