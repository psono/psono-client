(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:SecurityReportCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires psonocli.storage
     * @requires psonocli.managerSecurityReport
     * @requires psonocli.managerDatastoreUser
     *
     * @description
     * Controller for the Generate Security Report view
     */
    angular.module('psonocli').controller('SecurityReportCtrl', ['$scope', '$routeParams', 'storage', 'managerSecurityReport',
        'managerDatastoreUser', 'DTOptionsBuilder', 'DTColumnDefBuilder', 'languagePicker',
        function ($scope, $routeParams, storage, managerSecurityReport, managerDatastoreUser,
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
            $scope.disable_send_to_sever_choice = managerSecurityReport.central_security_reports_disable();
            $scope.hide_send_to_server = managerSecurityReport.central_security_reports_disable();
            $scope.params = $routeParams;
            $scope.routeParams = $routeParams;
            $scope.state = {
                password: '',
                password_repeat: '',
                send_to_server: managerSecurityReport.central_security_reports_enforced() && !managerSecurityReport.central_security_reports_disable(),
                open_secret_requests: 0,
                closed_secret_request: 0,
                download_ongoing: false,
                download_complete: false,
                open_haveibeenpwned_requests: 0,
                closed_haveibeenpwned_requests: 0,
                haveibeenpwned_ongoing: false,
                haveibeenpwned_complete: false,
                require_master_password: ['LDAP', 'AUTHKEY'].indexOf(managerDatastoreUser.get_authentication()) !== -1
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
                    haveibeenpwned_complete: false,
                    require_master_password: ['LDAP', 'AUTHKEY'].indexOf(managerDatastoreUser.get_authentication()) !== -1
                };
                $scope.msgs = [];
                $scope.errors = [];

            }

            /**
             * Analyze all secrets
             */
            function generate_security_report(password, password_repeat, check_haveibeenpwned, send_to_server) {

                $scope.errors = [];
                if (!$scope.state['require_master_password']) {
                    password = '';
                    password_repeat = '';
                }
                if ($scope.state['require_master_password'] && !password) {
                    $scope.errors.push('PASSWORD_REQUIRED');
                    return;
                }
                if ($scope.state['require_master_password'] && password !== password_repeat) {
                    $scope.errors.push('PASSWORDS_DONT_MATCH');
                    return;
                }

                $scope.state.password = '';
                $scope.state.password_repeat = '';

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

                    var onSuccess = function (data) {
                        // server accepted security report
                    };

                    var onError = function (data) {
                        $scope.msgs = [];
                        if (data.hasOwnProperty('non_field_errors')) {
                            if (data.non_field_errors[0] === 'PASSWORD_INCORRECT') {
                                $scope.errors = ["PASSWORD_INCORRECT_SERVER_DECLINED_SECURITY_REPORT"];
                            } else {
                                $scope.errors = data.non_field_errors;
                            }
                        } else {
                            console.log(data);
                            alert("Error, should not happen.");
                        }
                    };

                    if (send_to_server) {
                        return managerSecurityReport.send_to_server(data.analysis, check_haveibeenpwned, password).then(onSuccess, onError);
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