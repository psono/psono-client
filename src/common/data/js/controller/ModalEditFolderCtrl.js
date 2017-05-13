(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditFolderCtrl
     * @requires $scope
     * @requires $uibModalInstance
     *
     * @description
     * Controller for the "Edit Folder" modal
     */
    angular.module('psonocli').controller('ModalEditFolderCtrl', ['$scope', '$uibModalInstance', 'node', 'path',
        function ($scope, $uibModalInstance, node, path) {

            $scope.save = save;
            $scope.cancel = cancel;

            $scope.node = node;
            $scope.path = path;
            $scope.name = node.name;

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditFolderCtrl#save
             * @methodOf psonocli.controller:ModalEditFolderCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {

                if ($scope.editFolderForm.$invalid) {
                    return;
                }

                $uibModalInstance.close($scope.name);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditFolderCtrl#cancel
             * @methodOf psonocli.controller:ModalEditFolderCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular, qrcode));
