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
            // According to RFC http://www.ietf.org/rfc/rfc3986.txt Appendix B
            var pattern = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
            var matches =  url.match(pattern);

            return {
                scheme: matches[2],
                authority: matches[4].replace(/^(www\.)/,""), //remove leading www.
                path: matches[5],
                query: matches[7],
                fragment: matches[9]
            };
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

        return {
            parse_url: parse_url,
            array_starts_with: array_starts_with,
            create_list: create_list,
            duplicate_object: duplicate_object
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("helper", [helper]);

}(angular));
