(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerImport
     * @requires $q
     * @requires $window
     * @requires $timeout
     * @requires psonocli.managerSecret
     * @requires psonocli.managerDatastorePassword
     *
     * @description
     * Service to manage the export of datastores
     */

    var managerImport = function($q, $window, $timeout, managerSecret, managerDatastorePassword) {


        var _importer = {};
        var registrations = {};

        /**
         * @ngdoc
         * @name psonocli.managerImport#on
         * @methodOf psonocli.managerImport
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
         * @name psonocli.managerImport#emit
         * @methodOf psonocli.managerImport
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
         * @name psonocli.managerImport#register_importer
         * @methodOf psonocli.managerImport
         *
         * @description
         * used to register possible parsers importer
         *
         * @param {string} importer_code The parser code to register
         * @param {*} importer The parser to register
         */
        var register_importer = function (importer_code, importer) {
            if (_importer.hasOwnProperty(importer_code)){
                throw new Error("Parser already registered");
            }

            _importer[importer_code] = importer;
        };

        /**
         * @ngdoc
         * @name psonocli.managerImport#get_parser
         * @methodOf psonocli.managerImport
         *
         * @description
         * Searches all possible parsers for the parser of this type
         *
         * @param {string} type
         *
         * @returns {function|null} returns the parser or null
         */
        var get_parser = function(type) {

            if (!_importer.hasOwnProperty(type)) {
                return null;
            }

            return _importer[type]['parser'];
        };

        /**
         * @ngdoc
         * @name psonocli.managerImport#parse_export
         * @methodOf psonocli.managerImport
         *
         * @description
         * Parse the raw input and returns a data structure with folder and items that we can import
         *
         * @param {string} data
         *
         * @returns {*} Returns a tree structure with folders and items
         */
        var parse_export = function(data) {
            var parse = get_parser(data['type']);
            if (parse === null) {
                return $q.reject({errors: ['Parser not found.']})
            }

            var parsed_data = parse(data['data']);
            if (parsed_data === null) {
                return $q.reject({errors: ['File format wrong.']})
            }

            data['data'] = parsed_data;

            return data;
        };

        /**
         * @ngdoc
         * @name psonocli.managerImport#update_datastore
         * @methodOf psonocli.managerImport
         *
         * @description
         * gets the datastore and updates it
         *
         * @param {object} parsed_data
         *
         * @returns {*} Returns the parsed data on completion
         */
        var update_datastore = function(parsed_data) {
            return managerDatastorePassword.get_password_datastore().then(function(datastore){
                if (!datastore.hasOwnProperty('folders')) {
                    datastore['folders'] = []
                }

                datastore['folders'].push(parsed_data['data']['datastore']);

                managerDatastorePassword.save_datastore(datastore, [[]]);

                return $q.resolve(parsed_data)
            })
        };


        /**
         * @ngdoc
         * @name psonocli.managerImport#create_secret
         * @methodOf psonocli.managerImport
         *
         * @description
         * creates all the necessary secrets
         *
         * @param {object} parsed_data
         * @param {string} datastore_id The ID of the password datastore
         *
         * @returns {*} Returns the parsed data on completion
         */
        var create_secret = function(parsed_data, datastore_id) {
            if (parsed_data['data']['secrets'].length < 1) {
                return parsed_data
            }

            var popped_secret = parsed_data['data']['secrets'].pop();

            // now lets construct our new secret
            var secret = {};
            for (var property in popped_secret) {
                if (!popped_secret.hasOwnProperty(property)) {
                    continue;
                }
                if (!property.startsWith(popped_secret['type'])) {
                    continue;
                }
                secret[property] = popped_secret[property];
                delete popped_secret[property];
            }

            return managerSecret.create_secret(secret, popped_secret['id'], datastore_id, null).then(function(e) {
                popped_secret['secret_id'] = e.secret_id;
                popped_secret['secret_key'] = e.secret_key;
                return create_secret(parsed_data, datastore_id);
            });
        };


        /**
         * @ngdoc
         * @name psonocli.managerImport#create_secrets
         * @methodOf psonocli.managerImport
         *
         * @description
         * Initiates the creation of all secrets and links it to the password datastore
         *
         * @param {object} parsed_data
         *
         * @returns {*} Returns the parsed data on completion
         */
        var create_secrets = function(parsed_data) {
            return managerDatastorePassword.get_password_datastore().then(function(datastore){
                return create_secret(parsed_data, datastore['datastore_id']);
            });
        };

        /**
         * @ngdoc
         * @name psonocli.managerImport#get_importer
         * @methodOf psonocli.managerImport
         *
         * @description
         * Returns a list with all possible importer
         *
         * @returns {[*]}
         */
        var get_importer = function() {
            var importer_array = [];

            for (var parser in _importer) {
                if (!_importer.hasOwnProperty(parser)) {
                    continue;
                }
                importer_array.push(_importer[parser]);
            }

            return importer_array;

        };

        /**
         * @ngdoc
         * @name psonocli.managerImport#import_datastore
         * @methodOf psonocli.managerImport
         *
         * @description
         * Imports a datastore
         *
         * @param {string} type The type of the import
         * @param {string} data The data of the import
         *
         * @returns {promise} Returns a promise with the result of the import
         */
        var import_datastore = function(type, data) {

            emit('import-started', {});

            return $q.when({type: type, data: data})
                .then(parse_export)
                .then(create_secrets)
                .then(update_datastore)
                .then(function() {
                    return {msgs: ['Import successful.']}
                });
        };

        return {
            on:on,
            emit:emit,
            register_importer:register_importer,
            get_importer:get_importer,
            import_datastore:import_datastore
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerImport", ['$q', '$window', '$timeout', 'managerSecret', 'managerDatastorePassword', managerImport]);

}(angular));