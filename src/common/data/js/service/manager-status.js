(function (angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerStatus
     * @requires $rootScope
     * @requires $q
     * @requires $interval
     * @requires localStorageService
     * @requires psonocli.apiClient
     * @requires psonocli.managerBase
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.offlineCache
     *
     * @description
     * Service that is something like the base class for adf widgets
     */

    var managerStatus = function ($rootScope, $q, $interval, localStorageService, apiClient, managerBase, managerDatastoreUser, offlineCache) {

        var interval_time = 60000;
        var status;

        activate();

        function activate() {
            $interval(update_status, interval_time);
        }

        /**
         * @ngdoc
         * @name psonocli.managerStatus#get_status
         * @methodOf psonocli.managerStatus
         *
         * @description
         * Returns the current status async
         */
        function get_status() {
            if (status) {
                return $q.resolve(status);
            } else {
                return update_status();
            }
        }

        /**
         * @ngdoc
         * @name psonocli.managerStatus#update_status
         * @methodOf psonocli.managerStatus
         *
         * @description
         * Queries the server for the current status of the user if the local cached status is outdated.
         *
         * @returns {promise} Returns a promise with the current status
         */
        function update_status() {

            var d = new Date();
            var timestamp = d.getTime();
            var server_status = localStorageService.get('server_status');
            var server_status_outdated = server_status === null || server_status.valid_till < timestamp;
            var is_logged_in = managerDatastoreUser.is_logged_in();
            var is_offline = offlineCache.is_active();

            var broadcast_on_change = function(new_server_status) {
                var status_updated = typeof(status) === 'undefined' || JSON.stringify(new_server_status.data) !== JSON.stringify(status.data);

                if (status_updated) {
                    $rootScope.$broadcast('server_status_updated', new_server_status);
                }

                status = new_server_status;
            };

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {

                var new_server_status = {
                    data: content.data,
                    valid_till: timestamp + interval_time - 10
                };

                broadcast_on_change(new_server_status);

                localStorageService.set('server_status', new_server_status);

                return status;
            };

            if(!is_logged_in) {
                return $q.resolve();
            }

            if(is_offline) {
                return $q.resolve({
                    data: {}
                });
            }

            if(!server_status_outdated) {
                broadcast_on_change(server_status);
                return $q.resolve(status);
            }

            return apiClient.read_status(managerBase.get_token(), managerBase.get_session_secret_key()).then(onSuccess, onError)
        }

        return {
            get_status: get_status
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerStatus", ['$rootScope', '$q', '$interval', 'localStorageService', 'apiClient', 'managerBase', 'managerDatastoreUser', 'offlineCache', managerStatus]);

}(angular));