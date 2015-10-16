(function(angular, $) {
    'use strict';


    var browserClient = function() {
        /**
         * Resize the panel according to the provided width and height
         *
         * @param height
         * @param width
         */
        var resize = function (height, width) {
            if (typeof addon !== "undefined"){
                addon.port.emit("resize", {height: height || window.innerHeight, width: width || window.innerWidth});
            }
        };

        /**
         * Opens the URL in a new browser tab
         * @param url
         */
        var openTab = function(url) {
            if (typeof addon !== "undefined"){
                addon.port.emit("openTab", {url: url});
            }
        };

        return {
            resize: resize,
            openTab: openTab
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", [browserClient]);

}(angular, $));
