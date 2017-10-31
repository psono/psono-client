(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalNewFolderCtrl
     * @requires $scope
     * @requires $uibModalInstance
     *
     * @description
     * Controller for the "New Folder" modal
     */
    angular.module('psonocli').controller('ModalNewFolderCtrl', ['$scope', '$uibModalInstance', 'parent', 'path',
        function ($scope, $uibModalInstance, parent, path) {

            $scope.save = save;
            $scope.cancel = cancel;

            $scope.parent = parent;
            $scope.path = path;
            $scope.name = '';

            /**
             * @ngdoc
             * @name psonocli.controller:ModalNewFolderCtrl#save
             * @methodOf psonocli.controller:ModalNewFolderCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {

                if ($scope.newFolderForm.$invalid) {
                    return;
                }

                $uibModalInstance.close($scope.name);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalNewFolderCtrl#cancel
             * @methodOf psonocli.controller:ModalNewFolderCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));
