(function(angular) {
    'use strict';


    var browserClient = function() {

        var resize = function (newHeight, newWidth) {
            // pass
        };

        var openTab = function(url) {
            window.open(url, '_blank');
        };

        return {
            resize: resize,
            openTab: openTab
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", [browserClient]);

}(angular));