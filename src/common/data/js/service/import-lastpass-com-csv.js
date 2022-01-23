(function(angular, Papa) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.importLastPassComCsv
     * @requires psonocli.managerImport
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.helper
     *
     * @description
     * Service which handles the actual parsing of the exported JSON
     */
    var importLastPassComCsv = function(managerImport, cryptoLibrary, helper) {

        var importer_code = 'lastpass_com_csv';
        var importer = {
            name: 'LastPass.com (CSV)',
            value: importer_code,
            parser: parser
        };

        var INDEX_URL = 0;
        var INDEX_USERNAME = 1;
        var INDEX_PASSWORD = 2;
        var INDEX_TOTP = 3;
        var INDEX_EXTRA = 4;
        var INDEX_NAME = 5;
        var INDEX_GROUPING = 6;
        var INDEX_FAV = 7; // not used yet ...


        activate();

        function activate() {

            managerImport.register_importer(importer_code, importer);
        }

        /**
         * @ngdoc
         * @name psonocli.importLastPassComCsv#get_folder_name
         * @methodOf psonocli.importLastPassComCsv
         *
         * @description
         * Interprets a line and returns the folder name this entry should late belong to
         *
         * @param {[]} line One line of the CSV import
         *
         * @returns {string} The name of the folder this line belongs into
         */
        function get_folder_name(line) {
            if (line[INDEX_GROUPING] === '' ||
                typeof line[INDEX_GROUPING] === 'undefined' ||
                line[INDEX_GROUPING] === '(none)' ||
                line[INDEX_GROUPING] === '(keine)') {

                return "Undefined";
            } else {
                return line[INDEX_GROUPING];
            }
        }

        /**
         * @ngdoc
         * @name psonocli.importLastPassComCsv#get_type
         * @methodOf psonocli.importLastPassComCsv
         *
         * @description
         * Returns the type of a line
         *
         * @param {[]} line One line of the CSV import
         *
         * @returns {string} Returns the appropriate type (note or website_password)
         */
        var get_type = function(line) {
            var contains_url = line[INDEX_URL];
            var contains_username = line[INDEX_USERNAME];
            var contains_password = line[INDEX_PASSWORD];
            
            if (line[INDEX_URL] === 'http://sn') {
                // its a license, so lets return a note as we don't have this object class yet
                return 'note'
            }

            if (contains_url && (contains_username || contains_password)) {
                return 'website_password';
            }
            if (contains_url) {
                return 'bookmark';
            }
            if (contains_username || contains_password) {
                return 'application_password';
            }

            return 'note';
        };

        /**
         * @ngdoc
         * @name psonocli.importLastPassComCsv#transfer_into_note
         * @methodOf psonocli.importLastPassComCsv
         *
         * @description
         * Takes a line that should represent a note and transforms it into a proper secret object
         *
         * @param {[]} line One line of the CSV that represents a note
         *
         * @returns {*} The note secret object
         */
        var transfer_into_note = function(line) {

            var note_notes = '';
            if (line[INDEX_USERNAME]) {
                note_notes = note_notes + line[INDEX_USERNAME] + "\n";
            }
            if (line[INDEX_PASSWORD]) {
                note_notes = note_notes + line[INDEX_PASSWORD] + "\n";
            }
            if (line[INDEX_EXTRA]) {
                note_notes = note_notes + line[INDEX_EXTRA] + "\n";
            }

            if (! line[INDEX_NAME] && ! note_notes) {
                return null
            }

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "note",
                name : line[INDEX_NAME],
                note_title: line[INDEX_NAME],
                note_notes: note_notes
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importLastPassComCsv#transfer_into_website_password
         * @methodOf psonocli.importLastPassComCsv
         *
         * @description
         * Takes a line that should represent a website passwords and transforms it into a proper secret object
         *
         * @param {[]} line One line of the CSV that represents a website password
         *
         * @returns {*} The website_password secret object
         */
        var transfer_into_website_password = function(line) {

            var parsed_url = helper.parse_url(line[INDEX_URL]);

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "website_password",
                name : line[INDEX_NAME],
                "urlfilter" : parsed_url.authority,
                "website_password_url_filter" : parsed_url.authority,
                "website_password_password" : line[INDEX_PASSWORD],
                "website_password_username" : line[INDEX_USERNAME],
                "website_password_notes" : line[INDEX_EXTRA],
                "website_password_url" : line[INDEX_URL],
                "website_password_title" : line[INDEX_NAME]
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importLastPassComCsv#transfer_into_bookmark
         * @methodOf psonocli.importLastPassComCsv
         *
         * @description
         * Takes a line that should represent a bookmark and transforms it into a proper secret object
         *
         * @param {[]} line One line of the CSV that represents a website password
         *
         * @returns {*} The bookmark secret object
         */
        var transfer_into_bookmark = function(line) {

            var parsed_url = helper.parse_url(line[INDEX_URL]);

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "bookmark",
                name : line[INDEX_NAME],
                "urlfilter" : parsed_url.authority,
                "bookmark_url_filter" : parsed_url.authority,
                "bookmark_notes" : line[INDEX_EXTRA],
                "bookmark_url" : line[INDEX_URL],
                "bookmark_title" : line[INDEX_NAME]
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importLastPassComCsv#transfer_into_application_password
         * @methodOf psonocli.importLastPassComCsv
         *
         * @description
         * Takes a line that should represent an application passwords and transforms it into a proper secret object
         *
         * @param {[]} line One line of the CSV that represents a website password
         *
         * @returns {*} The application_password secret object
         */
        var transfer_into_application_password = function(line) {

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "application_password",
                name : line[INDEX_NAME],
                "application_password_password" : line[INDEX_PASSWORD],
                "application_password_username" : line[INDEX_USERNAME],
                "application_password_notes" : line[INDEX_EXTRA],
                "application_password_title" : line[INDEX_NAME]
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importLastPassComCsv#transform_to_secret
         * @methodOf psonocli.importLastPassComCsv
         *
         * @description
         * Takes a line, checks its type and transforms it into a proper secret object
         *
         * @param {[]} line One line of the CSV
         *
         * @returns {*} The secrets object
         */
        var transform_to_secret = function(line) {
            var type = get_type(line);
            if (type === 'note') {
                return transfer_into_note(line);
            } else if(type === 'application_password') {
                return transfer_into_application_password(line);
            } else if(type === 'bookmark') {
                return transfer_into_bookmark(line);
            } else {
                return transfer_into_website_password(line);
            }
        };


        /**
         * @ngdoc
         * @name psonocli.importLastPassComCsv#gather_secrets
         * @methodOf psonocli.importLastPassComCsv
         *
         * @description
         * Fills the datastore with folders their content and together with the secrets object
         *
         * @param {object} datastore The datastore structure to search recursive
         * @param {[]} secrets The array containing all the found secrets
         * @param {[]} csv The array containing all the found secrets
         */
        function gather_secrets(datastore, secrets, csv) {
            var line;
            var folder_name;
            var folder_index = {};

            for (var i = 0; i < csv.length; i++) {
                line = csv[i];
                if (i === 0) {
                    continue;
                }

                folder_name = get_folder_name(line);
                var secret = transform_to_secret(line);
                if (secret === null) {
                    //empty line
                    continue;
                }

                if (! folder_index.hasOwnProperty(folder_name)) {
                    folder_index[folder_name] = []
                }
                folder_index[folder_name].push(secret);
                secrets.push(secret);
            }

            for (var name in folder_index) {
                datastore['folders'].push({
                    id: cryptoLibrary.generate_uuid(),
                    name: name,
                    items: folder_index[name]
                })
            }
        }

        /**
         * @ngdoc
         * @name psonocli.importLastPassComCsv#parse_csv
         * @methodOf psonocli.importLastPassComCsv
         *
         * @description
         * Parse the raw data into an array of arrays
         *
         * @param {string} data The raw data to parse
         * @returns {Array} The array of arrays representing the CSV
         */
        function parse_csv(data) {
            var csv = Papa.parse(data);

            if (csv['errors'].length > 0) {
                throw new Error(csv['errors'][0]['message']);
            }

            return csv['data'];
        }

        /**
         * @ngdoc
         * @name psonocli.importLastPassComCsv#parser
         * @methodOf psonocli.importLastPassComCsv
         *
         * @description
         * The main function of this parser. Will take the content of the JSON export of a psono.pw client and will
         * return the usual output of a parser (or null):
         *     {
         *         datastore: {
         *             name: 'Import TIMESTAMP'
         *         },
         *         secrets: Array
         *     }
         *
         * @param {string} data The JSON export of a psono.pw client
         *
         * @returns {{datastore, secrets: Array} | null}
         */
        function parser(data) {

            var d = new Date();
            var n = d.toISOString();

            var secrets = [];
            var datastore = {
                'id': cryptoLibrary.generate_uuid(),
                'name': 'Import ' + n,
                'folders': []
            };

            try {
                var csv = parse_csv(data);
            } catch(err) {
                return null;
            }

            gather_secrets(datastore, secrets, csv);

            return {
                datastore: datastore,
                secrets: secrets
            }
        }

        return {
            parser: parser
        };
    };

    var app = angular.module('psonocli');
    app.factory("importLastPassComCsv", ['managerImport', 'cryptoLibrary', 'helper', importLastPassComCsv]);

}(angular, Papa));
