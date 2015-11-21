(function(angular) {
    'use strict';

    var events = [
        'login',
        'logout'
    ];

    var browserClient = function($rootScope) {
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
        var emit_sec = function(event, data) {

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
            testBackgroundPage: testBackgroundPage,
            emit: emit,
            emit_sec: emit_sec,
            on: on
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", ['$rootScope', browserClient]);

}(angular));
