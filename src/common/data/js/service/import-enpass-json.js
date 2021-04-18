(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.importEnpassJson
     * @requires psonocli.managerImport
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Service which handles the actual parsing of the exported JSON
     */
    var importEnpassJson = function(managerImport, cryptoLibrary) {

        var importer_code = 'enpass_json';
        var importer = {
            name: 'Enpass (JSON)',
            value: importer_code,
            parser: parser
        };


        activate();

        function activate() {

            managerImport.register_importer(importer_code, importer);
        }

        /**
         * @ngdoc
         * @name psonocli.importEnpassJson#detect_type
         * @methodOf psonocli.importEnpassJson
         *
         * @description
         * Analyzes an item and return its types
         *
         * @param {object} item The item to analyze
         */
        function detect_type(item) {
            
            var contains_url = false;
            var contains_username = false;
            var contains_password = false;
            
            if (item.hasOwnProperty('fields')) {
                for (var i = 0; i < item['fields'].length; i++ ) {
                    if (item['fields'][i]['type'] === 'password' && item['fields'][i]['value'] !== ''){
                        contains_password = true;
                    }
                    if (item['fields'][i]['type'] === 'url' && item['fields'][i]['value'] !== ''){
                        contains_url = true;
                    }
                    if (item['fields'][i]['type'] === 'username' && item['fields'][i]['value'] !== ''){
                        contains_username = true;
                    }
                }
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
        }

        /**
         * @ngdoc
         * @name psonocli.importEnpassJson#contains_totp
         * @methodOf psonocli.importEnpassJson
         *
         * @description
         * Checks whether the provided item contains in addition a totp code
         *
         * @param {object} item The item to analyze
         */
        function contains_totp(item) {
            var contains_totp_field = false;
            if (item.hasOwnProperty('fields')) {
                for (var i = 0; i < item['fields'].length; i++ ) {
                    if (item['fields'][i]['type'] === 'totp' && item['fields'][i]['value'] !== ''){
                        contains_totp_field = true;
                    }
                }
            }
            return contains_totp_field;
        }

        /**
         * @ngdoc
         * @name psonocli.importEnpassJson#transform_to_website_password
         * @methodOf psonocli.importEnpassJson
         *
         * @description
         * Takes an item and transforms it into a website password entry
         *
         * @param {[]} item One item of the json
         *
         * @returns {*} The secrets object
         */
        var transform_to_website_password = function(item) {

            var name = '';
            var urlfilter = '';
            var website_password_url_filter = '';
            var website_password_password = '';
            var website_password_username = '';
            var website_password_notes = '';
            var website_password_url = '';
            var website_password_title = '';

            if (item.hasOwnProperty('title')) {
                name = item['title'];
                if (item.hasOwnProperty('subtitle') && item['subtitle'] !== '') {
                    name = name + ' ' + item['subtitle'];
                }
            }

            if (item.hasOwnProperty('note') && item['note'] !== '') {
                website_password_notes = item['note'] + "\n";
            }
            
            if (item.hasOwnProperty('fields')) {
                for (var i = 0; i < item['fields'].length; i++){
                    
                    if (item['fields'][i]['type'] === 'username' && website_password_username === '') {
                        website_password_username = item['fields'][i]['value']
                    } else if (item['fields'][i]['type'] === 'password' && website_password_password === '') {
                        website_password_password = item['fields'][i]['value']
                    } else if (item['fields'][i]['type'] === 'url' && website_password_url === '') {
                        website_password_url = item['fields'][i]['value']
                    } else if (item['fields'][i]['type'] === 'totp') {
                        // don't do anything if we find a totp field as those are handled separately
                    } else if (item['fields'][i]['value'] !== '') {
                        website_password_notes = website_password_notes + item['fields'][i]['label'] + ': ' + item['fields'][i]['value'] + "\n";
                    }
                    
                }
            }
            
            return {
                id : cryptoLibrary.generate_uuid(),
                type : "website_password",
                name : name,
                "urlfilter" : urlfilter,
                "website_password_url_filter" : website_password_url_filter,
                "website_password_password" : website_password_password,
                "website_password_username" : website_password_username,
                "website_password_notes" : website_password_notes,
                "website_password_url" : website_password_url,
                "website_password_title" : website_password_title
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importEnpassJson#transform_to_application_password
         * @methodOf psonocli.importEnpassJson
         *
         * @description
         * Takes an item and transforms it into a application password entry
         *
         * @param {[]} item One item of the json
         *
         * @returns {*} The secrets object
         */
        var transform_to_application_password = function(item) {

            var name = '';
            var application_password_password = '';
            var application_password_username = '';
            var application_password_notes = '';
            var application_password_title = '';

            if (item.hasOwnProperty('title')) {
                name = item['title'];
                if (item.hasOwnProperty('subtitle') && item['subtitle'] !== '') {
                    name = name + ' ' + item['subtitle'];
                }
            }

            if (item.hasOwnProperty('note') && item['note'] !== '') {
                application_password_notes = item['note'] + "\n";
            }
            
            if (item.hasOwnProperty('fields')) {
                for (var i = 0; i < item['fields'].length; i++){
                    
                    if (item['fields'][i]['type'] === 'username' && application_password_username === '') {
                        application_password_username = item['fields'][i]['value']
                    } else if (item['fields'][i]['type'] === 'password' && application_password_password === '') {
                        application_password_password = item['fields'][i]['value']
                    } else if (item['fields'][i]['type'] === 'totp') {
                        // don't do anything if we find a totp field as those are handled separately
                    } else if (item['fields'][i]['value'] !== '') {
                        application_password_notes = application_password_notes + item['fields'][i]['label'] + ': ' + item['fields'][i]['value'] + "\n";
                    }
                    
                }
            }
            
            return {
                id : cryptoLibrary.generate_uuid(),
                type : "application_password",
                name : name,
                "application_password_password" : application_password_password,
                "application_password_username" : application_password_username,
                "application_password_notes" : application_password_notes,
                "application_password_title" : application_password_title
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importEnpassJson#transform_to_bookmark
         * @methodOf psonocli.importEnpassJson
         *
         * @description
         * Takes an item and transforms it into a bookmark entry
         *
         * @param {[]} item One item of the json
         *
         * @returns {*} The secrets object
         */
        var transform_to_bookmark = function(item) {

            var name = '';
            var urlfilter = '';
            var bookmark_url_filter = '';
            var bookmark_notes = '';
            var bookmark_url = '';
            var bookmark_title = '';

            if (item.hasOwnProperty('title')) {
                name = item['title'];
                if (item.hasOwnProperty('subtitle') && item['subtitle'] !== '') {
                    name = name + ' ' + item['subtitle'];
                }
            }

            if (item.hasOwnProperty('note') && item['note'] !== '') {
                bookmark_notes = item['note'] + "\n";
            }

            if (item.hasOwnProperty('fields')) {
                for (var i = 0; i < item['fields'].length; i++){
                    if (item['fields'][i]['type'] === 'url' && bookmark_url === '') {
                        bookmark_url = item['fields'][i]['value']
                    } else if (item['fields'][i]['type'] === 'totp') {
                        // don't do anything if we find a totp field as those are handled separately
                    } else if (item['fields'][i]['value'] !== '') {
                        bookmark_notes = bookmark_notes + item['fields'][i]['label'] + ': ' + item['fields'][i]['value'] + "\n";
                    }

                }
            }

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "bookmark",
                name : name,
                "urlfilter" : urlfilter,
                "bookmark_url_filter" : bookmark_url_filter,
                "bookmark_notes" : bookmark_notes,
                "bookmark_url" : bookmark_url,
                "bookmark_title" : bookmark_title
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importEnpassJson#transform_to_note
         * @methodOf psonocli.importEnpassJson
         *
         * @description
         * Takes an item and transforms it into a note
         *
         * @param {[]} item One item of the json
         *
         * @returns {*} The secrets object
         */
        var transform_to_note = function(item) {

            var name = '';
            var note_notes = '';
            var note_title = '';

            if (item.hasOwnProperty('title')) {
                name = item['title'];
                if (item.hasOwnProperty('subtitle') && item['subtitle'] !== '') {
                    name = name + ' ' + item['subtitle'];
                }
            }

            if (item.hasOwnProperty('note') && item['note'] !== '') {
                note_notes = item['note'] + "\n";
            }

            if (item.hasOwnProperty('fields')) {
                for (var i = 0; i < item['fields'].length; i++){
                    if (item['fields'][i]['type'] === 'totp') {
                        // don't do anything if we find a totp field as those are handled separately
                    } else if (item['fields'][i]['value'] !== '') {
                        note_notes = note_notes + item['fields'][i]['label'] + ': ' + item['fields'][i]['value'] + "\n";
                    }

                }
            }

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "note",
                name : name,
                "note_notes" : note_notes,
                "note_title" : note_title
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importEnpassJson#transform_to_totp_code
         * @methodOf psonocli.importEnpassJson
         *
         * @description
         * Takes an item and transforms it into a note
         *
         * @param {[]} item One item of the json
         *
         * @returns {*} The secrets object
         */
        var transform_to_totp_code = function(item) {

            var name = '';
            var totp_notes = '';
            var totp_code = '';
            var totp_title = '';

            if (item.hasOwnProperty('title')) {
                name = item['title'];
                if (item.hasOwnProperty('subtitle') && item['subtitle'] !== '') {
                    name = name + ' ' + item['subtitle'];
                }
            }

            if (item.hasOwnProperty('note') && item['note'] !== '') {
                totp_notes = item['note'] + "\n";
            }

            if (item.hasOwnProperty('fields')) {
                for (var i = 0; i < item['fields'].length; i++){
                    if (item['fields'][i]['type'] === 'totp' && totp_code === '') {
                        totp_code = item['fields'][i]['value']
                    } else if (item['fields'][i]['value'] !== '') {
                        totp_notes = totp_notes + item['fields'][i]['label'] + ': ' + item['fields'][i]['value'] + "\n";
                    }

                }
            }

            return {
                id : cryptoLibrary.generate_uuid(),
                type : "totp",
                name : name,
                "totp_notes" : totp_notes,
                "totp_code" : totp_code,
                "totp_title" : totp_title
            }
        };

        /**
         * @ngdoc
         * @name psonocli.importEnpassJson#gather_secrets
         * @methodOf psonocli.importEnpassJson
         *
         * @description
         * Searches a given parsedData recursive and puts them all into the provided secrets array
         *
         * @param {object} datastore The datastore to fill
         * @param {[]} secrets The array containing all the found secrets
         * @param {object} parsedData The objects
         */
        function gather_secrets(datastore, secrets, parsedData) {
            var i;
            var folder_index = {};
            
            if (parsedData.hasOwnProperty('folders')) {
                for (i = 0; i < parsedData['folders'].length; i++ ) {
                    folder_index[parsedData['folders'][i]['uuid']] = {
                        id: cryptoLibrary.generate_uuid(),
                        name: parsedData['folders'][i]['title'],
                        items: []
                    }
                }
            }
            
            if (parsedData.hasOwnProperty('items')) {
                for (i = 0; i < parsedData['items'].length; i++ ) {

                    var detected_type = detect_type(parsedData['items'][i]);
                    var contains_totp_code = contains_totp(parsedData['items'][i]);
                    
                    var crafted_secrets = [];
                    
                    if (detected_type === 'website_password') {
                        crafted_secrets.push(transform_to_website_password(parsedData['items'][i]));
                    } else if (detected_type === 'application_password') {
                        crafted_secrets.push(transform_to_application_password(parsedData['items'][i]));
                    } else if (detected_type === 'bookmark') {
                        crafted_secrets.push(transform_to_bookmark(parsedData['items'][i]));
                    } else {
                        crafted_secrets.push(transform_to_note(parsedData['items'][i]));
                    }
                    
                    if (contains_totp_code) {
                        crafted_secrets.push(transform_to_totp_code(parsedData['items'][i]));
                    }
                    
                    var parent_folder = null;
                    if (parsedData['items'][i].hasOwnProperty('folders')) {
                        for (var ii= 0; ii < parsedData['items'][i]['folders'].length; ii++) {
                            if (folder_index.hasOwnProperty(parsedData['items'][i]['folders'][ii])) {
                                parent_folder = folder_index[parsedData['items'][i]['folders'][ii]];
                            }
                        }
                    }
                    
                    for (var iii = 0; iii< crafted_secrets.length; iii++) {
                        if (parent_folder === null) {
                            datastore['items'].push(crafted_secrets[iii]);
                        } else {
                            parent_folder['items'].push(crafted_secrets[iii]);
                        }
                        secrets.push(crafted_secrets[iii]);
                    }
                }
            }
            
            for (var uuid in folder_index) {
                datastore['folders'].push(folder_index[uuid])
            }
        }

        /**
         * @ngdoc
         * @name psonocli.importEnpassJson#parser
         * @methodOf psonocli.importEnpassJson
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
                'items': [],
            };
            
            try {
                var parsedData = JSON.parse(data);
            } catch(err) {
                return null;
            }

            gather_secrets(datastore, secrets, parsedData);

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
    app.factory("importEnpassJson", ['managerImport', 'cryptoLibrary', importEnpassJson]);

}(angular));
