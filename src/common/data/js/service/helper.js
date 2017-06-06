(function(angular, ClientJS) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.helper
     * @description
     *
     * Service with some helper functions that do not fit anywhere else
     */


    var helper = function() {

        var client_js = new ClientJS();

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
         *
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
         *
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
         * @name psonocli.helper#is_valid_password
         * @methodOf psonocli.helper
         *
         * @description
         * Determines if the password is a valid password.
         * If yes the function returns true. If not, the function returns an error string
         *
         * @param {string} password A string that could be a valid password
         * @param {string} password2 The second password that needs to match the first
         *
         * @returns {boolean|string} Returns true or a string with the error
         */
        var is_valid_password = function(password, password2) {

            if (password.length < 12) {
                return "Password too short (min 12 chars).";
            }

            if (password !== password2) {
                return "Passwords don't match.";
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

        /**
         * @ngdoc
         * @name psonocli.helper#get_device_fingerprint
         * @methodOf psonocli.helper
         *
         * @description
         * Returns the device fingerprint
         *
         * @returns {string} Fingerprint of the device
         */
        var get_device_fingerprint = function() {
            return client_js.getFingerprint()
        };

        /**
         * @ngdoc
         * @name psonocli.helper#is_ie
         * @methodOf psonocli.helper
         *
         * @description
         * Returns weather we have an IE or not
         *
         * @returns {boolean} Is this an IE user
         */
        var is_ie = function() {
            return client_js.isIE();
        };

        /**
         * @ngdoc
         * @name psonocli.helper#is_chrome
         * @methodOf psonocli.helper
         *
         * @description
         * Returns weather we have a Chrome or not
         *
         * @returns {boolean} Is this an Chrome user
         */
        var is_chrome = function() {
            return client_js.isChrome();
        };

        /**
         * @ngdoc
         * @name psonocli.helper#is_firefox
         * @methodOf psonocli.helper
         *
         * @description
         * Returns weather we have a Firefox or not
         *
         * @returns {boolean} Is this an Firefox user
         */
        var is_firefox = function() {
            return client_js.isFirefox();
        };

        /**
         * @ngdoc
         * @name psonocli.helper#is_safari
         * @methodOf psonocli.helper
         *
         * @description
         * Returns weather we have a Safari or not
         *
         * @returns {boolean} Is this an Safari user
         */
        var is_safari = function() {
            return client_js.isSafari();
        };

        /**
         * @ngdoc
         * @name psonocli.helper#is_opera
         * @methodOf psonocli.helper
         *
         * @description
         * Returns weather we have a Opera or not
         *
         * @returns {boolean} Is this an Opera user
         */
        var is_opera = function() {
            return client_js.isOpera();
        };

        /**
         * @ngdoc
         * @name psonocli.helper#get_device_description
         * @methodOf psonocli.helper
         *
         * @description
         * Returns the device's description
         *
         * @returns {string}
         */
        var get_device_description = function() {
            var description = '';
            if (typeof(client_js.getDeviceVendor()) !== 'undefined') {
                description = description + client_js.getDeviceVendor() + ' ';
            }
            if (typeof(client_js.getDevice()) !== 'undefined') {
                description = description + client_js.getDevice() + ' ';
            }
            if (typeof(client_js.getOS()) !== 'undefined') {
                description = description + client_js.getOS() + ' ';
            }
            if (typeof(client_js.getOSVersion()) !== 'undefined') {
                description = description + client_js.getOSVersion() + ' ';
            }
            if (typeof(client_js.getBrowser()) !== 'undefined') {
                description = description + client_js.getBrowser() + ' ';
            }
            if (typeof(client_js.getBrowserVersion()) !== 'undefined') {
                description = description + client_js.getBrowserVersion() + ' ';
            }
            return description
        };

        /**
         * @ngdoc
         * @name psonocli.helper#copy_to_clipboard
         * @methodOf psonocli.helper
         *
         * @description
         * Copies some content to the clipboard
         *
         * @param {string} content The content to copy
         */
        var copy_to_clipboard = function (content) {

            var copy = function (e) {
                e.preventDefault();
                if (e.clipboardData) {
                    e.clipboardData.setData('text/plain', content);
                } else if (window.clipboardData) {
                    window.clipboardData.setData('Text', content);
                }

            };
            document.addEventListener('copy', copy);
            document.execCommand('copy');
            document.removeEventListener('copy', copy);
        };


        return {
            parse_url: parse_url,
            get_domain: get_domain,
            array_starts_with: array_starts_with,
            create_list: create_list,
            duplicate_object: duplicate_object,
            is_valid_username: is_valid_username,
            is_valid_password: is_valid_password,
            split_string_in_chunks: split_string_in_chunks,
            remove_from_array: remove_from_array,
            get_device_fingerprint: get_device_fingerprint,
            is_ie: is_ie,
            is_chrome: is_chrome,
            is_firefox: is_firefox,
            is_safari: is_safari,
            is_opera: is_opera,
            get_device_description: get_device_description,
            copy_to_clipboard: copy_to_clipboard
        };
    };

    var app = angular.module('psonocli');
    app.factory("helper", [helper]);

}(angular, ClientJS));
