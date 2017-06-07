(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditEntryCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires itemBlueprint
     *
     * @description
     * Controller for the "Edit Entry" modal
     */
    angular.module('psonocli').controller('ModalEditEntryCtrl', ['$scope', '$uibModalInstance', 'itemBlueprint', 'node', 'path', 'data',
        function ($scope, $uibModalInstance, itemBlueprint, node, path, data) {

            $scope.reset = reset;
            $scope.save = save;
            $scope.cancel = cancel;
            $scope.has_advanced = itemBlueprint.has_advanced;

            $scope.node = node;
            $scope.path = path;
            $scope.name = node.name;
            $scope.content = '';
            $scope.isCollapsed = true;
            $scope.errors = [];

            activate();

            function activate(){
                $scope.bp = {
                    all: itemBlueprint.get_blueprints(),
                    selected: itemBlueprint.get_blueprint(node.type)
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
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryCtrl#reset
             * @methodOf psonocli.controller:ModalEditEntryCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function reset() {
                $scope.submitted = false;
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryCtrl#save
             * @methodOf psonocli.controller:ModalEditEntryCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {

                if ($scope.editEntryForm.$invalid) {
                    return;
                }

                $uibModalInstance.close($scope.bp.selected);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryCtrl#cancel
             * @methodOf psonocli.controller:ModalEditEntryCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular, qrcode));