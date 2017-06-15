(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:KnownHostsCtrl
     * @requires $scope
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.helper
     *
     * @description
     * Controller for the KnownHosts tab in the "Others" menu
     */
    angular.module('psonocli').controller('KnownHostsCtrl', ['$scope', 'managerHost', 'helper',
        function ($scope, managerHost, helper) {

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
             * deletes a known host with given fingerprint
             *
             * @param host The host to delete
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