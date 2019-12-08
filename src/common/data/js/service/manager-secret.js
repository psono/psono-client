(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerSecret
     * @requires $q
     * @requires $rootScope
     * @requires $uibModal
     * @requires psonocli.managerBase
     * @requires psonocli.apiClient
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.itemBlueprint
     * @requires psonocli.browserClient
     * @requires psonocli.offlineCache
     *
     * @description
     * Service to handle all secret related tasks
     */

    var managerSecret = function($q, $rootScope, $uibModal, managerBase, apiClient, cryptoLibrary,
                           itemBlueprint, browserClient, offlineCache) {

        /**
         * @ngdoc
         * @name psonocli.managerSecret#create_secret
         * @methodOf psonocli.managerSecret
         *
         * @description
         * Encrypts the content and creates a new secret out of it.
         *
         * @param {object} content The content of the new secret
         * @param {uuid} link_id the local id of the share in the data structure
         * @param {uuid|undefined} [parent_datastore_id] (optional) The id of the parent datastore, may be left empty if the share resides in a share
         * @param {uuid|undefined} [parent_share_id] (optional) The id of the parent share, may be left empty if the share resides in the datastore
         * @param {string} callback_url The callback ULR
         * @param {string} callback_user The callback user
         * @param {string} callback_pass The callback password
         *
         * @returns {promise} Returns a promise with the new secret_id
         */
        var create_secret = function (content, link_id, parent_datastore_id, parent_share_id, callback_url, callback_user, callback_pass) {
            var secret_key = cryptoLibrary.generate_secret_key();

            var json_content = JSON.stringify(content);

            var c = cryptoLibrary.encrypt_data(json_content, secret_key);

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {secret_id: content.data.secret_id, secret_key: secret_key};
            };

            return apiClient.create_secret(managerBase.get_token(),
                managerBase.get_session_secret_key(), c.text, c.nonce, link_id, parent_datastore_id, parent_share_id, callback_url, callback_user, callback_pass)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecret#read_secret
         * @methodOf psonocli.managerSecret
         *
         * @description
         * Reads a secret and decrypts it. Returns the decrypted object
         *
         * @param {uuid} secret_id The secret id one wants to fetch
         * @param {string} secret_key The secret key to decrypt the content
         * @param {boolean|undefined} [synchronous] (optional) Synchronous or Asynchronous
         *
         * @returns {promise} Returns a promise withe decrypted content of the secret
         */
        var read_secret = function(secret_id, secret_key, synchronous) {
            var onError = function(result) {
                return $q.reject(result)
            };

            var onSuccess = function(content) {
                var secret = JSON.parse(cryptoLibrary.decrypt_data(content.data.data, content.data.data_nonce, secret_key));
                secret['create_date'] = content.data['create_date'];
                secret['write_date'] = content.data['write_date'];
                secret['callback_url'] = content.data['callback_url'];
                secret['callback_user'] = content.data['callback_user'];
                secret['callback_pass'] = content.data['callback_pass'];
                return secret;
            };

            if (synchronous) {
                return onSuccess(
                    apiClient.read_secret(managerBase.get_token(),managerBase.get_session_secret_key(), secret_id, synchronous)
                )
            } else {
                return apiClient.read_secret(managerBase.get_token(),
                    managerBase.get_session_secret_key(), secret_id, synchronous)
                    .then(onSuccess, onError);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecret#write_secret
         * @methodOf psonocli.managerSecret
         *
         * @description
         * Encrypts some content and updates a secret with it. returns the secret id
         *
         * @param {uuid} secret_id The id of the secret
         * @param {string} secret_key The secret key of the secret
         * @param {object} content The new content for the given secret
         * @param {string} callback_url The callback ULR
         * @param {string} callback_user The callback user
         * @param {string} callback_pass The callback password
         *
         * @returns {promise} Returns a promise with the secret id
         */
        var write_secret = function(secret_id, secret_key, content, callback_url, callback_user, callback_pass) {

            var json_content = JSON.stringify(content);

            var c = cryptoLibrary.encrypt_data(json_content, secret_key);

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {secret_id: content.data.secret_id};
            };

            return apiClient.write_secret(managerBase.get_token(),
                managerBase.get_session_secret_key(), secret_id, c.text, c.nonce, callback_url, callback_user, callback_pass)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecret#redirect_secret
         * @methodOf psonocli.managerSecret
         *
         * @description
         * Fetches and decrypts a secret and initiates the redirect for the secret
         *
         * @param {string} type The type of the secret
         * @param {uuid} secret_id The id of the secret to read
         */
        var redirect_secret = function(type, secret_id) {

            function redirect() {

                var secret_key = managerBase.find_key_nolimit('datastore-password-leafs', secret_id);

                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(decrypted_secret) {

                    var msg = itemBlueprint.blueprint_msg_before_open_secret(type, decrypted_secret);
                    if (typeof(msg) !== 'undefined') {
                        browserClient.emit_sec(msg.key, msg.content);
                    }

                    itemBlueprint.blueprint_on_open_secret(type, secret_id, decrypted_secret);
                };

                read_secret(secret_id, secret_key)
                    .then(onSuccess, onError);
            }

            if (!offlineCache.is_active() || !offlineCache.is_locked()) {

                redirect()
            } else {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/unlock-offline-cache.html',
                    controller: 'ModalUnlockOfflineCacheCtrl',
                    backdrop: 'static',
                    resolve: {
                    }
                });

                modalInstance.result.then(function () {
                    // pass, will be catched later with the on_set_encryption_key event
                }, function () {
                    $rootScope.$broadcast('force_logout', '');
                });

                offlineCache.on_set_encryption_key(function() {
                    modalInstance.close();
                    redirect();
                });
            }

        };
        /**
         * @ngdoc
         * @name psonocli.managerSecret#on_item_click
         * @methodOf psonocli.managerSecret
         *
         * @description
         * Handles item clicks and triggers behaviour
         *
         * @param {object} item The item one has clicked on
         */
        var on_item_click = function(item) {
            if (item.hasOwnProperty("urlfilter") && item['urlfilter'] !== '' && itemBlueprint.blueprint_has_on_click_new_tab(item.type)) {
                browserClient.open_tab('open-secret.html#!/secret/'+item.type+'/'+item.secret_id).then(function (window) {
                    window.psono_offline_cache_encryption_key = offlineCache.get_encryption_key();
                });
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#copy_username
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Copies the username of a given secret to the clipboard
         *
         * @param {object} item The item of which we want to load the username into our clipboard
         */
        var copy_username = function(item) {

            var secret_key = managerBase.find_key_nolimit('datastore-password-leafs', item.secret_id);

            var decrypted_secret = read_secret(item.secret_id, secret_key, true);
            browserClient.copy_to_clipboard(decrypted_secret['website_password_username']);

        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#copy_password
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Copies the password of a given secret to the clipboard
         *
         * @param {object} item The item of which we want to load the password into our clipboard
         */
        var copy_password = function(item) {

            var secret_key = managerBase.find_key_nolimit('datastore-password-leafs', item.secret_id);

            var decrypted_secret = read_secret(item.secret_id, secret_key, true);
            browserClient.copy_to_clipboard(decrypted_secret['website_password_password']);
        };

        // registrations

        itemBlueprint.register('copy_username', copy_username);
        itemBlueprint.register('copy_password', copy_password);

        return {
            create_secret: create_secret,
            read_secret: read_secret,
            write_secret: write_secret,
            redirect_secret: redirect_secret,
            on_item_click: on_item_click,
            copy_username: copy_username,
            copy_password: copy_password
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerSecret", ['$q', '$rootScope', '$uibModal', 'managerBase', 'apiClient', 'cryptoLibrary',
        'itemBlueprint', 'browserClient', 'offlineCache', managerSecret]);

}(angular));