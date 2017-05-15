(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalShareNewEntryCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.shareBlueprint
     * @requires psonocli.browserClient
     *
     * @description
     * Controller for the "New Entry" modal
     */
    angular.module('psonocli').controller('ModalShareNewEntryCtrl', ['$scope', '$uibModalInstance', 'shareBlueprint', 'browserClient', 'helper', 'parent', 'path',
        function ($scope, $uibModalInstance, shareBlueprint, browserClient, helper, parent, path) {

            $scope.reset = reset;
            $scope.save = save;
            $scope.cancel = cancel;
            $scope.has_advanced = shareBlueprint.has_advanced;

            $scope.parent = parent;
            $scope.path = path;
            $scope.name = '';
            $scope.content = '';
            $scope.isCollapsed = true;
            $scope.errors = [];
            $scope.bp = {
                all: shareBlueprint.get_blueprints(),
                selected: shareBlueprint.get_default_blueprint()
            };
            $scope.form_control = {'block_submit': true};

            activate();

            function activate() {
                var onSuccess = function(config) {

                    /* Server selection with preselection */
                    $scope.servers = config['backend_servers'];
                    $scope.filtered_servers = $scope.servers;
                    $scope.selected_server = $scope.servers[0];
                    $scope.selected_server_title = $scope.selected_server.title;
                    $scope.selected_server_url = $scope.selected_server.url;
                    $scope.selected_server_domain = helper.get_domain($scope.selected_server.url);
                };

                var onError = function() {

                };

                browserClient.get_config().then(onSuccess, onError);
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

                if ($scope.newEntryForm.$invalid) {
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