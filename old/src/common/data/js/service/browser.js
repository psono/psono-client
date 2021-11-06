(function(angular) {

    /**
     * @ngdoc service
     * @name psonocli.browser
     *
     * @description
     * Service that allows the mocking of browser
     */
    var browser_service = function() {

        if (typeof(browser) === 'undefined') {
            var browser = chrome;
        }

        return browser
    };

    var app = angular.module('psonocli');
    app.factory("browser", [browser_service]);

}(angular));
