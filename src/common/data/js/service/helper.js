(function(angular) {
    'use strict';


    var helper = function() {


        function parse_url(url) {
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
        }

        return {
            parse_url: parse_url
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("helper", [helper]);

}(angular));
