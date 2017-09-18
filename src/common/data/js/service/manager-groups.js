(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerGroups
     * @requires $q
     * @requires $rootScope
     * @requires psonocli.apiClient
     * @requires psonocli.browserClient
     * @requires psonocli.storage
     * @requires psonocli.helper
     * @requires psonocli.managerBase
     * @requires psonocli.managerDatastore
     * @requires psonocli.shareBlueprint
     * @requires psonocli.itemBlueprint
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Service to manage the groups and group related functions
     */

    var managerGroups = function($q, $rootScope, apiClient, browserClient, storage,
                                 helper, managerBase, managerDatastore, shareBlueprint,
                                 itemBlueprint, cryptoLibrary) {

        var groups_cache;
        var group_secret_key_cache = {};

        var get_group_secret_key = function(group_id, group_secret_key, group_secret_key_nonce, group_secret_key_type, group_public_key) {
            if (group_secret_key_cache.hasOwnProperty(group_id)) {
                return group_secret_key_cache[group_id];
            }
            if (group_secret_key_type === 'symmetric') {
                group_secret_key_cache[group_id] = managerBase.decrypt_secret_key(group_secret_key, group_secret_key_nonce);
            } else {
                group_secret_key_cache[group_id] = managerBase.decrypt_private_key(group_secret_key, group_secret_key_nonce, group_public_key);
            }

            return group_secret_key_cache[group_id];
        };

        /**
         * @ngdoc
         * @name psonocli.managerGroups#read_group
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Fetches the details of one group
         *
         * @param {uuid} group_id the group id
         *
         * @returns {promise} Returns a list of groups
         */
        var read_group = function(group_id) {

            var onSuccess = function(data){
                return data.data;
            };

            var onError = function() {
                //pass
            };

            return apiClient.read_group(managerBase.get_token(), managerBase.get_session_secret_key(), group_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerGroups#read_groups
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Fetches the list of all groups this user belongs to
         *
         * @param {boolean} force_fresh Force fresh call to the backend
         *
         * @returns {promise} Returns a list of groups
         */
        var read_groups = function(force_fresh) {

            if ((typeof force_fresh === 'undefined' || force_fresh === false) && typeof(groups_cache) !== 'undefined') {
                return $q.resolve(helper.duplicate_object(groups_cache));
            }

            var onSuccess = function(data){
                groups_cache = helper.duplicate_object(data.data.groups);
                return data.data.groups;
            };

            var onError = function() {
                //pass
            };

            return apiClient.read_group(managerBase.get_token(), managerBase.get_session_secret_key())
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerGroups#create_group
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Creates a new group
         *
         * @param {string} name the name for the new group
         *
         * @returns {promise} Returns whether the creation was successful or not
         */
        var create_group = function(name) {

            var onSuccess = function(data){
                if (typeof(groups_cache) === 'undefined') {
                    groups_cache = []
                }
                groups_cache.push(helper.duplicate_object(data.data));
                return data.data;
            };

            var onError = function() {
                //pass
            };

            var group_secret_key = cryptoLibrary.generate_secret_key();
            var group_secret_key_enc = managerBase.encrypt_secret_key(group_secret_key);
            var group_key_pair = cryptoLibrary.generate_public_private_keypair();
            var group_private_key_enc = managerBase.encrypt_secret_key(group_key_pair['private_key']);
            var group_public_key = group_key_pair['public_key'];

            return apiClient.create_group(managerBase.get_token(), managerBase.get_session_secret_key(), name,
                group_secret_key_enc.text, group_secret_key_enc.nonce, group_private_key_enc.text,
                group_private_key_enc.nonce, group_public_key)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerGroups#delete_group
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Deletes a given group
         *
         * @param {uuid} group_id the group id
         *
         * @returns {promise} Returns a list of groups
         */
        var delete_group = function(group_id) {

            var onSuccess = function(data){
                helper.remove_from_array(groups_cache, group_id, function(a, b) {
                    return a['group_id'] === b;
                });
                return data.data;
            };

            var onError = function() {
                //pass
            };

            return apiClient.delete_group(managerBase.get_token(), managerBase.get_session_secret_key(), group_id)
                .then(onSuccess, onError);
        };

        itemBlueprint.register('get_group_secret_key', get_group_secret_key);

        return {
            get_group_secret_key: get_group_secret_key,
            read_group: read_group,
            read_groups: read_groups,
            create_group: create_group,
            delete_group: delete_group
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerGroups", ['$q', '$rootScope', 'apiClient', 'browserClient', 'storage',
        'helper', 'managerBase', 'managerDatastore', 'shareBlueprint',
        'itemBlueprint', 'cryptoLibrary', managerGroups]);

}(angular));