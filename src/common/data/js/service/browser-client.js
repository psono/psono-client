(function(angular, $, window) {
    'use strict';

    var events = [
        'login',
        'logout'
    ];

    var browserClient = function($rootScope, $q) {
        /**
         * Resize the panel according to the provided width and height
         *
         * @param height
         * @param width
         */
        var resize = function (height, width) {
            console.log("addon.js browserClient.resize triggered");
        };

        /**
         * Opens the URL in a new browser tab
         * @param url
         */
        var openTab = function(url) {
            window.open('/src/common' + url, '_blank');
        };

        /**
         * returns the base url which can be used to generate activation links
         *
         * @returns {string}
         */
        var getBaseUrl = function() {
            return "http://browserplugins.chickahoona.com/src/common/";
        };

        /**
         * returns a promise which will return the active tabs url
         *
         * @returns {promise}
         */
        var getActiveTabUrl = function() {
            return $q(function (resolve) {
                resolve(window.location.href);
            });
        };

        /**
         * Dummy function to see if the background page works
         */
        var testBackgroundPage = function () {
            return false;
        };

        /**
         * sends an event message to browser
         *
         * @param event
         * @param data
         */
        var emit = function (event, data) {
            console.log("browser-client.js $rootScope.$broadcast " + event);
            $rootScope.$broadcast(event, '');
        };

        /**
         * emits sensitive data only to secure locations
         *
         * @param event
         * @param data
         */
        var emitSec = function(event, data) {

        };

        /**
         * registers for an event with a function
         *
         * @param event
         * @param myFunction
         *
         * @returns {boolean}
         */
        var on = function (event, myFunction) {

            if(events.indexOf(event) == -1)
                return false;

            $rootScope.$on(event, myFunction);
        };

        return {
            resize: resize,
            openTab: openTab,
            getBaseUrl: getBaseUrl,
            getActiveTabUrl: getActiveTabUrl,
            testBackgroundPage: testBackgroundPage,
            emit: emit,
            emitSec: emitSec,
            on: on
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", ['$rootScope', '$q', browserClient]);

}(angular, $, window));
