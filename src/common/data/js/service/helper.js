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
         * compares two arrays for equality
         * Slightly adjusted version of Tomas Zato's answer here
         * http://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
         *
         * @param array1
         * @param array2
         * @returns {boolean}
         */
        var is_array_equal = function (array1, array2) {
            if (!array2)
                return false;

            if (array1.length != array2.length)
                return false;

            for (var i = 0, l=array1.length; i < l; i++) {
                if (array1[i] instanceof Array && array2[i] instanceof Array) {
                    if (!array1[i].equals(array2[i]))
                        return false;
                }
                else if (array1[i] != array2[i]) {
                    return false;
                }
            }
            return true;
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
            is_array_equal: is_array_equal,
            duplicate_object: duplicate_object
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("helper", [helper]);

}(angular));
