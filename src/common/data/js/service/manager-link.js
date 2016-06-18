(function(angular) {
    'use strict';

    var managerLink = function(managerBase, apiClient) {

        /**
         * Create a link between a share and a datastore or another (parent-)share
         *
         * @param {uuid} link_id - the link id
         * @param {uuid} share_id - the share ID
         * @param {uuid} [parent_share_id=null] - optional parent share ID, necessary if no datastore_id is provided
         * @param {uuid} [datastore_id=null] - optional datastore ID, necessary if no parent_share_id is provided
         * @returns {promise}
         */
        var create_link = function (link_id, share_id, parent_share_id, datastore_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {
                return result;
            };

            return apiClient.create_link(managerBase.find_one_nolimit('config', 'user_token'), link_id, share_id, parent_share_id, datastore_id)
                .then(onSuccess, onError);
        };

        /**
         * Moves a link between a share and a datastore or another (parent-)share
         *
         * @param {uuid} link_id - the link id
         * @param {uuid} share_id - the share ID
         * @param {uuid} [new_parent_share_id=null] - optional new parent share ID, necessary if no new_datastore_id is provided
         * @param {uuid} [new_datastore_id=null] - optional new datastore ID, necessary if no new_parent_share_id is provided
         * @returns {promise}
         */
        var move_link = function (link_id, share_id, new_parent_share_id, new_datastore_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {
                return result;
            };

            return apiClient.move_link(managerBase.find_one_nolimit('config', 'user_token'), link_id, share_id, new_parent_share_id, new_datastore_id)
                .then(onSuccess, onError);
        };

        /**
         * Delete a link
         *
         * @param link_id
         * @returns {promise}
         */
        var delete_link = function (link_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {
                return result;
            };

            return apiClient.create_link(managerBase.find_one_nolimit('config', 'user_token'), link_id)
                .then(onSuccess, onError);
        };

        return {
            create_link: create_link,
            move_link: move_link,
            delete_link: delete_link
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("managerLink", ['managerBase', 'apiClient', managerLink]);

}(angular));