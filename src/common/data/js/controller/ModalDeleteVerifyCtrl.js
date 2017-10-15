(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalDeleteVerifyCtrl
     * @requires $scope
     * @requires $uibModalInstance
     *
     * @description
     * Controller for the "delete verification" modal
     */
    angular.module('psonocli').controller('ModalDeleteVerifyCtrl', ['$scope', '$uibModalInstance', 'title', 'description',
        function ($scope, $uibModalInstance, title, description) {

            $scope.confirm = confirm;
            $scope.cancel = cancel;

            $scope.title = title;
            $scope.description = description;

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDeleteVerifyCtrl#save
             * @methodOf psonocli.controller:ModalDeleteVerifyCtrl
             *
             * @description
             * Triggered once someone clicks the confirm button in the modal
             */
            function confirm() {
                $uibModalInstance.close($scope.name);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDeleteVerifyCtrl#cancel
             * @methodOf psonocli.controller:ModalDeleteVerifyCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));
