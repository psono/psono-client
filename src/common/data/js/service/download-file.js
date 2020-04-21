(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:DownloadFileCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.itemBlueprint
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.helper
     *
     * @description
     * Controller for download-file.html
     */
    angular.module('psonocli').controller('DownloadFileCtrl', ['$scope', '$uibModalInstance', 'itemBlueprint', 'cryptoLibrary', 'helper', 'parent', 'path',
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
             * @name psonocli.controller:DownloadFileCtrl#reset
             * @methodOf psonocli.controller:DownloadFileCtrl
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
        }]);

}(angular));