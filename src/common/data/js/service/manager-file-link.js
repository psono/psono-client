(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerFileLink
     * @requires $q
     * @requires psonocli.managerBase
     * @requires psonocli.apiClient
     *
     * @description
     * Service to handle all file links related tasks
     */

    var managerFileLink = function($q, managerBase, apiClient) {

        /**
         * @ngdoc
         * @name psonocli.managerFileLink#move_file_links
         * @methodOf psonocli.managerFileLink
         *
         * @description
         * Searches a datastore object and moves all links to the
         *
         * @param {object} datastore The datastore object
         * @param {uuid|undefined} [new_parent_share_id=null] (optional) New parent share ID, necessary if no new_parent_datastore_id is provided
         * @param {uuid|undefined} [new_parent_datastore_id=null] (optional) New datastore ID, necessary if no new_parent_share_id is provided
         *
         * @returns {promise} Returns promise with the status of the move
         */
        var move_file_links = function(datastore, new_parent_share_id, new_parent_datastore_id) {
            var i;
            for (i = 0; datastore.hasOwnProperty('folders') && i < datastore['folders'].length; i++) {
                move_file_links(datastore['folders'][i], new_parent_share_id, new_parent_datastore_id)
            }
            for (i = 0; datastore.hasOwnProperty('items') && i < datastore['items'].length; i++) {
                if (datastore['items'][i].hasOwnProperty('file_id')) {
                    move_file_link(datastore['items'][i]['id'], new_parent_share_id, new_parent_datastore_id)
                }
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileLink#move_file_link
         * @methodOf psonocli.managerFileLink
         *
         * @description
         * Moves a file to a new parent share or datastore
         *
         * @param {uuid} link_id The id of the link that should be moved
         * @param {uuid|undefined} [new_parent_share_id=null] (optional) New parent share ID, necessary if no new_parent_datastore_id is provided
         * @param {uuid|undefined} [new_parent_datastore_id=null] (optional) New datastore ID, necessary if no new_parent_share_id is provided
         *
         * @returns {promise} Returns promise with the status of the move
         */
        var move_file_link = function(link_id, new_parent_share_id, new_parent_datastore_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                // pass
            };

            return apiClient.move_file_link(managerBase.get_token(),
                managerBase.get_session_secret_key(), link_id, new_parent_share_id, new_parent_datastore_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileLink#delete_file_link
         * @methodOf psonocli.managerFileLink
         *
         * @description
         * Deletes a link to a file
         *
         * @param {uuid} link_id The id of the link that should be deleted
         *
         * @returns {promise} Returns a promise with the status of the delete operation
         */
        var delete_file_link = function(link_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                // pass
            };

            return apiClient.delete_file_link(managerBase.get_token(),
                managerBase.get_session_secret_key(), link_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileLink#on_file_moved
         * @methodOf psonocli.managerFileLink
         *
         * @description
         * triggered once a file moved. handles the update of links
         *
         * @param {uuid} link_id The id of the link
         * @param {object} parent The new parent (share or datastore)
         *
         * @returns {promise} Returns promise with the status of the move
         */
        var on_file_moved = function(link_id, parent) {
            var new_parent_share_id,
                new_parent_datastore_id;

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

            return move_file_link(link_id, new_parent_share_id, new_parent_datastore_id);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileLink#on_file_deleted
         * @methodOf psonocli.managerFileLink
         *
         * @description
         * triggered once a file is deleted.
         *
         * @param {uuid} link_id The link_id to delete
         *
         * @returns {promise} Returns a promise with the status of the delete operation
         */
        var on_file_deleted = function (link_id) {
            return delete_file_link(link_id);
        };

        return {
            move_file_links: move_file_links,
            move_file_link: move_file_link,
            delete_file_link: delete_file_link,
            on_file_moved: on_file_moved,
            on_file_deleted: on_file_deleted
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerFileLink", ['$q', 'managerBase', 'apiClient', managerFileLink]);

}(angular));