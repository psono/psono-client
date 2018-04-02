(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditEntryBigCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires psonocli.itemBlueprint
     *
     * @description
     * Controller for the "Edit Entry" modal
     */
    angular.module('psonocli').controller('ModalEditEntryBigCtrl', ['$scope', '$rootScope', 'itemBlueprint',
        function ($scope, $rootScope, itemBlueprint) {

            $scope.reset = reset;
            $scope.save = save;
            $scope.cancel = cancel;
            $scope.has_advanced = itemBlueprint.has_advanced;

            // $scope.node = node;
            // $scope.path = path;
            // $scope.data = data;
            // $scope.name = node.name;
            $scope.content = '';
            $scope.isCollapsed = true;
            $scope.errors = [];
            activate();

            var onClose = function() {};
            var onSave = function(data) {};

            function activate(){

                $rootScope.$on('show-entry-big-load', function(evt, args) {
                    onClose=args.onClose;
                    onSave=args.onSave;
                    $scope.node=args.node;
                    $scope.path=args.path;
                    $scope.data=args.data;
                    $scope.name = args.node.name;
                    $scope.has_advanced = itemBlueprint.has_advanced
                    $scope.bp = {
                        all: itemBlueprint.get_blueprints(),
                        selected: itemBlueprint.get_blueprint($scope.node.type)
                    };

                    for (var i = $scope.bp.selected.fields.length - 1; i >= 0; i--) {
                        if ($scope.data.hasOwnProperty($scope.bp.selected.fields[i].name)) {
                            $scope.bp.selected.fields[i].value = $scope.data[$scope.bp.selected.fields[i].name];
                        }
                    }

                    $scope.$watch('bp.selected', function(newValue, oldValue) {
                        if (typeof $scope.bp.selected.onEditModalOpen !== 'undefined') {
                            $scope.bp.selected.onEditModalOpen($scope.bp.selected);
                        }
                    });
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryBigCtrl#reset
             * @methodOf psonocli.controller:ModalEditEntryBigCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function reset() {
                $scope.submitted = false;
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryBigCtrl#save
             * @methodOf psonocli.controller:ModalEditEntryBigCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {

                if ($scope.editEntryForm.$invalid) {
                    return;
                }
                onSave($scope.bp.selected);

                $rootScope.$broadcast('close-entry-big', {});
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryBigCtrl#cancel
             * @methodOf psonocli.controller:ModalEditEntryBigCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $rootScope.$broadcast('close-entry-big', {});
                onClose();
            }
        }]);

}(angular));