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
     * managerFileRepository collects all functions to edit / update / create file repositorys and to work with them.
     */

    var managerFileRepository = function($q, managerBase, apiClient, storage, cryptoLibrary) {


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
         * Returns one file repositorys
         *
         * @returns {promise} Promise with the file repositorys
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
         * @name psonocli.managerFileRepository#read_file_repositorys
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Returns all file repositorys
         *
         * @returns {promise} Promise with the file repositorys
         */
        var read_file_repositorys = function() {

            var onSuccess = function (result) {
                return result.data.file_repositorys;
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
         * @name psonocli.managerFileRepository#file_repositorys_disabled
         * @methodOf psonocli.managerFileRepository
         *
         * @description
         * Returns weather the server allows the file repositorys feature or not
         * By default it will return false (indicate enabled file repositorys)
         */
        var file_repositorys_disabled = function () {

            var server_info =  storage.find_key('config', 'server_info');

            if (server_info === null) {
                return true
            }
            if (!server_info.value.hasOwnProperty('compliance_disable_file_repositorys')) {
                return false
            }

            return server_info.value['compliance_disable_file_repositorys'];
        };


        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#filter_file_repositorys
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Filters an array of file repositorys
         *
         * @param {array} file_repositorys Array of file repositorys
         * @param {bool} require_read Determines whether read is required or not
         * @param {bool} require_write Determines whether write is required or not
         *
         * @returns {array} list of file_repositorys that fulfill the filter criteria
         */
        var filter_file_repositorys = function (file_repositorys, require_read, require_write, require_active) {

            var filtered_file_repositorys = [];

            for (var i = 0; i < file_repositorys.length; i++) {
                if (require_read && !file_repositorys[i]['read']) {
                    continue
                }
                if (require_write && !file_repositorys[i]['write']) {
                    continue
                }
                if (require_active && !file_repositorys[i]['active']) {
                    continue
                }

                filtered_file_repositorys.push(file_repositorys[i]);
            }

            return filtered_file_repositorys;

        };


        return {
            get_possible_types: get_possible_types,
            read_file_repository: read_file_repository,
            read_file_repositorys: read_file_repositorys,
            create_file_repository: create_file_repository,
            update_file_repository: update_file_repository,
            delete_file_repository: delete_file_repository,
            file_repositorys_disabled: file_repositorys_disabled,
            filter_file_repositorys: filter_file_repositorys
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerFileRepository", ['$q', 'managerBase', 'apiClient', 'storage', 'cryptoLibrary', managerFileRepository]);

}(angular));

