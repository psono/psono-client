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
        'DTOptionsBuilder', 'DTColumnDefBuilder', 'languagePicker',
        function ($scope, $routeParams, managerSecurityReport,
                  DTOptionsBuilder, DTColumnDefBuilder, languagePicker) {

            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withLanguageSource('translations/datatables.' + languagePicker.get_active_language_code() + '.json');

            $scope.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1),
                DTColumnDefBuilder.newColumnDef(2),
                DTColumnDefBuilder.newColumnDef(3),
                DTColumnDefBuilder.newColumnDef(4),
                DTColumnDefBuilder.newColumnDef(5)
            ];

            $scope.name = "SecurityReportCtrl";
            $scope.check_haveibeenpwned = false;
            $scope.send_to_server = false;
            $scope.params = $routeParams;
            $scope.routeParams = $routeParams;
            $scope.state = {
                report_complete: false,
                open_secret_requests: 0,
                closed_secret_request: 0,
                download_ongoing: false,
                download_complete: false,
                open_haveibeenpwned_requests: 0,
                closed_haveibeenpwned_requests: 0,
                haveibeenpwned_ongoing: false,
                haveibeenpwned_complete: false
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

                managerSecurityReport.on('check-haveibeenpwned-started', function(){
                    $scope.state.haveibeenpwned_ongoing = true;
                });

                managerSecurityReport.on('get-haveibeenpwned-started', function(){
                    $scope.state.open_haveibeenpwned_requests = $scope.state.open_haveibeenpwned_requests + 1;
                });

                managerSecurityReport.on('get-haveibeenpwned-complete', function(){
                    $scope.state.closed_haveibeenpwned_requests = $scope.state.closed_haveibeenpwned_requests + 1;
                });

                managerSecurityReport.on('check-haveibeenpwned-complete', function(){
                    $scope.state.open_haveibeenpwned_requests = 0;
                    $scope.state.closed_haveibeenpwned_requests = 0;
                    $scope.state.haveibeenpwned_ongoing = false;
                    $scope.state.haveibeenpwned_complete = true;
                });
            }

            function iniatiate_state() {

                $scope.state = {
                    report_complete: false,
                    open_secret_requests: 0,
                    closed_secret_request: 0,
                    download_ongoing: false,
                    download_complete: false,
                    open_haveibeenpwned_requests: 0,
                    closed_haveibeenpwned_requests: 0,
                    haveibeenpwned_ongoing: false,
                    haveibeenpwned_complete: false
                };
                $scope.msgs = [];
                $scope.errors = [];

            }

            /**
             * Analyze all secrets
             */
            function generate_security_report(password, check_haveibeenpwned, send_to_server) {

                $scope.check_haveibeenpwned = check_haveibeenpwned;

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

                    if (send_to_server) {
                        managerSecurityReport.send_to_server(data.analysis, check_haveibeenpwned, password);
                    }
                };
                var onError = function (data) {
                    $scope.msgs = [];
                    $scope.errors = data.errors;
                };

                iniatiate_state();

                managerSecurityReport.generate_security_report(password, check_haveibeenpwned)
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