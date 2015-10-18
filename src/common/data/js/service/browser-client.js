(function(angular) {
    'use strict';

    var browserClient = function() {
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

        };

        return {
            resize: resize,
            openTab: openTab,
            testBackgroundPage: testBackgroundPage,
            emit: emit
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", [browserClient]);

}(angular));
