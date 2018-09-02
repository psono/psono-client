(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerHistory
     * @requires psonocli.apiClient
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.managerBase
     *
     * @description
     * Service to manage the history of a secret
     */

    var managerHistory = function(apiClient, cryptoLibrary, managerBase) {

        /**
         * @ngdoc
         * @name psonocli.managerHistory#read_secret_history
         * @methodOf psonocli.managerHistory
         *
         * @description
         * Reads the history of a secret from the server
         *
         * @param {uuid} secret_id The secret_id to read the history from
         *
         * @returns {promise} Returns a list of history items
         */
        var read_secret_history = function(secret_id) {

            var onSuccess = function(data){
                return data.data.history;
            };

            var onError = function() {
                //pass
            };

            return apiClient.read_secret_history(managerBase.get_token(), managerBase.get_session_secret_key(), secret_id)
                .then(onSuccess, onError);
        };
        /**
         * @ngdoc
         * @name psonocli.managerHistory#read_secret_history
         * @methodOf psonocli.managerHistory
         *
         * @description
         * Reads the the details of a history entry
         *
         * @param {uuid} secret_history_id The id of the history list entry
         * @param {string} secret_key The secret key to decrypt the content of the history entry
         *
         * @returns {promise} Returns a list of history items
         */
        var read_history = function(secret_history_id, secret_key) {

            var onSuccess = function(content){
                var secret = JSON.parse(cryptoLibrary.decrypt_data(content.data.data, content.data.data_nonce, secret_key));
                secret['create_date'] = content.data['create_date'];
                secret['write_date'] = content.data['write_date'];
                return secret;
            };

            var onError = function() {
                //pass
            };

            return apiClient.read_history(managerBase.get_token(), managerBase.get_session_secret_key(), secret_history_id)
                .then(onSuccess, onError);
        };

        return {
            read_secret_history: read_secret_history,
            read_history: read_history
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerHistory", ['apiClient', 'cryptoLibrary', 'managerBase', managerHistory]);

}(angular));
