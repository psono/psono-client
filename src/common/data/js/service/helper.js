(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.helper
     * @description
     *
     * Service with some helper functions that do not fit anywhere else
     */


    var helper = function() {

        /**
         * @ngdoc
         * @name psonocli.helper#parse_url
         * @methodOf psonocli.helper
         *
         * @description
         * parses an URL and returns an object with all details separated
         *
         * @param {url} url The url to be parsed
         * @returns {SplittedUrl} Returns the split up url
         */
        var parse_url = function (url) {
            var authority;
            var splitted_authority;
            var splitted_domain;
            var full_domain;
            var top_domain;
            var port = null;

            // According to RFC http://www.ietf.org/rfc/rfc3986.txt Appendix B
            var pattern = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
            var matches =  url.match(pattern);

            if (typeof(matches[4]) !== 'undefined') {
                authority = matches[4].replace(/^(www\.)/,"");
                splitted_authority = authority.split(":");
            }

            if (typeof(splitted_authority) !== 'undefined' && splitted_authority.length === 2) {
                port = splitted_authority[splitted_authority.length - 1];
            }
            if (typeof(splitted_authority) !== 'undefined') {
                splitted_domain = splitted_authority[0].split(".");
                full_domain = splitted_authority[0];
            }

            if (typeof(splitted_domain) !== 'undefined') {
                top_domain = splitted_domain[splitted_domain.length - 2] + '.' + splitted_domain[splitted_domain.length - 1];
            }

            return {
                scheme: matches[2],
                authority: authority, //remove leading www.
                full_domain: full_domain,
                top_domain: top_domain,
                port: port,
                path: matches[5],
                query: matches[7],
                fragment: matches[9]
            };
        };

        /**
         * @ngdoc
         * @name psonocli.helper#get_domain
         * @methodOf psonocli.helper
         *
         * @description
         * Parses an URL to get the full domain from it.
         * example: https://docs.google.com -> docs.google.com
         *
         * @param {url} url The URL we want to parse
         * @returns {string} The full domain of the url
         */
        var get_domain = function (url) {
            var parsed_url = parse_url(url);
            return parsed_url.full_domain;
        };

        /**
         * @ngdoc
         * @name psonocli.helper#array_starts_with
         * @methodOf psonocli.helper
         *
         * @description
         * Checks if array1 starts with array2
         *
         * @param {array} array1 The array that should contain array2
         * @param {array} array2 The array that should be part of array1
         * @returns {boolean} Returns if array1 starts with array2
         */
        var array_starts_with = function(array1, array2) {
            if (! (array1 instanceof Array)){
                return false;
            }
            if (! (array2 instanceof Array)){
                return false;
            }

            if (array1.length < array2.length){
                return false;
            }

            for (var i = 0; i < array1.length; i++) {
                if (i === array2.length) {
                    return true;
                }
                if (array1[i] instanceof Array && array2[i] instanceof Array) {
                    if (!array1[i].equals(array2[i])){
                        return false;
                    }
                } else if (array1[i] !== array2[i]) {
                    return false;
                }
            }
            return true;
        };

        /**
         * @ngdoc
         * @name psonocli.helper#create_list
         * @methodOf psonocli.helper
         *
         * @description
         * Creates a list of items that are in a given datastore tree object
         *
         * @param {object} obj The datastore tree object
         * @param {array} list The list object we want to fill
         */
        var create_list = function (obj, list) {
            var i;
            for (i = 0; obj.items && i < obj.items.length; i++) {
                list.push(obj.items[i]);
            }
            for (i = 0; obj.folders && i < obj.folders.length; i++) {
                create_list(obj.folders[i], list);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.helper#duplicate_object
         * @methodOf psonocli.helper
         *
         * @description
         * Takes an object and duplicates it
         *
         * @param {*} obj initial object that we want to duplicate
         * @returns {*} Returns a duplicate of object
         */
        var duplicate_object = function(obj) {
            return JSON.parse(JSON.stringify(obj));
        };

        /**
         * @ngdoc
         * @name psonocli.helper#is_valid_username
         * @methodOf psonocli.helper
         *
         * @description
         * Determines if the username is a valid username.
         * If yes the function returns true. If not, the function returns an error string
         *
         * @param {string} username A string that could be a valid username
         * @returns {true|string} Returns true or a string with the error
         */
        var is_valid_username = function(username) {
            var USERNAME_REGEXP = /^[a-z0-9.\-]*$/i;
            if( ! USERNAME_REGEXP.test(username)) {
                return 'Usernames may only contain letters, numbers, periods and dashes.';
            }
            if (username.length < 3) {
                return 'Usernames may not be shorter than 3 chars.';
            }
            if (username.substring(0, 1) === ".") {
                return 'Usernames may not start with a period.';
            }
            if (username.substring(0, 1) === "-") {
                return 'Usernames may not start with a dash.';
            }
            if (username.substring(username.length -1) === '.') {
                return 'Usernames may not end with a period.';
            }
            if (username.substring(username.length -1) === '-') {
                return 'Usernames may not end with a dash.';
            }
            if (username.indexOf('..') !== -1) {
                return 'Usernames may not contain consecutive periods.';
            }
            if (username.indexOf('--') !== -1) {
                return 'Usernames may not contain consecutive dashes.';
            }
            if (username.indexOf('.-') !== -1) {
                return 'Usernames may not contain periods followed by dashes.';
            }
            if (username.indexOf('-.') !== -1) {
                return 'Usernames may not contain dashes followed by periods.';
            }
            return true;
        };

        /**
         * @ngdoc
         * @name psonocli.helper#split_string_in_chunks
         * @methodOf psonocli.helper
         *
         * @description
         * Splits a string into several chunks
         *
         * @param {string} str The string to split
         * @param {int} len The length of the chunks
         *
         * @returns {Array} Returns the chunks with length "len" as array
         */
        var split_string_in_chunks = function(str, len) {
            var size = Math.ceil(str.length / len);
            var chunks  = new Array(size);
            var offset = 0;

            for(var i = 0; i < size; ++i, offset += len) {
                chunks[i] = str.substring(offset, offset + len);
            }

            return chunks;
        };

        /**
         * @ngdoc
         * @name psonocli.helper#remove_from_array
         * @methodOf psonocli.helper
         *
         * @description
         * Search an array for an item
         *
         * @param array The array to search
         * @param search The item to remove
         * @param [cmp_fct] (optional) Compare function
         */
        var remove_from_array = function (array, search, cmp_fct) {
            if (typeof(cmp_fct) === 'undefined') {
                cmp_fct = function(a, b) {
                    return a === b;
                }
            }
            for(var i = array.length - 1; i >= 0; i--) {
                if(cmp_fct(array[i], search)) {
                    array.splice(i, 1);
                }
            }
        };

        return {
            parse_url: parse_url,
            get_domain: get_domain,
            array_starts_with: array_starts_with,
            create_list: create_list,
            duplicate_object: duplicate_object,
            is_valid_username: is_valid_username,
            split_string_in_chunks: split_string_in_chunks,
            remove_from_array: remove_from_array
        };
    };

    var app = angular.module('psonocli');
    app.factory("helper", [helper]);

}(angular));
