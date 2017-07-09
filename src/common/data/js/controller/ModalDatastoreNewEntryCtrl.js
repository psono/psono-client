(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalDatastoreNewEntryCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.itemBlueprint
     *
     * @description
     * Controller for the "New Entry" modal
     */
    angular.module('psonocli').controller('ModalDatastoreNewEntryCtrl', ['$scope', '$uibModalInstance', 'itemBlueprint', 'parent', 'path',
        function ($scope, $uibModalInstance, itemBlueprint, parent, path) {

            $scope.reset = reset;
            $scope.has_advanced = itemBlueprint.has_advanced;
            $scope.save = save;
            $scope.cancel = cancel;

            $scope.parent = parent;
            $scope.path = path;
            $scope.name = '';
            $scope.content = '';
            $scope.isCollapsed = true;
            $scope.errors = [];

            $scope.bp = {
                all: itemBlueprint.get_blueprints(),
                selected: itemBlueprint.get_default_blueprint()
            };

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDatastoreNewEntryCtrl#reset
             * @methodOf psonocli.controller:ModalDatastoreNewEntryCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function reset() {
                $scope.submitted = false;
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalDatastoreNewEntryCtrl#save
             * @methodOf psonocli.controller:ModalDatastoreNewEntryCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {
                if ($scope.newEntryForm.$invalid) {
                    return;
                }

                $uibModalInstance.close($scope.bp.selected);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDatastoreNewEntryCtrl#cancel
             * @methodOf psonocli.controller:ModalDatastoreNewEntryCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));