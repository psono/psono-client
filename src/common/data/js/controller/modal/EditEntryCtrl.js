(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditEntryCtrl
     * @requires $rootScope
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.itemBlueprint
     * @requires psonocli.offlineCache
     *
     * @description
     * Controller for the "Edit Entry" modal
     */
    angular.module('psonocli').controller('ModalEditEntryCtrl', ['$rootScope', '$scope', '$uibModal', '$uibModalInstance', 'itemBlueprint', 'helper', 'offlineCache', 'node', 'path', 'data',
        function ($rootScope, $scope, $uibModal, $uibModalInstance, itemBlueprint, helper, offlineCache, node, path, data) {
            $scope.show_history = show_history;
            $scope.reset = reset;
            $scope.save = save;
            $scope.cancel = cancel;
            $scope.toggle_input_type = toggle_input_type;

            $scope.node = node;
            $scope.path = path;
            $scope.data = data;
            $scope.name = node.name;
            $scope.content = '';
            $scope.isCollapsed = true;
            $scope.errors = [];
            activate();

            function activate(){


                $scope.offline = offlineCache.is_active();
                $rootScope.$on('offline_mode_enabled', function() {
                    $scope.offline = true;
                });

                $rootScope.$on('offline_mode_disabled', function() {
                    $scope.offline = false;
                });
                $scope.bp = {
                    all: itemBlueprint.get_blueprints(),
                    selected: itemBlueprint.get_blueprint($scope.node.type)
                };

                if ($scope.bp.selected.hasOwnProperty('fields')) {
                    for (var i = $scope.bp.selected.fields.length - 1; i >= 0; i--) {
                        if ($scope.data.hasOwnProperty($scope.bp.selected.fields[i].name)) {
                            $scope.bp.selected.fields[i].value = $scope.data[$scope.bp.selected.fields[i].name];
                        }
                    }
                }

                $scope.$watch('bp.selected', function(newValue, oldValue) {
                    if (typeof $scope.bp.selected.onEditModalOpen !== 'undefined') {
                        $scope.bp.selected.onEditModalOpen($scope.bp.selected);
                    }
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryCtrl#show_history
             * @methodOf psonocli.controller:ModalEditEntryCtrl
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

                $scope.errors = [];
                if ($scope.editEntryForm.$invalid) {
                    return;
                }
                for (var i = 0; i < $scope.bp.selected.fields.length; i++) {
                    var field = $scope.bp.selected.fields[i];
                    if (field.hasOwnProperty("required")) {
                        if (field['required'] && field['value'] !== false && !field['value']) {
                            $scope.errors.push(field['title'] + '_IS_REQUIRED');
                            continue;
                        }
                    }
                    if (field.hasOwnProperty("validationType")) {
                        if (field['validationType'].toLowerCase() === 'url' && field['value'] && !helper.is_valid_url(field['value'])) {
                            $scope.errors.push('Invalid URL in ' + field['title']);
                        }
                        if (field['validationType'].toLowerCase() === 'email' && field['value'] && !helper.is_valid_email(field['value'])) {
                            $scope.errors.push('Invalid URL in ' + field['title']);
                        }
                    }

                }

                if ($scope.errors.length > 0) {
                    return;
                }

                $scope.bp.selected['callback_data'] = data;
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

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryCtrl#toggle_input_type
             * @methodOf psonocli.controller:ModalEditEntryCtrl
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