(function(angular, Papa) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.importChromeCsv
     * @requires psonocli.managerImport
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.helper
     *
     * @description
     * Service which handles the actual parsing of the exported JSON
     */
    var importChromeCsv = function(managerImport, cryptoLibrary, helper) {

        var importer_code = 'chrome_csv';
        var importer = {
            name: 'Chrome (CSV)',
            help: 'Open the following in your address bar and activate the export function:' +
            '<pre>chrome://flags/#password-import-export</pre>' +
            'Afterwards you can open the following in your address bar and export all passwords as a file:' +
            '<pre>chrome://settings/passwords</pre>' +
            'As a last step upload the file here.',
            value: importer_code,
            parser: parser
        };

        var INDEX_NAME = 0;
        var INDEX_URL = 1;
        var INDEX_USERNAME = 2;
        var INDEX_PASSWORD = 3;


        activate();

        function activate() {

            managerImport.register_importer(importer_code, importer);
        }

        /**
         * @ngdoc
         * @name psonocli.importChromeCsv#transform_to_secret
         * @methodOf psonocli.importChromeCsv
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
                name : line[INDEX_NAME],
                "urlfilter" : parsed_url.authority,
                "website_password_url_filter" : parsed_url.authority,
                "website_password_password" : line[INDEX_PASSWORD],
                "website_password_username" : line[INDEX_USERNAME],
                "website_password_notes" : '',
                "website_password_url" : line[INDEX_URL],
                "website_password_title" : line[INDEX_NAME]
            }
        };


        /**
         * @ngdoc
         * @name psonocli.importChromeCsv#gather_secrets
         * @methodOf psonocli.importChromeCsv
         *
         * @description
         * Fills the datastore with their content, together with the secrets object
         *
         * @param {object} datastore The datastore structure to search recursive
         * @param {[]} secrets The array containing all the found secrets
         * @param {[]} csv The array containing all the found secrets
         */
        function gather_secrets(datastore, secrets, csv) {
            var line;
            for (var i = 0; i < csv.length; i++) {
                line = csv[i];
                if (i === 0) {
                    continue;
                }
                if (line.length < 4) {
                    continue;
                }

                var secret = transform_to_secret(line);
                if (secret === null) {
                    //empty line
                    continue;
                }
                datastore['items'].push(secret);
                secrets.push(secret);
            }
        }

        /**
         * @ngdoc
         * @name psonocli.importChromeCsv#parse_csv
         * @methodOf psonocli.importChromeCsv
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
         * @name psonocli.importChromeCsv#parser
         * @methodOf psonocli.importChromeCsv
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
    app.factory("importChromeCsv", ['managerImport', 'cryptoLibrary', 'helper', importChromeCsv]);

}(angular, Papa));
