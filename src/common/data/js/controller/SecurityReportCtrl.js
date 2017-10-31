(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:SecurityReportCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires psonocli.managerSecurityReport
     *
     * @description
     * Controller for the Generate Security Report view
     */
    angular.module('psonocli').controller('SecurityReportCtrl', ['$scope', '$routeParams', 'managerSecurityReport',
        function ($scope, $routeParams, managerSecurityReport) {

            $scope.name = "SecurityReportCtrl";
            $scope.params = $routeParams;
            $scope.routeParams = $routeParams;
            $scope.state = {
                report_complete: false,
                open_secret_requests: 0,
                closed_secret_request: 0,
                download_ongoing: false,
                download_complete: false
            };
            $scope.generate_security_report = generate_security_report;
            $scope.toggle_input_type = toggle_input_type;

            activate();

            function activate() {

                iniatiate_state();

                managerSecurityReport.on('generation-started', function(){
                    $scope.state.download_ongoing = true;
                });

                managerSecurityReport.on('get-secret-started', function(){
                    $scope.state.open_secret_requests = $scope.state.open_secret_requests + 1;
                });

                managerSecurityReport.on('get-secret-complete', function(){
                    $scope.state.closed_secret_request = $scope.state.closed_secret_request + 1;
                });

                managerSecurityReport.on('generation-complete', function(){
                    $scope.state.open_secret_requests = 0;
                    $scope.state.closed_secret_request = 0;
                    $scope.state.download_ongoing = false;
                    $scope.state.download_complete = true;
                });
            }

            function iniatiate_state() {

                $scope.state = {
                    report_complete: false,
                    open_secret_requests: 0,
                    closed_secret_request: 0,
                    download_ongoing: false,
                    download_complete: false
                };
                $scope.msgs = [];
                $scope.errors = [];

            }

            /**
             * Analyze all secrets
             */
            function generate_security_report() {

                var onSuccess = function (data) {
                    $scope.msgs = data.msgs;
                    $scope.errors = [];
                    $scope.state.report_complete = true;
                    $scope.analysis = data.analysis;
                    $scope.password_strength_colors = ["#ff7a55", "#ffb855", "#00aaaa"];
                    $scope.password_strength_labels = ["weak", "good", "strong"];
                    $scope.password_strength_data = [
                        data.analysis['password_summary']['weak'],
                        data.analysis['password_summary']['good'],
                        data.analysis['password_summary']['strong']
                    ];

                    $scope.duplicate_colors = ["#ff7a55", "#00aaaa"];
                    $scope.duplicate_labels = ["Duplicate", "Unique"];
                    $scope.duplicate_data = [
                        data.analysis['password_summary']['duplicate'],
                        data.analysis['password_summary']['no_duplicate']
                    ];

                    $scope.average_score_colors = ["#00aaaa", "#FFFFFF"];
                    $scope.average_score_labels = ["Score", ""];
                    $scope.average_score_data = [
                        data.analysis['password_summary']['average_rating'],
                        100-data.analysis['password_summary']['average_rating']
                    ];

                    $scope.password_update_age_colors = ["#ff7a55", "#ffb855", "#00aaaa"];
                    $scope.password_update_age_labels = ["Older than 180 days", "Older than 90 days", "Newer than 90 days"];
                    $scope.password_update_age_data = [
                        data.analysis['password_summary']['update_older_than_180_days'],
                        data.analysis['password_summary']['update_older_than_90_days'],
                        data.analysis['password_summary']['update_newer_than_90_days']
                    ];
                };
                var onError = function (data) {
                    $scope.msgs = [];
                    $scope.errors = data.errors;
                };

                iniatiate_state();

                managerSecurityReport.generate_security_report()
                    .then(onSuccess, onError);
            }

            function toggle_input_type(element) {
                if (element.input_type !== 'password') {
                    element.input_type = 'password';
                } else {
                    element.input_type = 'text';
                }
            }

        }]
    );

}(angular));