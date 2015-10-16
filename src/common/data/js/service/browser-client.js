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

        return {
            resize: resize,
            openTab: openTab
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", [browserClient]);

}(angular));
