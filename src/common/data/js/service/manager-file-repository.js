(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerFileRepository
     * @requires $q
     * @requires psonocli.managerBase
     * @requires psonocli.apiClient
     * @requires psonocli.storage
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * managerFileRepository collects all functions to edit / update / create file repositories and to work with them.
     */

    var managerFileRepository = function($q, managerBase, apiClient, storage, cryptoLibrary) {

        /**
         * @ngdoc
         * @name psonocli.managerFileRepository#accept
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Accepts a file repository
         *
         * @param file_repository_right_id
         *
         * @returns {PromiseLike<T> | Promise<T> | *}
         */
        var accept = function(file_repository_right_id) {

            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function () {
                // pass
            };

            return apiClient.accept_file_repository_right(managerBase.get_token(),
                managerBase.get_session_secret_key(), file_repository_right_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileRepository#decline
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Declines a file repository
         *
         * @param file_repository_right_id
         *
         * @returns {PromiseLike<T> | Promise<T> | *}
         */
        var decline = function(file_repository_right_id) {

            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function () {
                // pass
            };

            return apiClient.decline_file_repository_right(managerBase.get_token(),
                managerBase.get_session_secret_key(), file_repository_right_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileRepository#create_file_repository_right
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Creates a file repository right for another user
         *
         * @param file_repository_id
         * @param user_id
         * @param read
         * @param write
         * @param grant
         *
         * @returns {PromiseLike<T> | Promise<T> | *}
         */
        var create_file_repository_right = function(file_repository_id, user_id, read, write, grant) {

            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function () {
                // pass
            };

            return apiClient.create_file_repository_right(managerBase.get_token(),
                managerBase.get_session_secret_key(), file_repository_id, user_id, read, write, grant)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileRepository#update_file_repository_right
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Updates a file repository right for another user
         *
         * @param file_repository_right_id
         * @param read
         * @param write
         * @param grant
         *
         * @returns {PromiseLike<T> | Promise<T> | *}
         */
        var update_file_repository_right = function(file_repository_right_id, read, write, grant) {

            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function () {
                // pass
            };

            return apiClient.update_file_repository_right(managerBase.get_token(),
                managerBase.get_session_secret_key(), file_repository_right_id, read, write, grant)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileRepository#delete_file_repository_right
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Deletes a file repository right for another user
         *
         * @param file_repository_right_id
         *
         * @returns {PromiseLike<T> | Promise<T> | *}
         */
        var delete_file_repository_right = function(file_repository_right_id) {

            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function () {
                // pass
            };

            return apiClient.delete_file_repository_right(managerBase.get_token(),
                managerBase.get_session_secret_key(), file_repository_right_id)
                .then(onSuccess, onError);
        };


        /**
         * @ngdoc
         * @name psonocli.managerFileRepository#get_possible_types
         * @methodOf psonocli.managerFileRepository
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
         * @name psonocli.managerFileRepository#read_file_repository
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Returns one file repositories
         *
         * @returns {promise} Promise with the file repositories
         */
        var read_file_repository = function(file_repository_id) {

            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function () {
                // pass
            };

            return apiClient.read_file_repository(managerBase.get_token(),
                managerBase.get_session_secret_key(), file_repository_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileRepository#read_file_repositories
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Returns all file repositories
         *
         * @returns {promise} Promise with the file repositories
         */
        var read_file_repositories = function() {

            var onSuccess = function (result) {
                return result.data.file_repositories;
            };
            var onError = function () {
                // pass
            };

            return apiClient.read_file_repository(managerBase.get_token(),
                managerBase.get_session_secret_key())
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileRepository#create_file_repository
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Creates an File Repository
         *
         * @param {string} title The title of the new file repository
         * @param {string} type The type of the new file repository
         * @param {string} [gcp_cloud_storage_bucket] (optional) The gcp cloud storage bucket
         * @param {string} [gcp_cloud_storage_json_key] (optional) The gcp cloud storage json key
         *
         * @returns {promise} Promise with the new id
         */
        var create_file_repository = function(title, type, gcp_cloud_storage_bucket, gcp_cloud_storage_json_key) {

            var onSuccess = function (result) {
                var file_repository_id = result.data['file_repository_id'];
                return {
                    'file_repository_id': file_repository_id
                }
            };
            var onError = function () {
                // pass
            };

            return apiClient.create_file_repository(
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
         * @name psonocli.managerFileRepository#update_file_repository
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Updates an File Repository
         *
         * @param {uuid} file_repository_id The id of the file repository
         * @param {string} title The title of the new file repository
         * @param {string} type The type of the new file repository
         * @param {string} [gcp_cloud_storage_bucket] (optional) The gcp cloud storage bucket
         * @param {string} [gcp_cloud_storage_json_key] (optional) The gcp cloud storage json key
         * @param {bool} active
         *
         * @returns {promise} Promise with the new id
         */
        var update_file_repository = function(file_repository_id, title, type, gcp_cloud_storage_bucket, gcp_cloud_storage_json_key, active) {

            return apiClient.update_file_repository(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                file_repository_id,
                title,
                type,
                gcp_cloud_storage_bucket,
                gcp_cloud_storage_json_key,
                active
            )
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileRepository#delete_file_repository
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Deletes an File Repository
         *
         * @param {uuid} file_repository_id The id of the file repository to delete
         *
         * @returns {promise} Promise
         */
        var delete_file_repository = function(file_repository_id) {


            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function (result) {
                // pass
            };

            return apiClient.delete_file_repository(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                file_repository_id
            )
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileRepository#file_repositories_disabled
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Returns weather the server allows the file repositories feature or not
         * By default it will return false (indicate enabled file repositories)
         */
        var file_repositories_disabled = function () {

            var server_info =  storage.find_key('config', 'server_info');

            if (server_info === null) {
                return true
            }
            if (!server_info.value.hasOwnProperty('compliance_disable_file_repositories')) {
                return false
            }

            return server_info.value['compliance_disable_file_repositories'];
        };


        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#filter_file_repositories
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Filters an array of file repositories
         *
         * @param {array} file_repositories Array of file repositories
         * @param {bool} require_read Determines whether read is required or not
         * @param {bool} require_write Determines whether write is required or not
         * @param {bool} require_active Determines whether active is required or not
         * @param {bool} require_accepted Determines whether accepted is required or not
         *
         * @returns {array} list of file_repositories that fulfill the filter criteria
         */
        var filter_file_repositories = function (file_repositories, require_read, require_write, require_active, require_accepted) {

            var filtered_file_repositories = [];

            for (var i = 0; i < file_repositories.length; i++) {
                if (require_read && !file_repositories[i]['read']) {
                    continue
                }
                if (require_write && !file_repositories[i]['write']) {
                    continue
                }
                if (require_active && !file_repositories[i]['active']) {
                    continue
                }
                if (require_accepted && !file_repositories[i]['accepted']) {
                    continue
                }

                filtered_file_repositories.push(file_repositories[i]);
            }

            return filtered_file_repositories;

        };


        return {
            accept: accept,
            create_file_repository_right: create_file_repository_right,
            update_file_repository_right : update_file_repository_right ,
            delete_file_repository_right: delete_file_repository_right,
            get_possible_types: get_possible_types,
            read_file_repository: read_file_repository,
            read_file_repositories: read_file_repositories,
            create_file_repository: create_file_repository,
            update_file_repository: update_file_repository,
            delete_file_repository: delete_file_repository,
            file_repositories_disabled: file_repositories_disabled,
            filter_file_repositories: filter_file_repositories
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerFileRepository", ['$q', 'managerBase', 'apiClient', 'storage', 'cryptoLibrary', managerFileRepository]);

}(angular));

