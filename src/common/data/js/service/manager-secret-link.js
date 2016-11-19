(function(angular) {
    'use strict';

    var managerSecretLink = function(managerBase, apiClient) {

        /**
         * Moves a secret to a new parent share or datastore
         *
         * @param {uuid} link_id - the link id
         * @param {uuid} [new_parent_share_id=null] - optional new parent share ID, necessary if no new_parent_datastore_id is provided
         * @param {uuid} [new_parent_datastore_id=null] - optional new datastore ID, necessary if no new_parent_share_id is provided
         *
         * @returns {promise}
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
         * Deletes a secret
         *
         * @param {uuid} link_id - the link id
         *
         * @returns {promise}
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
         * triggered once a secret moved. handles the update of links
         *
         * @param link_id
         * @param parent_share
         */
        var on_secret_moved = function(link_id, parent_share) {
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

            return move_secret_link(link_id, new_parent_share_id, new_parent_datastore_id);
        };

        /**
         * triggered once a secret is deleted.
         *
         * @param {uuid} link_id the link_id to delete
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
    app.factory("managerSecretLink", ['managerBase', 'apiClient', managerSecretLink]);

}(angular));