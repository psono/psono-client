(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerFileExchange
     * @requires $q
     * @requires psonocli.managerBase
     * @requires psonocli.apiClient
     * @requires psonocli.storage
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * managerFileExchange collects all functions to edit / update / create file exchanges and to work with them.
     */

    var managerFileExchange = function($q, managerBase, apiClient, storage, cryptoLibrary) {


        /**
         * @ngdoc
         * @name psonocli.managerFileExchange#get_possible_types
         * @methodOf psonocli.managerFileExchange
         *
         * @description
         * Returns the possible types
         *
         * @returns {*[]}
         */
        var get_possible_types = function() {
            return [
                {value: 'gcp_cloud_storage', title: 'GCP Cloud Storage'}
            ];
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileExchange#read_file_exchange
         * @methodOf psonocli.managerFileExchange
         *
         * @description
         * Returns one file exchanges
         *
         * @returns {promise} Promise with the file exchanges
         */
        var read_file_exchange = function(file_exchange_id) {

            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function () {
                // pass
            };

            return apiClient.read_file_exchange(managerBase.get_token(),
                managerBase.get_session_secret_key(), file_exchange_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileExchange#read_file_exchanges
         * @methodOf psonocli.managerFileExchange
         *
         * @description
         * Returns all file exchanges
         *
         * @returns {promise} Promise with the file exchanges
         */
        var read_file_exchanges = function() {

            var onSuccess = function (result) {
                return result.data.file_exchanges;
            };
            var onError = function () {
                // pass
            };

            return apiClient.read_file_exchange(managerBase.get_token(),
                managerBase.get_session_secret_key())
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileExchange#create_file_exchange
         * @methodOf psonocli.managerFileExchange
         *
         * @description
         * Creates an File Exchange
         *
         * @param {string} title The title of the new file exchange
         * @param {string} type The type of the new file exchange
         * @param {string} [gcp_cloud_storage_bucket] (optional) The gcp cloud storage bucket
         * @param {string} [gcp_cloud_storage_json_key] (optional) The gcp cloud storage json key
         *
         * @returns {promise} Promise with the new id
         */
        var create_file_exchange = function(title, type, gcp_cloud_storage_bucket, gcp_cloud_storage_json_key) {

            var onSuccess = function (result) {
                var file_exchange_id = result.data['file_exchange_id'];
                return {
                    'file_exchange_id': file_exchange_id
                }
            };
            var onError = function () {
                // pass
            };

            return apiClient.create_file_exchange(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                title,
                type,
                gcp_cloud_storage_bucket,
                gcp_cloud_storage_json_key
            )
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileExchange#update_file_exchange
         * @methodOf psonocli.managerFileExchange
         *
         * @description
         * Updates an File Exchange
         *
         * @param {uuid} file_exchange_id The id of the file exchange
         * @param {string} title The title of the new file exchange
         * @param {string} type The type of the new file exchange
         * @param {string} [gcp_cloud_storage_bucket] (optional) The gcp cloud storage bucket
         * @param {string} [gcp_cloud_storage_json_key] (optional) The gcp cloud storage json key
         * @param {bool} active
         *
         * @returns {promise} Promise with the new id
         */
        var update_file_exchange = function(file_exchange_id, title, type, gcp_cloud_storage_bucket, gcp_cloud_storage_json_key, active) {

            return apiClient.update_file_exchange(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                file_exchange_id,
                title,
                type,
                gcp_cloud_storage_bucket,
                gcp_cloud_storage_json_key,
                active
            )
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileExchange#delete_file_exchange
         * @methodOf psonocli.managerFileExchange
         *
         * @description
         * Deletes an File Exchange
         *
         * @param {uuid} file_exchange_id The id of the file exchange to delete
         *
         * @returns {promise} Promise
         */
        var delete_file_exchange = function(file_exchange_id) {


            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function (result) {
                // pass
            };

            return apiClient.delete_file_exchange(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                file_exchange_id
            )
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileExchange#file_exchanges_disabled
         * @methodOf psonocli.managerFileExchange
         *
         * @description
         * Returns weather the server allows the file exchanges feature or not
         * By default it will return false (indicate enabled file exchanges)
         */
        var file_exchanges_disabled = function () {

            var server_info =  storage.find_key('config', 'server_info');

            if (server_info === null) {
                return true
            }
            if (!server_info.value.hasOwnProperty('compliance_disable_file_exchanges')) {
                return false
            }

            return server_info.value['compliance_disable_file_exchanges'];
        };


        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#filter_file_exchanges
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Filters an array of file exchanges
         *
         * @param {array} file_exchanges Array of file exchanges
         * @param {bool} require_read Determines whether read is required or not
         * @param {bool} require_write Determines whether write is required or not
         *
         * @returns {array} list of file_exchanges that fulfill the filter criteria
         */
        var filter_file_exchanges = function (file_exchanges, require_read, require_write, require_active) {

            var filtered_file_exchanges = [];

            for (var i = 0; i < file_exchanges.length; i++) {
                if (require_read && !file_exchanges[i]['read']) {
                    continue
                }
                if (require_write && !file_exchanges[i]['write']) {
                    continue
                }
                if (require_active && !file_exchanges[i]['active']) {
                    continue
                }

                filtered_file_exchanges.push(file_exchanges[i]);
            }

            return filtered_file_exchanges;

        };


        return {
            get_possible_types: get_possible_types,
            read_file_exchange: read_file_exchange,
            read_file_exchanges: read_file_exchanges,
            create_file_exchange: create_file_exchange,
            update_file_exchange: update_file_exchange,
            delete_file_exchange: delete_file_exchange,
            file_exchanges_disabled: file_exchanges_disabled,
            filter_file_exchanges: filter_file_exchanges
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerFileExchange", ['$q', 'managerBase', 'apiClient', 'storage', 'cryptoLibrary', managerFileExchange]);

}(angular));

