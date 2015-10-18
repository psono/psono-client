(function(angular, $) {
    'use strict';


    var port;
    if (typeof addon !== "undefined"){
        port = addon.port;
    } else {
        port = self.port;
    }


    var browserClient = function() {
        /**
         * Resize the panel according to the provided width and height
         *
         * @param height
         * @param width
         */
        var resize = function (height, width) {
            port.emit("resize", {height: height || window.innerHeight, width: width || window.innerWidth});
        };

        /**
         * Opens the URL in a new browser tab
         * @param url
         */
        var openTab = function(url) {
            port.emit("openTab", {url: url});
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
            port.emit(event, data);
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

}(angular, $));
