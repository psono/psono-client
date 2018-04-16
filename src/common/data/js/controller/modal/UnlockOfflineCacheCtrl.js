(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalUnlockOfflineCacheCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.offlineCache
     *
     * @description
     * Controller for the "delete verification" modal
     */
    angular.module('psonocli').controller('ModalUnlockOfflineCacheCtrl', ['$scope', '$uibModalInstance', 'offlineCache',
        function ($scope, $uibModalInstance, offlineCache) {

            $scope.save = save;
            $scope.cancel = cancel;

            $scope.password = '';
            $scope.errors = [];

            /**
             * @ngdoc
             * @name psonocli.controller:ModalUnlockOfflineCacheCtrl#save
             * @methodOf psonocli.controller:ModalUnlockOfflineCacheCtrl
             *
             * @description
             * Triggered once someone clicks the confirm button in the modal
             */
            function save() {
                if (offlineCache.unlock($scope.password)) {
                    $uibModalInstance.close();
                } else {
                    $scope.errors = ['Incorrect passphrase'];
                }


            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalUnlockOfflineCacheCtrl#cancel
             * @methodOf psonocli.controller:ModalUnlockOfflineCacheCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));
