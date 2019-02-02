(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:DownloadFileCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires psonocli.itemBlueprint
     *
     * @description
     * Controller for download-file.html
     */
    angular.module('psonocli').controller('DownloadFileCtrl', ['$scope', '$routeParams', 'managerFileTransfer', 'itemBlueprint',
        function ($scope, $routeParams, managerFileTransfer, itemBlueprint) {

            $scope.state = {
                open_requests: 0,
                closed_request: 0,
                percentage_complete: 0,
                next_step: '',
                processing: false
            };
            $scope.errors = [];

            activate();

            function activate(){

                $scope.credit_buy_address = itemBlueprint.server_credit_buy_address();

                managerFileTransfer.register('download_started', function(max){
                    $scope.state.processing = true;
                    $scope.state.open_requests = max;
                });

                managerFileTransfer.register('download_step_complete', function(next_step){
                    $scope.state.closed_request = $scope.state.closed_request + 1;
                    $scope.state.percentage_complete = Math.round($scope.state.closed_request / $scope.state.open_requests * 1000) / 10;
                    $scope.state.next_step = next_step;
                });

                managerFileTransfer.register('download_complete', reset);


                $scope.$on('$routeChangeSuccess', function () {


                    var onSuccess = function(data) {
                        console.log(data);
                    };

                    var onError = function(data) {
                        if (data.hasOwnProperty('non_field_errors')) {
                            $scope.errors = data.non_field_errors;
                        } else {
                            console.log(data);
                            alert("Error, should not happen.");
                        }
                    };
                    managerFileTransfer.download_file($routeParams.id).then(onSuccess, onError);
                });
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
                $scope.state.open_requests = 0;
                $scope.state.closed_request = 0;
                $scope.state.percentage_complete = 0;
                $scope.state.next_step ='';
                $scope.state.processing = false;
            }
        }]);

}(angular));