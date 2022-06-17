(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:OtherKnownHostsCtrl
     * @requires $scope
     * @requires psonocli.managerHost
     * @requires psonocli.helper
     *
     * @description
     * Controller for the KnownHosts tab in the "Others" menu
     */
    angular.module('psonocli').controller('OtherKnownHostsCtrl', ['$scope', 'managerHost', 'helper', 'languagePicker', 'DTOptionsBuilder', 'DTColumnDefBuilder',
        function ($scope, managerHost, helper, languagePicker, DTOptionsBuilder, DTColumnDefBuilder) {

            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withLanguageSource('translations/datatables.' + languagePicker.get_active_language_code() + '.json');

            $scope.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1),
                DTColumnDefBuilder.newColumnDef(2),
                DTColumnDefBuilder.newColumnDef(3)
            ];

            $scope.known_hosts=[];
            $scope.delete_known_host = delete_known_host;

            activate();

            function activate() {
                var known_hosts = managerHost.get_known_hosts();
                var current_host_url = managerHost.get_current_host_url();
                var known_host;

                for (var i = 0; i < known_hosts.length; i++) {
                    known_host = known_hosts[i];
                    known_host['current_host'] = known_host['url'] === current_host_url;
                }

                $scope.known_hosts=known_hosts;
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherKnownHostsCtrl#delete_known_host
             * @methodOf psonocli.controller:OtherKnownHostsCtrl
             *
             * @description
             * deletes a known host with given fingerprint
             *
             * @param {object} host The host to delete
             */
            function delete_known_host(host) {
                managerHost.delete_known_host(host['verify_key']);
                helper.remove_from_array($scope.known_hosts, host['verify_key'], function(known_host, fingerprint) {
                    return known_host['verify_key'] === fingerprint;
                });
            }
        }]
    );
}(angular));