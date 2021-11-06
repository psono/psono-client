(function(angular, Papa) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.importTeampassNetCsv
     * @requires psonocli.managerImport
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.helper
     *
     * @description
     * Service which handles the parsing of the pwsafe.org CSV exports
     */
    var importTeampassNetCsv = function(managerImport, cryptoLibrary, helper) {

        var importer_code = 'teampass_net_csv';
        var importer = {
            name: 'Teampass (CSV)',
            value: importer_code,
            parser: parser
        };

        var INDEX_PROJECT_NAME = 0;
        var INDEX_DESCRIPTION = 1;
        var INDEX_URL = 2;
        var INDEX_USERNAME = 3;
        var INDEX_EMAIL = 4;
        var INDEX_PASSWORD = 5;
        var INDEX_NOTES = 6;
        var INDEX_TAGS = 7;
        var INDEX_CUSTOM_FIELDS = 8;
        var CUSTOM_FIELD_OFFSET = 9;


        activate();

        function activate() {
            managerImport.register_importer(importer_code, importer);
        }

        /**
         * @ngdoc
         * @name psonocli.importTeampassNetCsv#get_description
         * @methodOf psonocli.importTeampassNetCsv
         *
         * @description
         * Takes a line and returns the correct description
         *
         * @param {[]} line One line of the CSV
         *
         * @returns {*} The description
         */
        var get_description = function(line) {
            var description = line[INDEX_DESCRIPTION];
            if (line[INDEX_TAGS]) {
                description = description + ' (' + line[INDEX_TAGS] + ')'
            }
            return description;
        };
        
        /**
         * @ngdoc
         * @name psonocli.importTeampassNetCsv#get_notes
         * @methodOf psonocli.importTeampassNetCsv
         *
         * @description
         * Takes a line and returns the correct notes
         * 
         * Will first return the specified notes, an email if exists and then all custom fields in "key: value" format
         *
         * @param {[]} line One line of the CSV
         *
         * @returns {*} The description
         */
        var get_notes = function(line) {

            var notes = line[INDEX_NOTES] + "\n";

            if (line[INDEX_EMAIL]) {
                notes = notes + 'Email: ' + line[INDEX_EMAIL] + "\n"
            }
            
            if (line[INDEX_CUSTOM_FIELDS]) {
                var custom_fields = line[INDEX_CUSTOM_FIELDS].split(",");
                for (var i = 0; i < custom_fields.length; i++) {
                    //checks if the corresponding value is not empty
                    if (!line[CUSTOM_FIELD_OFFSET + i]) {
                        continue;
                    }
                    notes = notes + custom_fields[i] + ': ' + line[CUSTOM_FIELD_OFFSET + i] + "\n"
                }
            }
            
            return notes
        };

        /**
         * @ngdoc
         * @name psonocli.importTeampassNetCsv#transform_to_website_password
         * @methodOf psonocli.importTeampassNetCsv
         *
         * @description
         * Takes a line and transforms it into a website password entry
         *
         * @param {[]} line One line of the CSV
         *
         * @returns {*} The secrets object
         */
        var transform_to_website_password = function(line) {
            
            var parsed_url = helper.parse_url(line[INDEX_URL]);
            
            var description = get_description(line);
            var notes = get_notes(line);

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "website_password",
                name : description,
                "urlfilter" : parsed_url.authority,
                "website_password_url_filter" : parsed_url.authority,
                "website_password_password" : line[INDEX_PASSWORD],
                "website_password_username" : line[INDEX_USERNAME],
                "website_password_notes" : notes,
                "website_password_url" : line[INDEX_URL],
                "website_password_title" : description
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importTeampassNetCsv#transform_to_application_password
         * @methodOf psonocli.importTeampassNetCsv
         *
         * @description
         * Takes a line and transforms it into a application password entry
         *
         * @param {[]} line One line of the CSV
         *
         * @returns {*} The secrets object
         */
        var transform_to_application_password = function(line) {
            
            var description = get_description(line);
            var notes = get_notes(line);

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "application_password",
                name : description,
                "application_password_password" : line[INDEX_PASSWORD],
                "application_password_username" : line[INDEX_USERNAME],
                "application_password_notes" : notes,
                "application_password_title" : description
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importTeampassNetCsv#transform_to_bookmark
         * @methodOf psonocli.importTeampassNetCsv
         *
         * @description
         * Takes a line and transforms it into a bookmark entry
         *
         * @param {[]} line One line of the CSV
         *
         * @returns {*} The secrets object
         */
        var transform_to_bookmark = function(line) {
            
            var parsed_url = helper.parse_url(line[INDEX_URL]);
            
            var description = get_description(line);
            var notes = get_notes(line);

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "bookmark",
                name : description,
                "urlfilter" : parsed_url.authority,
                "bookmark_url_filter" : parsed_url.authority,
                "bookmark_notes" : notes,
                "bookmark_url" : line[INDEX_URL],
                "bookmark_title" : description
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importTeampassNetCsv#transform_to_note
         * @methodOf psonocli.importTeampassNetCsv
         *
         * @description
         * Takes a line and transforms it into a note entry
         *
         * @param {[]} line One line of the CSV
         *
         * @returns {*} The secrets object
         */
        var transform_to_note = function(line) {
            
            var description = get_description(line);
            var notes = get_notes(line);

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "note",
                name : description,
                "note_notes" : notes,
                "note_title" : description
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importTeampassNetCsv#detect_type
         * @methodOf psonocli.importTeampassNetCsv
         *
         * @description
         * Analyzes an item and return its types
         *
         * @param {object} line The line to analyze
         */
        function detect_type(line) {

            var contains_url = line[INDEX_URL];
            var contains_username = line[INDEX_USERNAME];
            var contains_password = line[INDEX_PASSWORD];

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
        }

        /**
         * @ngdoc
         * @name psonocli.importKeePassXCsv#get_folder
         * @methodOf psonocli.importKeePassXCsv
         *
         * @description
         * Creates the folder if it doesn't exists and returns it.
         *
         * @param {[]} line One line of the CSV import
         * @param {object} datastore The full datastore object
         *
         * @returns {object} Returns the folder
         */
        function get_folder(line, datastore) {

            var next_folder_name;
            var next_folder;

            next_folder_name = line[INDEX_PROJECT_NAME];

            for (var i = 0; i < datastore['folders'].length; i++) {
                if (datastore['folders'][i].name === next_folder_name) {
                    next_folder = datastore['folders'][i];
                    break;
                }
            }

            if (typeof(next_folder) === 'undefined') {
                next_folder = {
                    id: cryptoLibrary.generate_uuid(),
                    name: next_folder_name,
                    folders: [],
                    items: []
                };
                datastore['folders'].push(next_folder);
            }

            return next_folder
        }


        /**
         * @ngdoc
         * @name psonocli.importTeampassNetCsv#gather_secrets
         * @methodOf psonocli.importTeampassNetCsv
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
            var folder;

            for (var i = 0; i < csv.length; i++) {
                line = csv[i];
                if (i === 0) {
                    continue;
                }
                if (line.length < 5) {
                    continue;
                }

                folder = get_folder(line, datastore);

                var detected_type = detect_type(line);

                var secret = null;
                if (detected_type === 'website_password') {
                    secret = transform_to_website_password(line);
                } else if (detected_type === 'application_password') {
                    secret = transform_to_application_password(line);
                } else if (detected_type === 'bookmark') {
                    secret = transform_to_bookmark(line);
                } else {
                    secret = transform_to_note(line);
                }
                
                if (secret === null) {
                    //empty line
                    continue;
                }
                folder['items'].push(secret);
                secrets.push(secret);
            }
        }

        /**
         * @ngdoc
         * @name psonocli.importTeampassNetCsv#parse_csv
         * @methodOf psonocli.importTeampassNetCsv
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
         * @name psonocli.importTeampassNetCsv#parser
         * @methodOf psonocli.importTeampassNetCsv
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
                'items': [],
                'folders': [],
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
    app.factory("importTeampassNetCsv", ['managerImport', 'cryptoLibrary', 'helper', importTeampassNetCsv]);

}(angular, Papa));
