(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditEntryBigCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires $uibModal
     * @requires psonocli.itemBlueprint
     *
     * @description
     * Controller for the "Edit Entry" modal
     */
    angular.module('psonocli').controller('ModalEditEntryBigCtrl', ['$scope', '$rootScope', '$uibModal', 'itemBlueprint',
        function ($scope, $rootScope, $uibModal, itemBlueprint) {
            $scope.show_history = show_history;
            $scope.reset = reset;
            $scope.save = save;
            $scope.cancel = cancel;
            $scope.toggle_input_type = toggle_input_type;

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
             * @name psonocli.controller:ModalEditEntryBigCtrl#show_history
             * @methodOf psonocli.controller:ModalEditEntryBigCtrl
             *
             * @description
             * Triggered once someone clicks show history button
             */
            function show_history(node) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/history.html',
                    controller: 'ModalHistoryCtrl',
                    resolve: {
                        node: function () {
                            return node;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    // User clicked the yes button
                }, function () {
                    // cancel triggered
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
                $scope.bp.selected['callback_data'] = $scope.data;
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

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryBigCtrl#toggle_input_type
             * @methodOf psonocli.controller:ModalEditEntryBigCtrl
             *
             * @description
             * toggles the type of an input
             *
             * @param id
             */
            function toggle_input_type(id) {
                if (document.getElementById(id).type === 'text') {
                    document.getElementById(id).type = 'password';
                } else {
                    document.getElementById(id).type = 'text';
                }
            }
        }]);

}(angular));