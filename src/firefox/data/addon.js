(function(angular, $) {
    'use strict';


    var browserClient = function() {

        var resize = function (newHeight, newWidth) {
            if (typeof addon !== "undefined"){
                addon.port.emit("resize", {height: newHeight || window.innerHeight, width: newWidth || window.innerWidth});
            }
        };

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
