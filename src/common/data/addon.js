(function(angular) {
    'use strict';


    var browserClient = function() {

        var resize = function (newHeight, newWidth) {
            console.log("addon.js browserClient.resize triggered");
        };

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
