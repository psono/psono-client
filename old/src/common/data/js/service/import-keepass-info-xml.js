(function(angular, fastXmlParser) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.importKeePassXml
     * @requires psonocli.managerImport
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.helper
     *
     * @description
     * Service which handles the parsing of the KeePass.info XML exports
     */
    var importKeePassXml = function(managerImport, cryptoLibrary, helper) {

        var importer_code = 'keepass_info_xml';
        var importer = {
            name: 'KeePass.info (XML)',
            value: importer_code,
            parser: parser
        };


        activate();

        function activate() {

            managerImport.register_importer(importer_code, importer);
        }

        function unescape_value(value) {
            value = value.replace(/&lt;/g , "<");
            value = value.replace(/&gt;/g , ">");
            value = value.replace(/&amp;/g , "&");

            return value;
        }

        /**
         * @ngdoc
         * @name psonocli.importKeePassXml#transform_to_secret
         * @methodOf psonocli.importKeePassXml
         *
         * @description
         * Takes a line and transforms it into a password entry
         *
         * @param {[]} line One line of the XML
         *
         * @returns {*} The secrets object
         */
        var transform_to_secret = function(line) {

            if (!line.hasOwnProperty('String') || !line.String) {
                return null;
            }
            var secret = {
                id : cryptoLibrary.generate_uuid(),
                type : "website_password",
                "name" : '',
                "urlfilter" : '',
                "website_password_url_filter" : '',
                "website_password_password" : '',
                "website_password_username" : '',
                "website_password_notes" : '',
                "website_password_url" : '',
                "website_password_title" : ''
            };


            for (var i = 0; i < line.String.length; i++) {
                var value = line.String[i];
                if (!value.hasOwnProperty('Key')) {
                    continue;
                }
                if (!value.hasOwnProperty('Value')) {
                    continue;
                }
                var key = value['Key'];
                var val = unescape_value(value['Value']);

                if (key === 'Notes') {
                    secret['website_password_notes'] = val;
                }

                if (key === 'Password') {
                    secret['website_password_password'] = val;
                }

                if (key === 'Title') {
                    secret['name'] = val;
                    secret['website_password_title'] = val;
                }

                if (key === 'URL') {
                    var parsed_url = helper.parse_url(val);
                    secret['urlfilter'] = parsed_url.authority || '';
                    secret['website_password_url_filter'] = parsed_url.authority || '';
                    secret['website_password_url'] = val;
                }

                if (key === 'UserName') {
                    secret['website_password_username'] = val;
                }
            }

            return secret;
        };

        /**
         * @ngdoc
         * @name psonocli.importKeePassXml#gather_secrets
         * @methodOf psonocli.importKeePassXml
         *
         * @description
         * Fills the datastore with folders their content and together with the secrets object
         *
         * @param {object} datastore The datastore structure to search recursive
         * @param {[]} secrets The array containing all the found secrets
         * @param {Document} xml The parsed XML document
         */
        function gather_secrets(datastore, secrets, xml) {
            var i;
            var next_folder;
            var entries;
            if (xml.hasOwnProperty('Entry')) {
                if (Object.prototype.toString.call( xml.Entry ) === '[object Array]') {
                    entries = xml.Entry;
                } else {
                    entries = [xml.Entry]
                }

                for (i = 0; i < entries.length; i++) {
                    var secret = transform_to_secret(entries[i]);
                    if (secret === null) {
                        //empty line
                        continue;
                    }
                    datastore['items'].push(secret);
                    secrets.push(secret);
                }
            }

            if (xml.hasOwnProperty('Group')) {
                if (Object.prototype.toString.call( xml.Group ) === '[object Array]') {
                    entries = xml.Group;
                } else {
                    entries = [xml.Group]
                }

                for (i = 0; i < entries.length; i++) {
                    if (!entries[i].hasOwnProperty('Name')) {
                        continue
                    }
                    next_folder = {
                        id: cryptoLibrary.generate_uuid(),
                        name: entries[i]['Name'],
                        folders: [],
                        items: []
                    };
                    gather_secrets(next_folder, secrets, entries[i]);
                    datastore['folders'].push(next_folder);
                }
            }

        }

        /**
         * @ngdoc
         * @name psonocli.importKeePassXml#parse_xml
         * @methodOf psonocli.importKeePassXml
         *
         * @description
         * Parse the raw data into an xml Document object
         *
         * Source: https://stackoverflow.com/a/20294226/4582775
         *
         * @param {string} xmlString The raw data to parse
         * @returns {object} The array of arrays representing the XML
         */
        function parse_xml(xmlString) {
            fastXmlParser.validate(xmlString); // Throws sometimes an error if its no valid xml
            var parsed_xml = fastXmlParser.parse(xmlString, { parseNodeValue: false });
            if (!parsed_xml.hasOwnProperty("KeePassFile") || !parsed_xml['KeePassFile'].hasOwnProperty("Root") || !parsed_xml['KeePassFile']['Root'].hasOwnProperty("Group")) {
                throw new Error('Error parsing XML');
            }
            return parsed_xml['KeePassFile']['Root']['Group'];
        }

        /**
         * @ngdoc
         * @name psonocli.importKeePassXml#parser
         * @methodOf psonocli.importKeePassXml
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
                'folders': []
            };


            try {
                var xml = parse_xml(data);
            } catch(err) {
                return null;
            }

            gather_secrets(datastore, secrets, xml);

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
    app.factory("importKeePassXml", ['managerImport', 'cryptoLibrary', 'helper', importKeePassXml]);

}(angular, window.parser));
