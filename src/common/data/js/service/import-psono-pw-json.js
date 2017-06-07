(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.importPsonoPwJson
     * @requires psonocli.managerImport
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Service which handles the actual parsing of the exported JSON
     */
    var importPsonoPwJson = function(managerImport, cryptoLibrary) {

        var importer_code = 'psono_pw_json';
        var importer = {
            name: 'Psono.pw (JSON)',
            value: importer_code,
            parser: parser
        };


        activate();

        function activate() {

            managerImport.register_importer(importer_code, importer);
        }

        /**
         * @ngdoc
         * @name psonocli.importPsonoPwJson#gather_secrets
         * @methodOf psonocli.importPsonoPwJson
         *
         * @description
         * Searches a given folder recursive inclusive all sub-folders and puts them all into the provided secrets array
         *
         * @param {{}} folder The folder structure to search recursive
         * @param {[]} secrets The array containing all the found secrets
         */
        function gather_secrets(folder, secrets) {
            var i;
            var subitem;

            folder['id'] = cryptoLibrary.generate_uuid();

            if (folder.hasOwnProperty('folders')) {
                for (i = 0; i < folder['folders'].length; i++) {
                    gather_secrets(folder['folders'][i], secrets);
                }
            }

            if (folder.hasOwnProperty('items')) {
                for (i = 0; i < folder['items'].length; i++) {
                    subitem = folder['items'][i];
                    subitem['id'] = cryptoLibrary.generate_uuid();

                    secrets.push(subitem);
                }
            }
        }

        /**
         * @ngdoc
         * @name psonocli.importPsonoPwJson#parser
         * @methodOf psonocli.importPsonoPwJson
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

            try {
                var datastore = JSON.parse(data);
            } catch(err) {
                return null;
            }
            var secrets = [];

            var d = new Date();
            var n = d.toISOString();
            datastore['name'] = 'Import ' + n;

            gather_secrets(datastore, secrets);

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
    app.factory("importPsonoPwJson", ['managerImport', 'cryptoLibrary', importPsonoPwJson]);

}(angular));
