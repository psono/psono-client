(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerSecretLink
     * @requires $q
     * @requires psonocli.managerBase
     * @requires psonocli.apiClient
     *
     * @description
     * Service to handle all secret links related tasks
     */

    var managerSecretLink = function($q, managerBase, apiClient) {

        /**
         * @ngdoc
         * @name psonocli.managerSecretLink#move_secret_link
         * @methodOf psonocli.managerSecretLink
         *
         * @description
         * Moves a secret to a new parent share or datastore
         *
         * @param {uuid} link_id The id of the link that should be moved
         * @param {uuid} [new_parent_share_id=null] (optional) New parent share ID, necessary if no new_parent_datastore_id is provided
         * @param {uuid} [new_parent_datastore_id=null] (optional) New datastore ID, necessary if no new_parent_share_id is provided
         *
         * @returns {promise} Returns promise with the status of the move
         */
        var move_secret_link = function(link_id, new_parent_share_id, new_parent_datastore_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                // pass
            };

            return apiClient.move_secret_link(managerBase.get_token(),
                managerBase.get_session_secret_key(), link_id, new_parent_share_id, new_parent_datastore_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecretLink#delete_secret_link
         * @methodOf psonocli.managerSecretLink
         *
         * @description
         * Deletes a link to a secret
         *
         * @param {uuid} link_id The id of the link that should be deleted
         *
         * @returns {promise} Returns a promise with the status of the delete operation
         */
        var delete_secret_link = function(link_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                // pass
            };

            return apiClient.delete_secret_link(managerBase.get_token(),
                managerBase.get_session_secret_key(), link_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecretLink#on_secret_moved
         * @methodOf psonocli.managerSecretLink
         *
         * @description
         * triggered once a secret moved. handles the update of links
         *
         * @param {uuid} link_id The id of the link
         * @param {object} parent The new parent (share or datastore)
         *
         * @returns {promise} Returns promise with the status of the move
         */
        var on_secret_moved = function(link_id, parent) {
            var new_parent_share_id = null,
                new_parent_datastore_id = null;

            if (parent.hasOwnProperty("share_id")) {
                new_parent_share_id = parent.share_id;
            } else if(parent.hasOwnProperty("datastore_id")) {
                new_parent_datastore_id = parent.datastore_id;
            } else {
                return $q.reject({
                    response:"error",
                    error_data: 'Could not determine if its a share or datastore parent'
                });
            }

            return move_secret_link(link_id, new_parent_share_id, new_parent_datastore_id);
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecretLink#on_secret_deleted
         * @methodOf psonocli.managerSecretLink
         *
         * @description
         * triggered once a secret is deleted.
         *
         * @param {uuid} link_id The link_id to delete
         *
         * @returns {promise} Returns a promise with the status of the delete operation
         */
        var on_secret_deleted = function (link_id) {
            return delete_secret_link(link_id);
        };

        return {
            move_secret_link: move_secret_link,
            delete_secret_link: delete_secret_link,
            on_secret_moved: on_secret_moved,
            on_secret_deleted: on_secret_deleted
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerSecretLink", ['$q', 'managerBase', 'apiClient', managerSecretLink]);

}(angular));