(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalVerifyCtrl
     * @requires $scope
     * @requires $uibModalInstance
     *
     * @description
     * Controller for the "delete verification" modal
     */
    angular.module('psonocli').controller('ModalVerifyCtrl', ['$scope', '$uibModalInstance', 'title', 'description',
        function ($scope, $uibModalInstance, title, description) {

            $scope.confirm = confirm;
            $scope.cancel = cancel;

            $scope.title = title;
            $scope.description = description;

            /**
             * @ngdoc
             * @name psonocli.controller:ModalVerifyCtrl#save
             * @methodOf psonocli.controller:ModalVerifyCtrl
             *
             * @description
             * Triggered once someone clicks the confirm button in the modal
             */
            function confirm() {
                $uibModalInstance.close($scope.name);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalVerifyCtrl#cancel
             * @methodOf psonocli.controller:ModalVerifyCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));
