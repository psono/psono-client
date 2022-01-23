(function(angular, Papa) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerExport
     * @requires $q
     * @requires $window
     * @requires $timeout
     * @requires $translate
     * @requires psonocli.managerSecret
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.storage
     *
     * @description
     * Service to manage the export of datastores
     */

    var managerExport = function($q, $window, $timeout, $translate, managerSecret, managerDatastorePassword, storage) {

        var timeout = 0;
        
        var _exporter = [];

        activate();

        function activate() {
            $translate([
                'JSON_IMPORT_COMPATIBLE'
            ]).then(function (translations) {
                _exporter.push({
                    name: translations.JSON_IMPORT_COMPATIBLE,
                    value: 'json'
                });
                _exporter.push({
                    name: "CSV",
                    value: 'csv'
                });
            });
        }


        var registrations = {};

        /**
         * @ngdoc
         * @name psonocli.managerExport#on
         * @methodOf psonocli.managerExport
         *
         * @description
         * used to register functions for specific events
         *
         * @param {string} event The event to subscribe to
         * @param {function} func The callback function to subscribe
         */
        var on = function (event, func) {
            if (!registrations.hasOwnProperty(event)){
                registrations[event] = [];
            }

            registrations[event].push(func);
        };

        /**
         * @ngdoc
         * @name psonocli.managerExport#emit
         * @methodOf psonocli.managerExport
         *
         * @description
         * sends an event message to the export service
         *
         * @param {string} event The event to trigger
         * @param {*} data The payload data to send to the subscribed callback functions
         */
        var emit = function (event, data) {
            if (!registrations.hasOwnProperty(event)){
                return;
            }
            for (var i = registrations[event].length - 1; i >= 0; i--) {
                registrations[event][i](data);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerExport#export_disabled
         * @methodOf psonocli.managerExport
         *
         * @description
         * Returns weather the server allows the export feature or not
         * By default it will return false (indicate enabled export)
         */
        var export_disabled = function () {

            var server_info =  storage.find_key('config', 'server_info');

            if (server_info === null) {
                return true
            }
            if (!server_info.value.hasOwnProperty('compliance_disable_export')) {
                return false
            }

            return server_info.value['compliance_disable_export'];
        };

        /**
         * @ngdoc
         * @name psonocli.managerExport#download_export
         * @methodOf psonocli.managerExport
         *
         * @description
         * Handles the download of the actual export.json
         *
         * @param {string} data The data to download
         */
        var download_export = function (data, type) {
            var file_name = 'export.json';
            var data_type = 'data:attachment/json,';
            if (type === "csv") {
                file_name = 'export.csv';
                data_type = 'data:attachment/csv,';
            }
            var a = angular.element('<a></a>');
            a.attr('href', data_type + encodeURI(data).replace(/#/g, '%23'));
            a.attr('target', '_blank');
            a.attr('download', file_name);
            angular.element(document.body).append(a);
            a[0].click();
        };


        /**
         * @ngdoc
         * @name psonocli.managerExport#filter_datastore_export
         * @methodOf psonocli.managerExport
         *
         * @description
         * Filters the datastore export to reduce the size and remove unnecessary elements
         *
         * @param {object} folder The folder to filter
         *
         * @returns {*} filtered folder
         */
        var filter_datastore_export = function (folder) {
            var i;
            var p;

            var unwanted_folder_properties = [
                'id',
                'datastore_id',
                'parent_datastore_id',
                'share_index',
                'parent_share_id',
                'share_id',
                'path',
                'share_rights',
                'share_secret_key'
            ];

            var unwanted_item_properties = [
                'id',
                'datastore_id',
                'parent_datastore_id',
                'parent_share_id',
                'secret_id',
                'secret_key',
                'share_id',
                'path',
                'share_rights',
                'share_secret_key'
            ];

            // filter out unwanted folder properties
            for (p = 0; p < unwanted_folder_properties.length; p++){
                if (folder.hasOwnProperty(unwanted_folder_properties[p])) {
                    delete folder[unwanted_folder_properties[p]]
                }
            }

            // Delete folder attribute if its empty
            if (folder.hasOwnProperty('items')) {
                if (folder['items'].length === 0) {
                    delete folder['items'];
                }
            }

            // filter out unwanted item properties
            if (folder.hasOwnProperty('items')) {
                for (p = 0; p < unwanted_item_properties.length; p++) {
                    for (i = folder['items'].length - 1; i >= 0; i--) {
                        if (folder['items'][i].hasOwnProperty(unwanted_item_properties[p])) {
                            delete folder['items'][i][unwanted_item_properties[p]]
                        }
                    }
                }
            }

            // Delete folder attribute if its empty
            if (folder.hasOwnProperty('folders')) {
                if (folder['folders'].length === 0) {
                    delete folder['folders'];
                }
            }
            // folder foders recursive
            if (folder.hasOwnProperty('folders')) {
                for (i = folder['folders'].length -1; i >= 0; i--) {
                    folder['folders'][i] = filter_datastore_export(folder['folders'][i]);
                }
            }

            return folder;
        };


        /**
         * @ngdoc
         * @name psonocli.managerExport#compose_export
         * @methodOf psonocli.managerExport
         *
         * @description
         * compose the export structure
         *
         * @param {object} data The datastore data to compose
         * @param {string} type The selected type of the export
         *
         * @returns {*} filtered folder
         */
        var compose_export = function(data, type) {
                
            function csv_helper (data, path) {
                var i;
                if (data.hasOwnProperty('folders')) {
                    for (i = 0; i < data.folders.length; i++) {
                        csv_helper(data.folders[i], path + data.folders[i].name + '\\')
                    }
                }
                if (data.hasOwnProperty('items')) {
                    for (i = 0; i < data.items.length; i++) {
                        data.items[i]['path'] = path
                        if (data.items[i].type === 'environment_variables' && data.items[i].hasOwnProperty("environment_variables_variables")) {
                            data.items[i]["environment_variables_variables"] = JSON.stringify(data.items[i]["environment_variables_variables"]);
                        }
                        helper_data.push(data.items[i])
                    }
                }
            }
            
            if (type === 'json') {
                return JSON.stringify(data);
            } else if (type === 'csv') {
                
                var helper_data = [{
                    'path': 'path',
                    'type': 'type',
                    'callback_user': 'callback_user',
                    'callback_url': 'callback_url',
                    'callback_pass': 'callback_pass',
                    'urlfilter': 'urlfilter',
                    'website_password_title': 'website_password_title',
                    'website_password_url': 'website_password_url',
                    'website_password_username': 'website_password_username',
                    'website_password_password': 'website_password_password',
                    'website_password_notes': 'website_password_notes',
                    'website_password_auto_submit': 'website_password_auto_submit',
                    'website_password_url_filter': 'website_password_url_filter',
                    'application_password_title': 'application_password_title',
                    'application_password_username': 'application_password_username',
                    'application_password_password': 'application_password_password',
                    'application_password_notes': 'application_password_notes',
                    'totp_title': 'totp_title',
                    'totp_period': 'totp_period',
                    'totp_algorithm': 'totp_algorithm',
                    'totp_digits': 'totp_digits',
                    'totp_code': 'totp_code',
                    'note_title': 'note_title',
                    'note_notes': 'note_notes',
                    'environment_variables_title': 'environment_variables_title',
                    'environment_variables_variables': 'environment_variables_variables',
                    'environment_variables_notes': 'environment_variables_notes',
                    'mail_gpg_own_key_title': 'mail_gpg_own_key_title',
                    'mail_gpg_own_key_email': 'mail_gpg_own_key_email',
                    'mail_gpg_own_key_name': 'mail_gpg_own_key_name',
                    'mail_gpg_own_key_public': 'mail_gpg_own_key_public',
                    'mail_gpg_own_key_private': 'mail_gpg_own_key_private',
                    'bookmark_title': 'bookmark_title',
                    'bookmark_url': 'bookmark_url',
                    'bookmark_notes': 'bookmark_notes',
                    'bookmark_url_filter': 'bookmark_url_filter',
                }];
                csv_helper(data, '\\')
                return Papa.unparse(helper_data, {
                    header: false,
                })
            } else {
                return data;
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerExport#get_all_secrets
         * @methodOf psonocli.managerExport
         *
         * @description
         * Requests all secrets in our datastore and fills the datastore with the content
         *
         * @param {object} datastore The datastore structure with secrets
         *
         * @returns {*} The datastore structure where all secrets have been filled
         */
        var get_all_secrets = function (datastore) {

            var open_secret_requests = 0;

            var resolver;

            var handle_items = function (items) {

                var fill_secret = function (item, secret_id, secret_key) {

                    var onSuccess = function(data) {

                        for (var property in data) {
                            if (! data.hasOwnProperty(property)) {
                                continue;
                            }
                            item[property] = data[property];
                        }

                        open_secret_requests = open_secret_requests - 1;
                        emit('get-secret-complete', {});
                        if (open_secret_requests === 0) {
                            resolver(datastore);
                        }
                    };

                    var onError = function() {
                        open_secret_requests = open_secret_requests - 1;
                    };

                    open_secret_requests = open_secret_requests + 1;
                    emit('get-secret-started', {});

                    timeout = timeout + 50;
                    $timeout(function(){
                        managerSecret.read_secret(secret_id, secret_key)
                            .then(onSuccess, onError);
                    }, timeout);

                };
                for (var i = 0; i < items.length; i++) {
                    if(items[i].hasOwnProperty('secret_id') && items[i].hasOwnProperty('secret_key')) {

                        fill_secret(items[i], items[i]['secret_id'], items[i]['secret_key'])
                    }
                }
            };

            var handle_folders = function (folders) {

                for (var i = 0; i < folders.length; i++) {

                    if (folders[i].hasOwnProperty('folders')) {
                        handle_folders(folders[i]['folders']);
                    }

                    if (folders[i].hasOwnProperty('items')) {
                        handle_items(folders[i]['items']);

                    }
                }
            };

            return $q(function(resolve, reject) {
                resolver = resolve;
                timeout = 0;

                if (datastore.hasOwnProperty('folders')) {
                    handle_folders(datastore['folders']);
                }

                if (datastore.hasOwnProperty('items')) {
                    handle_items(datastore['items']);
                }

                if (open_secret_requests === 0) {
                    resolve(datastore);
                }
            });
        };

        /**
         * @ngdoc
         * @name psonocli.managerExport#get_exporter
         * @methodOf psonocli.managerExport
         *
         * @description
         * Returns a list with all possible exporter
         *
         * @returns {[]} List with all possible exporters
         */
        var get_exporter = function() {
            return _exporter;

        };

        /**
         * @ngdoc
         * @name psonocli.managerExport#fetch_datastore
         * @methodOf psonocli.managerExport
         *
         * @description
         * Fetches the datastore with all secrets ready to download or analyze
         *
         * @param {string} type The selected type of the export
         * @param {uuid} id The id of the datastore one wants to download
         *
         * @returns {promise} Returns a promise with the exportable datastore content
         */
        var fetch_datastore = function(type, id) {

            emit('export-started', {});

            return managerDatastorePassword.get_password_datastore(id)
                .then(get_all_secrets)
                .then(filter_datastore_export)
                .then(function(data){
                    emit('export-complete', {});
                    return compose_export(data, type);
                });
        };

        /**
         * @ngdoc
         * @name psonocli.managerExport#export_datastore
         * @methodOf psonocli.managerExport
         *
         * @description
         * Returns a copy of the datastore
         *
         * @param {string} type The selected type of the export
         *
         * @returns {promise} Returns a promise once the export is successful
         */
        var export_datastore = function(type) {

            return fetch_datastore(type)
                .then(function(data){
                    return download_export(data, type);
                })
                .then(function() {
                    return {msgs: ['EXPORT_SUCCESSFUL']}
                });

        };

        return {
            on:on,
            emit:emit,
            export_disabled: export_disabled,
            get_exporter:get_exporter,
            fetch_datastore:fetch_datastore,
            export_datastore:export_datastore,
            get_all_secrets:get_all_secrets
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerExport", ['$q', '$window', '$timeout', '$translate', 'managerSecret', 'managerDatastorePassword', 'storage', managerExport]);

}(angular, Papa));
