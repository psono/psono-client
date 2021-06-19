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
         * @name psonocli.helper#is_ipv4_address
         * @methodOf psonocli.helper
         *
         * @description
         * Checks weather a string is a valid ipv4 address
         *
         * @param {string} address An potential ipv4 address that we want to check as string
         * @returns {boolean} Returns the split up url
         */
        function is_ipv4_address(address) {
            return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(address);
        }

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
        function parse_url(url) {
            var authority;
            var splitted_authority;
            var splitted_domain;
            var full_domain;
            var top_domain;
            var base_url;
            var schema;
            var port = null;

            // According to RFC http://www.ietf.org/rfc/rfc3986.txt Appendix B
            var pattern = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
            var matches =  url.match(pattern);

            schema = matches[2];
            base_url = matches[2] + '://';

            if (typeof(matches[4]) !== 'undefined') {
                base_url = base_url + matches[4];
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

            if (typeof(splitted_domain) !== 'undefined' && is_ipv4_address(full_domain)) {
                top_domain = full_domain
            } else if(typeof(splitted_domain) !== 'undefined') {
                if (splitted_domain.length > 1) {
                    top_domain = splitted_domain[splitted_domain.length - 2] + '.' + splitted_domain[splitted_domain.length - 1];
                } else {
                    top_domain = splitted_domain[splitted_domain.length - 1];
                }
            }

            return {
                scheme: schema,
                base_url: base_url,
                authority: authority, //remove leading www.
                full_domain: full_domain,
                top_domain: top_domain,
                port: port,
                path: matches[5],
                query: matches[7],
                fragment: matches[9]
            };
        }

        /**
         * @ngdoc
         * @name psonocli.helper#is_valid_url
         * @methodOf psonocli.helper
         *
         * @description
         * Returns weather we have a valid url or not
         *
         * @param url
         * @returns {boolean}
         */
        function is_valid_url(url) {
            try {
                new URL(url);
            } catch (_) {
                return false;
            }
            return true;
        }

        /**
         * @ngdoc
         * @name psonocli.helper#is_valid_json
         * @methodOf psonocli.helper
         *
         * @description
         * Returns weather we have a valid json or not
         *
         * @param str
         * @returns {boolean}
         */
        function is_valid_json(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        }

        /**
         * @ngdoc
         * @name psonocli.helper#is_valid_email
         * @methodOf psonocli.helper
         *
         * @description
         * Returns weather we have a valid email or not. We accept everything that follow x@x.
         *
         * @param email
         * @returns {boolean}
         */
        function is_valid_email(email) {
            var splitted = email.split('@');
            if (splitted.length !== 2 || splitted[0].length === 0 || splitted[1].length === 0) {
                return false
            }

            return true;
        }

        /**
         * @ngdoc
         * @name psonocli.helper#is_valid_totp_code
         * @methodOf psonocli.helper
         *
         * @description
         * Returns weather we have a valid TOTP code or not. A code needs to be base32 encoded and 10 bytes / 80 bits long.
         *
         * @param b32str
         * @returns {boolean}
         */
        function is_valid_totp_code(b32str) {
            var pattern = new RegExp("^[A-Z2-7=]+$");
            if (b32str.length % 2 !== 0 || !pattern.test(b32str)) {
                return false
            }
            return true;
        }

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
        function get_domain (url) {
            var parsed_url = parse_url(url);
            return parsed_url.full_domain;
        }

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
        function array_starts_with(array1, array2) {
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
        }

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
        function create_list(obj, list) {
            var i;
            for (i = 0; obj.items && i < obj.items.length; i++) {
                list.push(obj.items[i]);
            }
            for (i = 0; obj.folders && i < obj.folders.length; i++) {
                create_list(obj.folders[i], list);
            }
        }

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
        function duplicate_object(obj) {
            return JSON.parse(JSON.stringify(obj));
        }

        /**
         * @ngdoc
         * @name psonocli.helper#validate_username_start
         * @methodOf psonocli.helper
         *
         * @description
         * Checks that the username does not start with forbidden chars
         *
         * @param {string} username The username
         * @param {Array} forbidden_chars The forbidden chars
         * @returns {string} The error message, if it matches
         */
        function validate_username_start(username, forbidden_chars) {
            for (var i = 0; i < forbidden_chars.length; i++) {
                if (username.substring(0, forbidden_chars[i].length) === forbidden_chars[i]) {
                    return 'Usernames may not start with "'+ forbidden_chars[i] +'"';
                }
            }
        }

        /**
         * @ngdoc
         * @name psonocli.helper#validate_username_end
         * @methodOf psonocli.helper
         *
         * @description
         * Checks that the username does not end with forbidden chars
         *
         * @param {string} username The username
         * @param {Array} forbidden_chars The forbidden chars
         * @returns {string} The error message, if it matches
         */
        function validate_username_end(username, forbidden_chars) {
            for (var i = 0; i < forbidden_chars.length; i++) {
                if (username.substring(username.length - forbidden_chars[i].length) === forbidden_chars[i]) {
                    return 'Usernames may not end with "'+ forbidden_chars[i] +'"';
                }
            }
        }

        /**
         * @ngdoc
         * @name psonocli.helper#validate_username_contain
         * @methodOf psonocli.helper
         *
         * @description
         * Checks that the username does not contain forbidden chars
         *
         * @param {string} username The username
         * @param {Array} forbidden_chars The forbidden chars
         * @returns {string} The error message, if it matches
         */
        function validate_username_contain(username, forbidden_chars) {
            for (var i = 0; i < forbidden_chars.length; i++) {
                if (username.indexOf(forbidden_chars[i]) !== -1) {
                    return 'Usernames may not contain "'+ forbidden_chars[i] +'"';
                }
            }
        }

        /**
         * @ngdoc
         * @name psonocli.helper#validate_group_name_contain
         * @methodOf psonocli.helper
         *
         * @description
         * Checks that the group name does not contain forbidden chars
         *
         * @param {string} group_name The group name
         * @param {Array} forbidden_chars The forbidden chars
         * @returns {string} The error message, if it matches
         */
        function validate_group_name_contain(group_name, forbidden_chars) {
            for (var i = 0; i < forbidden_chars.length; i++) {
                if (group_name.indexOf(forbidden_chars[i]) !== -1) {
                    return 'Group name may not contain "'+ forbidden_chars[i] +'"';
                }
            }
        }

        /**
         * @ngdoc
         * @name psonocli.helper#form_full_username
         * @methodOf psonocli.helper
         *
         * @description
         * Forms the full username out of the username (potentially already containing an  @domain part) and a domain
         *
         * @param {string} username The username
         * @param {string} domain The domain part of the username
         * @returns {string} The full username
         */
        function form_full_username(username, domain) {
            if (username.indexOf('@') === -1){
                return username + '@' + domain;
            } else {
                return username;
            }
        }

        /**
         * @ngdoc
         * @name psonocli.helper#is_valid_username
         * @methodOf psonocli.helper
         *
         * @description
         * Determines if the username is a valid username (validates only the front part before any @).
         * If not, the function returns an error string
         *
         * @param {string} username A string that could be a valid username
         *
         * @returns {null|string} Returns true or a string with the error
         */
        function is_valid_username(username) {

            var res = username.split("@");
            username = res[0];

            var USERNAME_REGEXP = /^[a-z0-9.\-]*$/i;
            var error;
            if( ! USERNAME_REGEXP.test(username)) {
                return 'USERNAME_VALIDATION_NAME_CONTAINS_INVALID_CHARS';
            }

            if (username.length < 2) {
                return 'USERNAME_VALIDATION_NAME_TOO_SHORT';
            }

            error = validate_username_start(username, [".", "-"]);
            if (error) {
                return error;
            }

            error = validate_username_end(username, [".", "-"]);
            if (error) {
                return error;
            }

            error = validate_username_contain(username, ["..", "--", '.-', '-.']);
            if (error) {
                return error;
            }

            return null;
        }

        /**
         * @ngdoc
         * @name psonocli.helper#is_valid_group_name
         * @methodOf psonocli.helper
         *
         * @description
         * Determines if the group name is a valid group name. It should not contain "@" and be shorter than 3 chars
         *
         * @param {string} group_name A string that could be a valid group name
         *
         * @returns {boolean|string} Returns true or a string with the error
         */
        function is_valid_group_name(group_name) {

            var error;

            if (group_name.length < 3) {
                return 'Group name may not be shorter than 3 chars';
            }

            error = validate_group_name_contain(group_name, ["@"]);
            if (error) {
                return error;
            }

            return true;
        }


        /**
         * @ngdoc
         * @name psonocli.helper#has_number
         * @methodOf psonocli.helper
         *
         * @description
         * Determines if a string contains a number.
         *
         * @param {string} some_string A string that could be a password
         */
        function has_number(some_string) {
            return /\d/.test(some_string);
        }

        /**
         * @ngdoc
         * @name psonocli.helper#has_uppercase_letter
         * @methodOf psonocli.helper
         *
         * @description
         * Determines if a string contains an uppercase letter.
         *
         * @param {string} some_string A string that could be a password
         */
        function has_uppercase_letter(some_string) {
            return /[A-Z]/.test(some_string);
        }

        /**
         * @ngdoc
         * @name psonocli.helper#has_lowercase_letter
         * @methodOf psonocli.helper
         *
         * @description
         * Determines if a string contains a lowercase letter.
         *
         * @param {string} some_string A string that could be a password
         */
        function has_lowercase_letter(some_string) {
            return /[a-z]/.test(some_string);
        }

        /**
         * @ngdoc
         * @name psonocli.helper#has_special_character
         * @methodOf psonocli.helper
         *
         * @description
         * Determines if a string contains a special character.
         *
         * @param {string} some_string A string that could be a password
         */
        function has_special_character(some_string) {
            return /[ !@#$%^&*§()_+\-=\[\]{};':"\\|,.<>\/?]/.test(some_string);
        }

        /**
         * @ngdoc
         * @name psonocli.helper#is_valid_password
         * @methodOf psonocli.helper
         *
         * @description
         * Determines if the password is a valid password.
         * If not, the function returns an error string
         *
         * @param {string} password A string that could be a valid password
         * @param {string} password2 The second password that needs to match the first
         * @param {int} min_length The minimum password length
         * @param {int} min_complexity The minimum password complexity (required character groups)
         *
         * @returns {string|null} Returns a string with the error or null
         */
        function is_valid_password(password, password2, min_length, min_complexity) {

            if (typeof(min_length) === 'undefined') {
                min_length = 12;
            }
            if (typeof(min_complexity) === 'undefined') {
                min_complexity = 0;
            }


            if (password.length < min_length) {
                return "PASSWORD_TOO_SHORT";
            }

            if (password !== password2) {
                return "PASSWORDS_DONT_MATCH";
            }

            if (min_complexity > 0) {
                var complexity = 0;

                if (has_number(password)){
                    complexity = complexity + 1;
                }
                if (has_uppercase_letter(password)){
                    complexity = complexity + 1;
                }
                if (has_lowercase_letter(password)){
                    complexity = complexity + 1;
                }
                if (has_special_character(password)){
                    complexity = complexity + 1;
                }

                if (complexity < min_complexity) {
                    return "PASSWORD_NOT_COMPLEX_ENOUGH";
                }
            }

            return null;
        }

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
        function split_string_in_chunks(str, len) {
            var size = Math.ceil(str.length / len);
            var chunks  = new Array(size);
            var offset = 0;

            for(var i = 0; i < size; ++i, offset += len) {
                chunks[i] = str.substring(offset, offset + len);
            }

            return chunks;
        }

        /**
         * @ngdoc
         * @name psonocli.helper#remove_from_array
         * @methodOf psonocli.helper
         *
         * @description
         * Search an array for an item
         *
         * @param {Array} array The array to search
         * @param {*} search The item to remove
         * @param {function|undefined} [cmp_fct] (optional) Compare function
         */
        function remove_from_array(array, search, cmp_fct) {
            if (!array) {
                return;
            }
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
        }

        /**
         * @ngdoc
         * @name psonocli.helper#endsWith
         * @methodOf psonocli.helper
         *
         * @description
         * Checks if a string ends with a special suffix
         *
         * @param {string} to_test The string to test if it ends with the provided suffix
         * @param {string} suffix The suffix we want the string to end with
         *
         * @returns {boolean} Whether the string ends with the suffix or not
         */
        function endsWith (to_test, suffix) {
            return typeof(to_test) !== 'undefined' && typeof(suffix) !== 'undefined' && suffix !== "" && to_test.indexOf(suffix, to_test.length - suffix.length) !== -1;
        }


        /**
         * @ngdoc
         * @name psonocli.helper#get_password_filter
         * @methodOf psonocli.helper
         *
         * @description
         * Returns a test function that can be used to filter according to the name and urlfilter
         *
         * @param {string} test Testable string
         */
        function get_password_filter(test) {

            var searchStrings = test.toLowerCase().split(" ");

            function filter (datastore_entry) {

                var containCounter = 0;
                for (var ii = searchStrings.length - 1; ii >= 0; ii--) {
                    if (typeof(datastore_entry.name) === 'undefined') {
                        continue;
                    }
                    if (datastore_entry.hasOwnProperty('deleted') && datastore_entry['deleted']) {
                        continue;
                    }
                    if (datastore_entry.hasOwnProperty('name') && datastore_entry['name'] && datastore_entry['name'].toLowerCase().indexOf(searchStrings[ii]) > -1) {
                        containCounter++;
                    } else if (datastore_entry.hasOwnProperty('urlfilter') && datastore_entry['urlfilter'] && datastore_entry['urlfilter'].toLowerCase().indexOf(searchStrings[ii]) > -1) {
                        containCounter++;
                    } else if(datastore_entry.hasOwnProperty('id') && datastore_entry['id'] === searchStrings[ii]) {
                        containCounter++;
                    } else if(datastore_entry.hasOwnProperty('secret_id') && datastore_entry['secret_id'] === searchStrings[ii]) {
                        containCounter++;
                    } else if(datastore_entry.hasOwnProperty('file_id') && datastore_entry['file_id'] === searchStrings[ii]) {
                        containCounter++;
                    } else if(datastore_entry.hasOwnProperty('share_id') && datastore_entry['share_id'] === searchStrings[ii]) {
                        containCounter++;
                    }
                }
                return containCounter === searchStrings.length;
            }

            return filter;
        }


        return {
            parse_url: parse_url,
            is_valid_url: is_valid_url,
            is_valid_json: is_valid_json,
            is_valid_email: is_valid_email,
            is_valid_totp_code: is_valid_totp_code,
            get_domain: get_domain,
            array_starts_with: array_starts_with,
            create_list: create_list,
            duplicate_object: duplicate_object,
            form_full_username: form_full_username,
            is_valid_username: is_valid_username,
            is_valid_group_name: is_valid_group_name,
            is_valid_password: is_valid_password,
            split_string_in_chunks: split_string_in_chunks,
            remove_from_array: remove_from_array,
            endsWith: endsWith,
            get_password_filter: get_password_filter
        };
    };

    var app = angular.module('psonocli');
    app.factory("helper", [helper]);

}(angular));
