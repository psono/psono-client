(function(angular, chrome) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.chrome
     *
     * @description
     * Service that allows the mocking of chrome
     */
    var chrome_service = function() {

        return chrome
    };

    var app = angular.module('psonocli');
    app.factory("chrome", [chrome_service]);

}(angular, chrome));
