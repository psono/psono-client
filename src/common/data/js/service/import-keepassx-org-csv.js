(function(angular, Papa) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.importKeePassXCsv
     * @requires psonocli.managerImport
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.helper
     *
     * @description
     * Service which handles the actual parsing of the exported JSON
     */
    var importKeePassXCsv = function(managerImport, cryptoLibrary, helper) {

        var importer_code = 'keepassx_org_csv';
        var importer = {
            name: 'KeePassX.org (CSV)',
            value: importer_code,
            parser: parser
        };

        var INDEX_GROUP = 0;
        var INDEX_TITLE = 1;
        var INDEX_USERNAME = 2;
        var INDEX_PASSWORD = 3;
        var INDEX_URL = 4;
        var INDEX_NOTES = 5;


        activate();

        function activate() {

            managerImport.register_importer(importer_code, importer);
        }

        /**
         * @ngdoc
         * @name psonocli.importKeePassXCsv#get_folder_helper
         * @methodOf psonocli.importKeePassXCsv
         *
         * @description
         * Little helper function that will search a folder recursive for a given path and creates the path if it doesn't
         * yet exist. Once the specified folder has been reached, it will return it.
         *
         * @param {Array} path Array of folder names to search
         * @param {{}} folder A folder object that needs to contain the items and folders attribute
         *
         * @returns {*} Returns the specified folder object, containing items and folders
         */
        function get_folder_helper(path, folder) {

            var next_folder_name;
            var next_folder;

            if (path.length === 0) {
                return folder;
            }
            next_folder_name = path.shift();

            for (var i = 0; i < folder['folders'].length; i++) {
                if (folder['folders'][i].name === next_folder_name) {
                    next_folder = folder['folders'][i];
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
                folder['folders'].push(next_folder);
            }

            return next_folder
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
         * @param {{}} datastore The full datastore object
         *
         * @returns {{}} Returns the folder
         */
        function get_folder(line, datastore) {

            var path = line[INDEX_GROUP].split("/");
            path.shift(); // Drop "Root" element

            return get_folder_helper(path, datastore);
        }

        /**
         * @ngdoc
         * @name psonocli.importKeePassXCsv#transform_to_secret
         * @methodOf psonocli.importKeePassXCsv
         *
         * @description
         * Takes a line and transforms it into a password entry
         *
         * @param {[]} line One line of the CSV
         *
         * @returns {*} The secrets object
         */
        var transform_to_secret = function(line) {

            var parsed_url = helper.parse_url(line[INDEX_URL]);

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "website_password",
                name : line[INDEX_TITLE],
                "urlfilter" : parsed_url.authority,
                "website_password_url_filter" : parsed_url.authority,
                "website_password_password" : line[INDEX_PASSWORD],
                "website_password_username" : line[INDEX_USERNAME],
                "website_password_notes" : line[INDEX_NOTES],
                "website_password_url" : line[INDEX_URL],
                "website_password_title" : line[INDEX_TITLE]
            }
        };


        /**
         * @ngdoc
         * @name psonocli.importKeePassXCsv#gather_secrets
         * @methodOf psonocli.importKeePassXCsv
         *
         * @description
         * Fills the datastore with folders their content and together with the secrets object
         *
         * @param {{}} datastore The datastore structure to search recursive
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
                if (line.length < 6) {
                    continue;
                }

                folder = get_folder(line, datastore);
                var secret = transform_to_secret(line);
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
         * @name psonocli.importKeePassXCsv#parse_csv
         * @methodOf psonocli.importKeePassXCsv
         *
         * @description
         *
         * @param data
         * @returns {Array}
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
         * @name psonocli.importKeePassXCsv#parser
         * @methodOf psonocli.importKeePassXCsv
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
                'folders': [],
                'items': []
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
    app.factory("importKeePassXCsv", ['managerImport', 'cryptoLibrary', 'helper', importKeePassXCsv]);

}(angular, Papa));
