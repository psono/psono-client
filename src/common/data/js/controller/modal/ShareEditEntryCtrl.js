(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalShareEditEntryCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.shareBlueprint
     *
     * @description
     * Controller for the "Edit Entry" modal
     */
    angular.module('psonocli').controller('ModalShareEditEntryCtrl', ['$scope', '$uibModalInstance', 'shareBlueprint', 'node', 'path', 'data', 'hide_advanced', 'hide_history',
        function ($scope, $uibModalInstance, shareBlueprint, node, path, data, hide_advanced, hide_history) {

            $scope.reset = reset;
            $scope.save = save;
            $scope.cancel = cancel;

            $scope.node = node;
            $scope.path = path;
            $scope.name = node.name;
            $scope.hide_advanced = hide_advanced;
            $scope.hide_history = hide_history;
            $scope.content = '';
            $scope.isCollapsed = true;
            $scope.errors = [];

            activate();
            function activate() {
                $scope.bp = {
                    all: shareBlueprint.get_blueprints(),
                    selected: shareBlueprint.get_blueprint(node.type)
                };

                for (var i = $scope.bp.selected.fields.length - 1; i >= 0; i--) {
                    if (data.hasOwnProperty($scope.bp.selected.fields[i].name)) {
                        $scope.bp.selected.fields[i].value = data[$scope.bp.selected.fields[i].name];
                    }
                }

                if (typeof $scope.bp.selected.onEditModalOpen !== 'undefined') {
                    $scope.bp.selected.onEditModalOpen($scope.bp.selected);
                }
            }

            /**
             * Sets submitted to false
             */
            function reset() {
                $scope.submitted = false;
            }

            /**
             * Triggered once someone clicks the save button in the modal
             */
            function save() {
                if ($scope.editEntryForm.$invalid) {
                    return;
                }
                $uibModalInstance.close($scope.bp.selected);
            }

            /**
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]
    );
}(angular));