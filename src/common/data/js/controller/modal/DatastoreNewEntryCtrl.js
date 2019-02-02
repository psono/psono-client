(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalDatastoreNewEntryCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.itemBlueprint
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "New Entry" modal
     */
    angular.module('psonocli').controller('ModalDatastoreNewEntryCtrl', ['$scope', '$uibModalInstance', 'itemBlueprint', 'cryptoLibrary', 'helper', 'parent', 'path',
        function ($scope, $uibModalInstance, itemBlueprint, cryptoLibrary, helper, parent, path) {

            $scope.reset = reset;
            $scope.save = save;
            $scope.cancel = cancel;
            $scope.toggle_input_type = toggle_input_type;

            $scope.parent = parent;
            $scope.path = path;
            $scope.state = {
                open_requests: 0,
                closed_request: 0,
                percentage_complete: 0,
                next_step: '',
                processing: false
            };
            $scope.name = '';
            $scope.content = '';
            $scope.data = {
                'callback_url': '',
                'callback_user': '',
                'callback_pass': ''
            };
            $scope.isCollapsed = true;
            $scope.errors = [];

            $scope.bp = {
                all: itemBlueprint.get_blueprints(),
                selected: itemBlueprint.get_default_blueprint()
            };

            activate();

            function activate(){

                $scope.$watch('bp.selected', function(newValue, oldValue) {
                    if (typeof $scope.bp.selected.onNewModalOpen !== 'undefined') {
                        $scope.bp.selected.onNewModalOpen($scope.bp.selected);
                    }
                });

                itemBlueprint.register('upload_started', function(max){
                    $scope.state.processing = true;
                    $scope.state.open_requests = max;
                });

                itemBlueprint.register('upload_step_complete', function(next_step){
                    $scope.state.closed_request = $scope.state.closed_request + 1;
                    $scope.state.percentage_complete = Math.round($scope.state.closed_request / $scope.state.open_requests * 1000) / 10;
                    $scope.state.next_step = next_step;
                });

                itemBlueprint.register('upload_complete', reset);
            }

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
                $scope.state.open_requests = 0;
                $scope.state.closed_request = 0;
                $scope.state.percentage_complete = 0;
                $scope.state.next_step ='';
                $scope.state.processing = false;
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
                $scope.errors = [];
                $scope.credit_buy_address = itemBlueprint.server_credit_buy_address();

                for (var i = 0; i < $scope.bp.selected.fields.length; i++) {
                    var field = $scope.bp.selected.fields[i];
                    if (field.hasOwnProperty("required")) {
                        if (field['required'] && field['value'] !== false && !field['value']) {
                            $scope.errors.push(field['title'] + ' is required');
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

                $scope.bp.selected['link_id'] = cryptoLibrary.generate_uuid();

                if ($scope.bp.selected.hasOwnProperty('preSave')) {
                    var onSuccess = function(){
                        reset();
                        $uibModalInstance.close($scope.bp.selected);
                    };

                    var onError = function(errors) {

                        for (var i = 0; i < errors.length; i++) {
                            $scope.errors.push(errors[i]);
                            reset();
                        }
                    };
                    $scope.bp.selected.preSave($scope.bp.selected, parent, path)
                        .then(onSuccess, onError);
                } else {
                    $scope.bp.selected['callback_data'] = $scope.data;
                    $uibModalInstance.close($scope.bp.selected);
                }
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

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDatastoreNewEntryCtrl#toggle_input_type
             * @methodOf psonocli.controller:ModalDatastoreNewEntryCtrl
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