(function(angular) {
    'use strict';

    /**
     * managerBase is 'like' a base class for all managers. It contains functions that should be accessible by several
     * managers but should never be added in any other services (because of design pattern and security reasons)
     *
     * @param $q
     * @param $timeout
     * @param $rootScope
     * @param apiClient
     * @param cryptoLibrary
     * @param storage
     * @returns {{delete_local_data: delete_local_data, find_one_nolimit: find_one_nolimit, find_one: find_one}}
     */

    var managerBase = function($q, $timeout, $rootScope, apiClient, cryptoLibrary, storage) {

        var forbidden_keys = {
            'config': [
                'user_token',
                'session_secret_key',
                'user_private_key',
                'user_secret_key',
                'user_sauce'
            ]
        };

        /**
         * Deletes local data in storage
         */
        var delete_local_data = function () {
            storage.remove_all();
            storage.save();
        };
        
        /**
         * "Private" function, that will return the object with the specified key from the specified db
         * May only be used in "managers"
         *
         * @param db
         * @param key
         *
         * @returns {*}
         */
        var find_one_nolimit = function(db, key) {

            var obj = storage.find_one(db, {'key': key});
            if (obj === null) {
                return ''
            }
            return obj['value'];
        };

        /**
         * Finds object with specified key in specified db. Also checks if its in the forbidden key list
         * @param db
         * @param key
         *
         * @returns {string}
         */
        var find_one = function(db, key) {

            if (forbidden_keys.hasOwnProperty(db) && forbidden_keys[db].indexOf(key) >= 0) {
                return ''
            }
            return find_one_nolimit(db, key);
        };

        /**
         * returns the token from storage
         *
         * @returns {string}
         */
        var get_token = function () {
            return find_one_nolimit('config', 'user_token');
        };

        /**
         * returns the session secret key from storage
         *
         * @returns {string}
         */
        var get_session_secret_key = function () {
            return find_one_nolimit('config', 'session_secret_key');
        };

        /**
         * encrypts some data with user's public-private-key-crypto
         *
         * @param data
         * @param public_key
         * @returns {{nonce, text}|{nonce: string, text: string}|{nonce, ciphertext}|{nonce: string, ciphertext: string}}
         */
        var encrypt_private_key = function (data, public_key) {
            return cryptoLibrary.encrypt_data_public_key(data, public_key, find_one_nolimit('config', 'user_private_key'));
        };

        /**
         * encrypts some data with user's public-private-key-crypto
         *
         * @param text
         * @param nonce
         * @param public_key
         * @returns {string}
         */
        var decrypt_private_key = function (text, nonce, public_key) {
            return cryptoLibrary.decrypt_data_public_key(text, nonce, public_key, find_one_nolimit('config', 'user_private_key'));
        };

        /**
         * encrypts some data with user's secret-key-crypto
         *
         * @param data
         * @returns {{nonce, text}|{nonce: string, text: string}|{nonce, ciphertext}|{nonce: string, ciphertext: string}}
         */
        var encrypt_secret_key = function(data) {
            return cryptoLibrary.encrypt_data(data, find_one_nolimit('config', 'user_secret_key'));
        };

        /**
         * decrypts some data with user's secret-key-crypto
         *
         * @param text
         * @param nonce
         * @returns {string}
         */
        var decrypt_secret_key = function (text, nonce) {
            return cryptoLibrary.decrypt_data(text, nonce, find_one_nolimit('config', 'user_secret_key'));
        };

        return {
            delete_local_data: delete_local_data,
            find_one_nolimit: find_one_nolimit,
            find_one: find_one,
            get_token: get_token,
            get_session_secret_key: get_session_secret_key,
            encrypt_private_key: encrypt_private_key,
            decrypt_private_key: decrypt_private_key,
            encrypt_secret_key: encrypt_secret_key,
            decrypt_secret_key: decrypt_secret_key
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerBase", ['$q', '$timeout', '$rootScope', 'apiClient', 'cryptoLibrary', 'storage', managerBase]);

}(angular));