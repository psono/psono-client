(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerBase
     * @requires $q
     * @requires $timeout
     * @requires $rootScope
     * @requires psonocli.apiClient
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.storage
     * @requires psonocli.helper
     *
     * @description
     * managerBase is 'like' a base class for all managers. It contains functions that should be accessible by several
     * managers but should never be added in any other services (because of design pattern and security reasons)
     */

    var managerBase = function($q, $timeout, $rootScope, apiClient, cryptoLibrary, storage, helper) {

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
         * @ngdoc
         * @name psonocli.managerBase#delete_local_data
         * @methodOf psonocli.managerBase
         *
         * @description
         * Deletes local data in storage
         */
        var delete_local_data = function () {
            storage.remove_all();
            storage.save();
        };

        /**
         * @ngdoc
         * @name psonocli.managerBase#find_key_nolimit
         * @methodOf psonocli.managerBase
         *
         * @description
         * "Private" function, that will return the object with the specified key from the specified db
         * May only be used in "managers"
         *
         * @param {String} db The database
         * @param {String} key The key of the value to retrieve
         *
         * @returns {*} Returns the found object
         */
        var find_key_nolimit = function(db, key) {

            var obj = storage.find_key(db, key);
            if (obj === null || typeof(obj) === 'undefined') {
                return ''
            }
            return obj['value'];
        };

        /**
         * @ngdoc
         * @name psonocli.managerBase#find_key
         * @methodOf psonocli.managerBase
         *
         * @description
         * Finds object with specified key in specified db. Also checks if its in the forbidden key list
         *
         * @param {String} db The database
         * @param {String} key The key of the value to retrieve
         *
         * @returns {*} Returns the found object
         */
        var find_key = function(db, key) {

            if (forbidden_keys.hasOwnProperty(db) && forbidden_keys[db].indexOf(key) >= 0) {
                return ''
            }
            return find_key_nolimit(db, key);
        };

        /**
         * @ngdoc
         * @name psonocli.managerBase#get_token
         * @methodOf psonocli.managerBase
         *
         * @description
         * returns the token from storage
         *
         * @returns {string} Returns the token
         */
        var get_token = function () {
            return find_key_nolimit('config', 'user_token');
        };

        /**
         * @ngdoc
         * @name psonocli.managerBase#get_session_secret_key
         * @methodOf psonocli.managerBase
         *
         * @description
         * returns the session secret key from storage
         *
         * @returns {string} Returns the session secret key
         */
        var get_session_secret_key = function () {
            return find_key_nolimit('config', 'session_secret_key');
        };

        /**
         * @ngdoc
         * @name psonocli.managerBase#encrypt_private_key
         * @methodOf psonocli.managerBase
         *
         * @description
         * encrypts some data with user's public-private-key-crypto
         *
         * @param {string} data The data you want to encrypt
         * @param {string} public_key The public key you want to use for the encryption
         *
         * @returns {EncryptedValue} The encrypted text and the nonce
         */
        var encrypt_private_key = function (data, public_key) {
            return cryptoLibrary.encrypt_data_public_key(data, public_key, find_key_nolimit('config', 'user_private_key'));
        };

        /**
         * @ngdoc
         * @name psonocli.managerBase#decrypt_private_key
         * @methodOf psonocli.managerBase
         *
         * @description
         * encrypts some data with user's public-private-key-crypto
         *
         * @param {string} text The encrypted text
         * @param {string} nonce The nonce that belongs to the encrypted text
         * @param {string} public_key The pulic key you want to use to decrypt the text
         *
         * @returns {string} The decrypted data
         */
        var decrypt_private_key = function (text, nonce, public_key) {
            return cryptoLibrary.decrypt_data_public_key(text, nonce, public_key, find_key_nolimit('config', 'user_private_key'));
        };

        /**
         * @ngdoc
         * @name psonocli.managerBase#encrypt_secret_key
         * @methodOf psonocli.managerBase
         *
         * @description
         * encrypts some data with user's secret-key-crypto
         *
         * @param {string} data The data you want to encrypt
         *
         * @returns {EncryptedValue} The encrypted text and the nonce
         */
        var encrypt_secret_key = function(data) {
            return cryptoLibrary.encrypt_data(data, find_key_nolimit('config', 'user_secret_key'));
        };

        /**
         * @ngdoc
         * @name psonocli.managerBase#decrypt_secret_key
         * @methodOf psonocli.managerBase
         *
         * @description
         * decrypts some data with user's secret-key-crypto
         *
         * @param {string} text The encrypted text
         * @param {string} nonce The nonce of the encrypted text
         *
         * @returns {string} The decrypted data
         */
        var decrypt_secret_key = function (text, nonce) {
            return cryptoLibrary.decrypt_data(text, nonce, find_key_nolimit('config', 'user_secret_key'));
        };

        /**
         * @ngdoc
         * @name psonocli.managerBase#filter_datastore_content
         * @methodOf psonocli.managerBase
         *
         * @description
         * Creates a copy of content and filters some attributes out, to save some storage or fix some missbehaviour
         *
         * @param {TreeObject} content The datastore content to filter
         *
         * @returns {TreeObject} Filtered copy of the content
         */
        var filter_datastore_content = function(content) {
            var content_copy  = helper.duplicate_object(content);

            var filter = ['expanded', 'expanded_temporary',  'is_expanded', 'filter', 'hidden', 'share_rights', 'parent_share_id', 'parent_datastore_id'];

            var filter_content = function (content, filter) {
                var i, m;

                // test attributes in content
                for (m = 0; m < filter.length; m++) {
                    if (content.hasOwnProperty(filter[m])) {
                        delete content[filter[m]];
                    }
                }

                // test items
                for (i = 0; content.hasOwnProperty("items") && i < content.items.length; i++) {
                    for (m = 0; m < filter.length; m++) {
                        if (content.items[i].hasOwnProperty(filter[m])) {
                            delete content.items[i][filter[m]];
                        }
                    }
                }
                // call self recursivly for folders
                for (i = 0; content.hasOwnProperty("folders") && i < content.folders.length; i ++) {
                    filter_content(content.folders[i], filter);
                }

            };

            filter_content(content_copy, filter);

            return content_copy;
        };

        return {
            delete_local_data: delete_local_data,
            find_key_nolimit: find_key_nolimit,
            find_key: find_key,
            get_token: get_token,
            get_session_secret_key: get_session_secret_key,
            encrypt_private_key: encrypt_private_key,
            decrypt_private_key: decrypt_private_key,
            encrypt_secret_key: encrypt_secret_key,
            decrypt_secret_key: decrypt_secret_key,
            filter_datastore_content: filter_datastore_content
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerBase", ['$q', '$timeout', '$rootScope', 'apiClient', 'cryptoLibrary', 'storage', 'helper', managerBase]);

}(angular));