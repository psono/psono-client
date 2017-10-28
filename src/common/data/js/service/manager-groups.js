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
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.managerShare
     * @requires psonocli.shareBlueprint
     * @requires psonocli.itemBlueprint
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Service to manage the groups and group related functions
     */

    var managerGroups = function($q, $rootScope, apiClient, browserClient, storage,
                                 helper, managerBase, managerDatastorePassword, managerShare, shareBlueprint,
                                 itemBlueprint, cryptoLibrary) {

        var groups_cache = [];
        var group_secret_key_cache = {};
        var group_private_key_cache = {};

        /**
         * @ngdoc
         * @name psonocli.managerGroups#get_group_secret_key
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Returns the secret key of a group
         *
         * @param group_id The group id
         * @param group_secret_key The group's secret key (encrypted)
         * @param group_secret_key_nonce The nonce for the decryption of the group's secret key
         * @param group_secret_key_type The type of the encryption
         * @param group_public_key The group's public key (necessary if the encryption is asymmetric)
         *
         * @returns {*} Returns the secret key of a group
         */
        var get_group_secret_key = function(group_id, group_secret_key, group_secret_key_nonce, group_secret_key_type, group_public_key) {

            if (group_secret_key_cache.hasOwnProperty(group_id)) {
                return group_secret_key_cache[group_id];
            }
            if (typeof(group_secret_key) === 'undefined') {
                for (var i = 0; i < groups_cache.length; i++) {
                    if (groups_cache[i]['group_id'] !== group_id) {
                        continue;
                    }

                    group_secret_key = groups_cache[i]['secret_key'];
                    group_secret_key_nonce = groups_cache[i]['secret_key_nonce'];
                    group_secret_key_type = groups_cache[i]['secret_key_type'];
                    group_public_key = groups_cache[i]['public_key'];

                    break;
                }
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
         * @name psonocli.managerGroups#get_group_private_key
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Returns the private key of a group. Uses a temporary cache to reduce the encryption effort.
         *
         * @param group_id The group id
         * @param group_private_key The group's private key (encrypted)
         * @param group_private_key_nonce The nonce for the decryption of the group's private key
         * @param group_private_key_type The type of the encryption
         * @param group_public_key The group's public key (necessary if the encryption is asymmetric)
         *
         * @returns {*} Returns the private key of a group
         */
        var get_group_private_key = function(group_id, group_private_key, group_private_key_nonce, group_private_key_type, group_public_key) {
            if (group_private_key_cache.hasOwnProperty(group_id)) {
                return group_private_key_cache[group_id];
            }
            if (group_private_key_type === 'symmetric') {
                group_private_key_cache[group_id] = managerBase.decrypt_secret_key(group_private_key, group_private_key_nonce);
            } else {
                group_private_key_cache[group_id] = managerBase.decrypt_private_key(group_private_key, group_private_key_nonce, group_public_key);
            }

            return group_private_key_cache[group_id];
        };

        /**
         * @ngdoc
         * @name psonocli.managerGroups#decrypt_secret_key
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Looks up the secret key of the group in the local cache and decrypts the provided encrypted message together
         * with the nonce
         *
         * @param group_id The group id
         * @param encrypted_message The encrypted message
         * @param encrypted_message_nonce The nonce of the encrypted message
         *
         * @returns {promise} Returns a promise with the decrypted secret
         */
        var decrypt_secret_key = function(group_id, encrypted_message, encrypted_message_nonce) {
            var secret_key = get_group_secret_key(group_id);
            return cryptoLibrary.decrypt_data(encrypted_message, encrypted_message_nonce, secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.managerGroups#decrypt_secret_key
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Looks up the secret key of the group in the local cache and decrypts the provided encrypted message together
         * with the nonce
         *
         * @param group_id The group id
         * @param encrypted_message The encrypted message
         * @param encrypted_message_nonce The nonce of the encrypted message
         * @param public_key The corresponding public key
         *
         * @returns {promise} Returns a promise with the decrypted secret
         */
        var decrypt_private_key = function(group_id, encrypted_message, encrypted_message_nonce, public_key) {
            var private_key = get_group_private_key(group_id);
            return cryptoLibrary.decrypt_data(encrypted_message, encrypted_message_nonce, public_key, private_key);
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
         * @returns {promise} Returns the details of a group
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
         * Fetches the list of all groups this user belongs to and updates the local cache
         *
         * @param {boolean} force_fresh Force fresh call to the backend
         *
         * @returns {promise} Returns a list of groups
         */
        var read_groups = function(force_fresh) {

            if ((typeof force_fresh === 'undefined' || force_fresh === false) && groups_cache.length > 0) {
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
         * Creates a new group and updates the local cache
         *
         * @param {string} name the name for the new group
         *
         * @returns {promise} Returns whether the creation was successful or not
         */
        var create_group = function(name) {

            var onSuccess = function(data){
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
         * @name psonocli.managerGroups#update_group
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Updates a given group and updates the local cache
         *
         * @param {uuid} group_id the group id
         * @param {string} name the new name of the group
         *
         * @returns {promise} Returns whether the update was successful or not
         */
        var update_group = function(group_id, name) {

            var onSuccess = function(data){

                for (var i = 0; i < groups_cache.length; i++) {
                    if (groups_cache[i].group_id !== group_id) {
                        continue;
                    }
                    groups_cache[i] = name;
                }

                return data.data;
            };

            var onError = function() {
                //pass
            };

            return apiClient.update_group(managerBase.get_token(), managerBase.get_session_secret_key(), group_id, name)
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
         * @param {uuid} group_id the group id and updates the local cache
         *
         * @returns {promise} Returns whether the delete was successful or not
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

        /**
         * @ngdoc
         * @name psonocli.managerGroups#read_group_rights
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Reads the all group rights of the user or the group rights of a specific group
         *
         * @param {uuid|undefined} [group_id] (optional) group ID
         *
         * @returns {promise} Returns a list of groups rights
         */
        var read_group_rights = function(group_id) {

            var onSuccess = function(data){
                return data.data;
            };

            var onError = function() {
                //pass
            };

            return apiClient.read_group_rights(managerBase.get_token(), managerBase.get_session_secret_key(), group_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerGroups#get_outstanding_group_shares
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Gets all group rights and compares it the accessible rights in the current password datastore.
         * Will return a list of share rights not yet in the datastore.
         *
         * @returns {promise} Returns a dict with the inaccessible group shares, grouped by group_id
         */
        var get_outstanding_group_shares = function() {

            var onSuccess = function(data){

                var inaccessible_share_list = managerDatastorePassword.get_inaccessible_shares(data.group_rights);
                var inaccessible_share_by_group_dict = {};

                for (var i = 0; i < inaccessible_share_list.length; i++) {
                    var inaccessible_share = inaccessible_share_list[i];

                    if (!inaccessible_share_by_group_dict.hasOwnProperty(inaccessible_share.group_id)) {
                        inaccessible_share_by_group_dict[inaccessible_share.group_id] = {};
                    }
                    inaccessible_share_by_group_dict[inaccessible_share.group_id][inaccessible_share.share_id] = inaccessible_share;
                }

                return inaccessible_share_by_group_dict;
            };

            var onError = function() {
                //pass
            };

            return read_group_rights()
                .then(onSuccess, onError);

        };

        /**
         * @ngdoc
         * @name psonocli.managerGroups#create_membership
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Creates a new group membership
         *
         * @param {object} user The user for the new membership
         * @param {object} group The group for the new membership
         * @param {boolean} group_admin If the new group member should get group admin rights or not
         *
         * @returns {promise} Returns whether the creation was successful or not
         */
        var create_membership = function(user, group, group_admin) {

            var onSuccess = function(data){
                return data.data;
            };

            var onError = function() {
                //pass
            };

            var group_secret_key = get_group_secret_key(group.group_id, group.secret_key, group.secret_key_nonce,
                    group.secret_key_type, group.public_key);

            var group_private_key = get_group_private_key(group.group_id, group.private_key, group.private_key_nonce,
                group.private_key_type, group.public_key);

            var group_secret_key_enc = cryptoLibrary.encrypt_data_public_key(group_secret_key, user.public_key, group_private_key);
            var group_private_key_enc = cryptoLibrary.encrypt_data_public_key(group_private_key, user.public_key, group_private_key);



            return apiClient.create_membership(managerBase.get_token(), managerBase.get_session_secret_key(), group.group_id,
                user.id, group_secret_key_enc.text, group_secret_key_enc.nonce, 'asymmetric', group_private_key_enc.text,
                group_private_key_enc.nonce, 'asymmetric', group_admin)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerGroups#update_membership
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Updates a group membership
         *
         * @param {uuid} membership_id The membership_id to delete
         * @param {boolean} group_admin If the new group member should get group admin rights or not
         *
         * @returns {promise} Returns whether the deletion was successful or not
         */
        var update_membership = function(membership_id, group_admin) {

            var onSuccess = function(data){
                return data.data;
            };

            var onError = function() {
                //pass
            };

            return apiClient.update_membership(managerBase.get_token(), managerBase.get_session_secret_key(), membership_id, group_admin)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerGroups#delete_membership
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Deletes a group membership
         *
         * @param {uuid} membership_id The membership_id to delete
         *
         * @returns {promise} Returns whether the deletion was successful or not
         */
        var delete_membership = function(membership_id) {

            var onSuccess = function(data){
                return data.data;
            };

            var onError = function() {
                //pass
            };

            return apiClient.delete_membership(managerBase.get_token(), managerBase.get_session_secret_key(), membership_id)
                .then(onSuccess, onError);
        };


        /**
         * @ngdoc
         * @name psonocli.managerGroups#decrypt_group_share
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Decrypts for a given group a share
         *
         * @param group_id The group id
         * @param share The encrypted share
         *
         * @returns {{}} The decrypted sahre
         */
        var decrypt_group_share = function(group_id, share) {

            var share_secret_key = decrypt_secret_key(group_id, share.share_key, share.share_key_nonce);
            var decrypted_share = managerShare.decrypt_share(share, share_secret_key);

            if (typeof decrypted_share.name === 'undefined') {
                decrypted_share.name = decrypt_secret_key(group_id, share.share_title, share.share_title_nonce);
            }

            if (typeof decrypted_share.type === 'undefined' && typeof share.share_type !== "undefined") {

                var type = decrypt_secret_key(group_id, share.share_type, share.share_type_nonce);

                if (type !== 'folder') {
                    decrypted_share.type = type;
                }
            }

            return decrypted_share
        };



        /**
         * @ngdoc
         * @name psonocli.managerGroups#decrypt_group_shares
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Decrypts for a given group a list of shares
         *
         * @param group_id The group id
         * @param {Array} shares A list of encrypted shares
         *
         * @returns {Array} A list of decrypted shares
         */
        var decrypt_group_shares = function(group_id, shares) {

            var decrypted_shares = [];
            for (var i = 0; i < shares.length; i++) {
                var decrypted_share = decrypt_group_share(group_id, shares[i]);
                decrypted_shares.push(decrypted_share);
            }

            return decrypted_shares;
        };

        /**
         * @ngdoc
         * @name psonocli.managerGroups#accept_membership
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Accepts a group membership request and decrypts the secrets so they can later be added to the datastore
         *
         * @param {uuid} membership_id The membership_id to accept
         *
         * @returns {promise} Returns the decrypted share
         */
        var accept_membership = function(membership_id) {

            var onSuccess = function(data){

                var group_id;
                var public_key;
                for (var i = 0; i < groups_cache.length; i++) {
                    if (groups_cache[i]['membership_id'] !== membership_id) {
                        continue;
                    }

                    group_id = groups_cache[i]['group_id'];
                    groups_cache[i]['accepted'] = true;
                    groups_cache[i]['secret_key'] = data.data.secret_key;
                    groups_cache[i]['secret_key_nonce'] = data.data.secret_key_nonce;
                    groups_cache[i]['secret_key_type'] = data.data.secret_key_type;
                    groups_cache[i]['private_key'] = data.data.private_key;
                    groups_cache[i]['private_key_nonce'] = data.data.private_key_nonce;
                    groups_cache[i]['private_key_type'] = data.data.private_key_type;

                    public_key = groups_cache[i]['public_key'];

                    delete(groups_cache[i]['share_right_grant']);
                    delete(groups_cache[i]['user_id']);
                    delete(groups_cache[i]['user_username']);

                    break;
                }

                return decrypt_group_shares(group_id, data.data.shares);
            };

            var onError = function() {
                //pass
            };

            return apiClient.accept_membership(managerBase.get_token(), managerBase.get_session_secret_key(), membership_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerGroups#decline_membership
         * @methodOf psonocli.managerGroups
         *
         * @description
         * Declines a group membership request
         *
         * @param {uuid} membership_id The membership_id to decline
         *
         * @returns {promise} Returns whether the declination was successful or not
         */
        var decline_membership = function(membership_id) {

            var onSuccess = function(data){
                return data.data;
            };

            var onError = function() {
                //pass
            };

            return apiClient.decline_membership(managerBase.get_token(), managerBase.get_session_secret_key(), membership_id)
                .then(onSuccess, onError);
        };

        itemBlueprint.register('get_group_secret_key', get_group_secret_key);

        return {
            get_group_secret_key: get_group_secret_key,
            get_group_private_key: get_group_private_key,
            decrypt_secret_key: decrypt_secret_key,
            read_group: read_group,
            read_groups: read_groups,
            create_group: create_group,
            update_group: update_group,
            delete_group: delete_group,
            read_group_rights: read_group_rights,
            get_outstanding_group_shares: get_outstanding_group_shares,
            create_membership: create_membership,
            update_membership: update_membership,
            delete_membership: delete_membership,
            decrypt_group_share: decrypt_group_share,
            decrypt_group_shares: decrypt_group_shares,
            accept_membership: accept_membership,
            decline_membership: decline_membership
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerGroups", ['$q', '$rootScope', 'apiClient', 'browserClient', 'storage',
        'helper', 'managerBase', 'managerDatastorePassword', 'managerShare', 'shareBlueprint',
        'itemBlueprint', 'cryptoLibrary', managerGroups]);

}(angular));