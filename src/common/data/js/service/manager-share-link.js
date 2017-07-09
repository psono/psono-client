(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerShareLink
     * @requires $q
     * @requires psonocli.managerBase
     * @requires psonocli.apiClient
     *
     * @description
     * Service to handle all share links related tasks
     */

    var managerShareLink = function($q, managerBase, apiClient) {

        /**
         * @ngdoc
         * @name psonocli.managerShareLink#create_share_link
         * @methodOf psonocli.managerShareLink
         *
         * @description
         * Create a link between a share and a datastore or another (parent-)share
         *
         * @param {uuid} link_id the link id
         * @param {uuid} share_id the share ID
         * @param {uuid|undefined} [parent_share_id=null] (optional) parent share ID, necessary if no datastore_id is provided
         * @param {uuid|undefined} [parent_datastore_id=null] (optional) datastore ID, necessary if no parent_share_id is provided
         *
         * @returns {promise} Returns a promise withe the new share link id
         */
        var create_share_link = function (link_id, share_id, parent_share_id, parent_datastore_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {
                return result;
            };

            return apiClient.create_share_link(managerBase.get_token(),
                managerBase.get_session_secret_key(), link_id, share_id, parent_share_id, parent_datastore_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShareLink#move_share_link
         * @methodOf psonocli.managerShareLink
         *
         * @description
         * Moves a link between a share and a datastore or another (parent-)share
         *
         * @param {uuid} link_id The link id
         * @param {uuid|undefined} [new_parent_share_id=null] (optional) new parent share ID, necessary if no new_datastore_id is provided
         * @param {uuid|undefined} [new_parent_datastore_id=null] (optional) new datastore ID, necessary if no new_parent_share_id is provided
         *
         * @returns {promise} Returns a promise with the status of the move
         */
        var move_share_link = function (link_id, new_parent_share_id, new_parent_datastore_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {
                return result;
            };

            return apiClient.move_share_link(managerBase.get_token(),
                managerBase.get_session_secret_key(), link_id, new_parent_share_id, new_parent_datastore_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShareLink#delete_share_link
         * @methodOf psonocli.managerShareLink
         *
         * @description
         * Delete a share link
         *
         * @param {uuid} link_id The link id one wants to delete
         * @returns {promise} Returns a promise with the status of the delete operation
         */
        var delete_share_link = function (link_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {
                return result;
            };

            return apiClient.delete_share_link(managerBase.get_token(),
                managerBase.get_session_secret_key(), link_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShareLink#delete_share_link
         * @methodOf psonocli.managerShareLink
         *
         * @description
         * triggered once a share moved. handles the update of links
         *
         * @param {uuid} link_id The link id that has moved
         * @param {TreeObject} parent The parent (either a share or a datastore)
         *
         * @returns {promise} Returns a promise with the status of the move
         */
        var on_share_moved = function(link_id, parent) {
            var new_parent_share_id = null,
                new_parent_datastore_id = null;

            if (parent.hasOwnProperty("share_id")) {
                new_parent_share_id = parent.share_id;
            } else if(parent.hasOwnProperty("datastore_id")) {
                new_parent_datastore_id = parent.datastore_id;
            } else {
                return $q.reject({
                    response: "error",
                    error_data: 'Could not determine if its a share or datastore parent'
                });
            }

            return move_share_link(link_id, new_parent_share_id, new_parent_datastore_id);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShareLink#on_share_deleted
         * @methodOf psonocli.managerShareLink
         *
         * @description
         * triggered once a share is deleted.
         *
         * @param {uuid} link_id the link_id to delete
         */
        var on_share_deleted = function (link_id) {
            return delete_share_link(link_id);
        };

        return {
            create_share_link: create_share_link,
            move_share_link: move_share_link,
            delete_share_link: delete_share_link,
            on_share_moved: on_share_moved,
            on_share_deleted: on_share_deleted
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerShareLink", ['$q', 'managerBase', 'apiClient', managerShareLink]);

}(angular));