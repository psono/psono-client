(function(angular, Papa) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.importKeePassCsv
     * @requires psonocli.managerImport
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.helper
     *
     * @description
     * Service which handles the parsing of the KeePass.info CSV exports
     */
    var importKeePassCsv = function(managerImport, cryptoLibrary, helper) {

        var importer_code = 'keepass_info_csv';
        var importer = {
            name: 'KeePass.info (CSV)',
            value: importer_code,
            parser: parser
        };

        var INDEX_ACCOUNT = 0;
        var INDEX_LOGIN_NAME = 1;
        var INDEX_PASSWORD = 2;
        var INDEX_WEB_SITE = 3;
        var INDEX_COMMENTS = 4;


        activate();

        function activate() {

            managerImport.register_importer(importer_code, importer);
        }

        /**
         * @ngdoc
         * @name psonocli.importKeePassCsv#transform_to_secret
         * @methodOf psonocli.importKeePassCsv
         *
         * @description
         * Takes a line and transforms it into a password entry
         *
         * @param {[]} line One line of the CSV
         *
         * @returns {*} The secrets object
         */
        var transform_to_secret = function(line) {

            var parsed_url = helper.parse_url(line[INDEX_WEB_SITE]);

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "website_password",
                name : line[INDEX_ACCOUNT],
                "urlfilter" : parsed_url.authority,
                "website_password_url_filter" : parsed_url.authority,
                "website_password_password" : line[INDEX_PASSWORD],
                "website_password_username" : line[INDEX_LOGIN_NAME],
                "website_password_notes" : line[INDEX_COMMENTS],
                "website_password_url" : line[INDEX_WEB_SITE],
                "website_password_title" : line[INDEX_ACCOUNT]
            }
        };


        /**
         * @ngdoc
         * @name psonocli.importKeePassCsv#gather_secrets
         * @methodOf psonocli.importKeePassCsv
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

            for (var i = 0; i < csv.length; i++) {
                line = csv[i];
                if (i === 0) {
                    continue;
                }
                if (line.length < 5) {
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
         * @name psonocli.importKeePassCsv#parse_csv
         * @methodOf psonocli.importKeePassCsv
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
         * @name psonocli.importKeePassCsv#parser
         * @methodOf psonocli.importKeePassCsv
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
    app.factory("importKeePassCsv", ['managerImport', 'cryptoLibrary', 'helper', importKeePassCsv]);

}(angular, Papa));
