(function(angular) {
    'use strict';


    var helper = function() {

        /**
         * parses an URL
         *
         * @param url
         * @returns {{scheme: *, authority: *, path: *, query: *, fragment: *}}
         */
        var parse_url = function (url) {
            var authority;
            var splitted_authority;
            var splitted_domain;
            var full_domain;
            var top_domain;

            // According to RFC http://www.ietf.org/rfc/rfc3986.txt Appendix B
            var pattern = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
            var matches =  url.match(pattern);

            if (typeof(matches[4]) !== 'undefined') {
                authority = matches[4].replace(/^(www\.)/,"");
                splitted_authority = authority.split(":");
            }

            var port = null;
            if (typeof(splitted_authority) !== 'undefined' && splitted_authority.length == 2) {
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
         * Parses an URL to get the full domain from it.
         * example: https://docs.google.com -> docs.google.com
         *
         * @param url The URL we want to parse
         * @returns {str} domain The full domain
         */
        var get_domain = function (url) {
            var parsed_url = parse_url(url);
            return parsed_url.full_domain;
        };

        /**
         * checks if array1 starts with array2
         *
         * @param array1
         * @param array2
         * @returns {boolean}
         */
        var array_starts_with = function(array1, array2) {
            if (!array1){
                return false;
            }
            if (!array2){
                return false;
            }

            if (array1.length < array2.length){
                return false;
            }

            for (var i = 0; i < array1.length; i++) {
                if (i == array2.length) {
                    return true;
                }
                if (array1[i] instanceof Array && array2[i] instanceof Array) {
                    if (!array1[i].equals(array2[i])){
                        return false;
                    }
                } else if (array1[i] != array2[i]) {
                    return false;
                }
            }
            return true;
        };

        /**
         * creates a list entries based on datastore tree object
         *
         * @param obj datastore tree object
         * @param list the list object we want to fill
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
         * takes an object and duplicates it
         *
         * @param obj initial object
         * @returns {*} duplicate of object
         */
        var duplicate_object = function(obj) {
            return JSON.parse(JSON.stringify(obj));
        };

        /**
         * Determines if the username is a valid username.
         * If yes the function returns true. If not, the function returns an error string
         *
         * @param username
         * @returns {*}
         */
        var is_valid_username = function(username) {
            var USERNAME_REGEXP = /^[a-z0-9.\-]*$/i;
            if( ! USERNAME_REGEXP.test(username)) {
                return 'Usernames may only contain letters, numbers, periods and dashes.';
            }
            if (username.length < 3) {
                return 'Usernames may not be shorter than 3 chars.';
            }
            if (username.substring(0, 1) == ".") {
                return 'Usernames may not start with a period.';
            }
            if (username.substring(0, 1) == "-") {
                return 'Usernames may not start with a dash.';
            }
            if (username.substring(-1) == '.') {
                return 'Usernames may not end with a period.';
            }
            if (username.substring(-1) == '-') {
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

        return {
            parse_url: parse_url,
            get_domain: get_domain,
            array_starts_with: array_starts_with,
            create_list: create_list,
            duplicate_object: duplicate_object,
            is_valid_username: is_valid_username
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("helper", [helper]);

}(angular));
