(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerHost
     * @requires $q
     * @requires $http
     * @requires psonocli.apiClient
     * @requires psonocli.storage
     * @requires psonocli.browserClient
     * @requires psonocli.managerBase
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Service to manage the user datastore and user related functions
     */

    var managerHost = function($q, $http, apiClient, helper, storage, browserClient, managerBase, cryptoLibrary) {

        /**
         * @ngdoc
         * @name psonocli.managerHost#update_known_hosts
         * @methodOf psonocli.managerHost
         *
         * @description
         * Returns all known hosts
         *
         * @returns {*} The known hosts
         */
        function get_known_hosts() {
            if (! storage.key_exists('persistent', 'known_hosts')) {
                storage.insert('persistent', {key: 'known_hosts', value: [{
                    "url" : "https://www.psono.pw/server",
                    "verify_key" : "a16301bd25e3a445a83b279e7091ea91d085901933f310fdb1b137db9676de59"
                }]});
                storage.save();
            }

            return storage.find_key('persistent', 'known_hosts')['value'];
        }
        /**
         * @ngdoc
         * @name psonocli.managerHost#get_current_host
         * @methodOf psonocli.managerHost
         *
         * @description
         * Returns the current host
         *
         * @returns {*} The current host
         */
        function get_current_host() {
            var current_host = storage.find_key('config', 'server')['value'];
            return helper.duplicate_object(current_host);
        }
        /**
         * @ngdoc
         * @name psonocli.managerHost#get_current_host_url
         * @methodOf psonocli.managerHost
         *
         * @description
         * Returns the url of the current host
         *
         * @returns {*} The current host url
         */
        function get_current_host_url() {
            var current_host = storage.find_key('config', 'server')['value'];
            return current_host['url'].toLowerCase();
        }

        /**
         * @ngdoc
         * @name psonocli.managerHost#update_known_hosts
         * @methodOf psonocli.managerHost
         *
         * @description
         * Updates the known servers with the given new list of servers
         *
         * @param {array} new_known_hosts List of the new servers
         */
        function update_known_hosts(new_known_hosts) {
            storage.upsert('persistent', {'key': 'known_hosts', 'value': new_known_hosts});
            storage.save();
        }

        /**
         * @ngdoc
         * @name psonocli.managerHost#check_known_hosts
         * @methodOf psonocli.managerHost
         *
         * @description
         * Tries to find the server_url and fingerprint in the known hosts storage and compares the fingerprint
         *
         * @param {string} server_url The url of the server
         * @param {string} verify_key The fingerprint of the server
         *
         * @returns {*} The result of the search / comparison
         */
        function check_known_hosts(server_url, verify_key) {

            var known_hosts = get_known_hosts();
            server_url = server_url.toLowerCase();

            for (var i = 0; i < known_hosts.length; i++) {
                if (known_hosts[i]['url'] !== server_url) {
                    continue;
                }
                if (known_hosts[i]['verify_key'] !== verify_key) {
                    return {
                        status: 'signature_changed',
                        verify_key_old: known_hosts[i]['verify_key']
                    };
                }
                return {
                    status: 'matched'
                };
            }

            return {
                status: 'not_found'
            };
        }


        /**
         * @ngdoc
         * @name psonocli.managerHost#info
         * @methodOf psonocli.managerHost
         *
         * @description
         * Returns the server info
         *
         * @returns {promise} Server info
         */
        function info() {

            var onSuccess = function(response){

                response.data['decoded_info'] = JSON.parse(response.data['info']);

                return response
            };
            return apiClient.info().then(onSuccess);
        }


        /**
         * @ngdoc
         * @name psonocli.managerHost#check_host
         * @methodOf psonocli.managerHost
         *
         * @description
         * Validates the signature of the server and compares it to known hosts.
         *
         * @param {object} server The server object
         *
         * @returns {promise} Result of the check
         */
        function check_host(server) {

            storage.upsert('config', {key: 'server', value: server});

            var onSuccess = function(response){

                var check_result;
                var data = response.data;
                var server_url = server['url'].toLowerCase();

                if (! cryptoLibrary.validate_signature(data['info'], data['signature'], data['verify_key'])) {
                    return {
                        server_url: server_url,
                        status: 'invalid_signature',
                        verify_key: undefined,
                        info: data['decoded_info']
                    };
                }

                check_result = check_known_hosts(server_url, data['verify_key']);

                if (check_result['status'] === 'matched') {
                    return {
                        server_url: server_url,
                        status: 'matched',
                        verify_key: data['verify_key'],
                        info: data['decoded_info']
                    };
                } else if(check_result['status'] === 'signature_changed') {

                    return {
                        server_url: server_url,
                        status: 'signature_changed',
                        verify_key: data['verify_key'],
                        verify_key_old: check_result['verify_key_old'],
                        info: data['decoded_info']
                    };
                } else {
                    return {
                        server_url: server_url,
                        status: 'new_server',
                        verify_key: data['verify_key'],
                        info: data['decoded_info']
                    };
                }
            };

            return info().then(onSuccess);
        }


        /**
         * @ngdoc
         * @name psonocli.managerHost#load_remote_config
         * @methodOf psonocli.managerHost
         *
         * @description
         * Loads a remote config. It takes an url of a remote web client and loads its config.
         * It persists the config so it does not need to be loaded multiple times
         *
         * @param {string} web_client_url The url of a web client without trailing slash
         *
         * @returns {promise} Result of the check
         */
        function load_remote_config(web_client_url) {

            var req = {
                method: 'GET',
                url: web_client_url + '/config.json'
            };

            var onSuccess = function(config) {
                storage.upsert('persistent', {'key': 'remote_config_json', 'value': config.data});
                storage.save();
                browserClient.clear_config_cache();
            };

            var onError = function(data) {
                console.log(data);
                return $q.reject(data);
            };

            return $http(req).then(onSuccess, onError);
        }

        /**
         * @ngdoc
         * @name psonocli.managerHost#approve_host
         * @methodOf psonocli.managerHost
         *
         * @description
         * Puts the server with the specified url and verify key on the approved servers list
         *
         * @param {string} server_url The url of the server
         * @param {string} verify_key The verification key
         */
        function approve_host(server_url, verify_key) {
            server_url = server_url.toLowerCase();

            var known_hosts = get_known_hosts();

            for (var i = 0; i < known_hosts.length; i++) {
                if (known_hosts[i]['url'] !== server_url) {
                    continue;
                }
                known_hosts[i]['verify_key'] = verify_key;

                update_known_hosts(known_hosts);
                return;
            }

            known_hosts.push({
                'url': server_url,
                'verify_key': verify_key
            });

            update_known_hosts(known_hosts);
        }

        /**
         * @ngdoc
         * @name psonocli.managerHost#delete_known_host
         * @methodOf psonocli.managerHost
         *
         * @description
         * Deletes a known host identified by its fingerprint from the storage
         *
         * @param {string} fingerprint The fingerprint of the host
         */
        function delete_known_host(fingerprint) {

            var known_hosts = get_known_hosts();

            helper.remove_from_array(known_hosts, fingerprint, function(known_host, fingerprint) {
                return known_host['verify_key'] === fingerprint;
            });

            update_known_hosts(known_hosts);
        }



        return {
            get_known_hosts: get_known_hosts,
            get_current_host: get_current_host,
            get_current_host_url: get_current_host_url,
            check_known_hosts: check_known_hosts,
            info: info,
            check_host: check_host,
            load_remote_config: load_remote_config,
            approve_host: approve_host,
            delete_known_host: delete_known_host,
            update_known_hosts: update_known_hosts
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerHost", ['$q', '$http', 'apiClient', 'helper', 'storage', 'browserClient', 'managerBase', 'cryptoLibrary', managerHost]);

}(angular));