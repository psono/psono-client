(function(angular) {
    'use strict';

    var managerShareLink = function(managerBase, apiClient) {

        /**
         * Create a link between a share and a datastore or another (parent-)share
         *
         * @param {uuid} link_id - the link id
         * @param {uuid} share_id - the share ID
         * @param {uuid} [parent_share_id=null] - optional parent share ID, necessary if no datastore_id is provided
         * @param {uuid} [parent_datastore_id=null] - optional datastore ID, necessary if no parent_share_id is provided
         * @returns {promise}
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
         * Moves a link between a share and a datastore or another (parent-)share
         *
         * @param {uuid} link_id - the link id
         * @param {uuid} [new_parent_share_id=null] - optional new parent share ID, necessary if no new_datastore_id is provided
         * @param {uuid} [new_parent_datastore_id=null] - optional new datastore ID, necessary if no new_parent_share_id is provided
         * @returns {promise}
         */
        var move_share_link = function (link_id, new_parent_share_id, new_parent_datastore_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {
                return result;
            };

            return apiClient.move_share_link(managerBase.get_token(),
                managerBase.find_one_nolimit('config', 'session_secret_key'), link_id, new_parent_share_id, new_parent_datastore_id)
                .then(onSuccess, onError);
        };

        /**
         * Delete a link
         *
         * @param link_id
         * @returns {promise}
         */
        var delete_share_link = function (link_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {
                return result;
            };

            return apiClient.delete_share_link(managerBase.get_token(),
                managerBase.find_one_nolimit('config', 'session_secret_key'), link_id)
                .then(onSuccess, onError);
        };

        /**
         * triggered once a share moved. handles the update of links
         *
         * @param link_id
         * @param parent_share
         */
        var on_share_moved = function(link_id, parent_share) {
            var new_parent_share_id = null,
                new_parent_datastore_id = null;

            if (parent_share.hasOwnProperty("share_id")) {
                new_parent_share_id = parent_share.share_id;
            } else if(parent_share.hasOwnProperty("datastore_id")) {
                new_parent_datastore_id = parent_share.datastore_id;
            } else {
                console.log("error, couldn't find a share_id nor a datastore_id");
                console.log(parent);
            }

            return move_share_link(link_id, new_parent_share_id, new_parent_datastore_id);
        };

        /**
         * triggered once a share is deleted.
         *
         * @param link_id the link_id to delete
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
    app.factory("managerShareLink", ['managerBase', 'apiClient', managerShareLink]);

}(angular));