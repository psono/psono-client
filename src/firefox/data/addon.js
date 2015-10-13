(function(angular, $) {
    'use strict';


    var browserClient = function() {

        var resize = function (newHeight, newWidth) {
            if (typeof addon !== "undefined"){
                addon.port.emit("winsize", {height: newHeight || window.innerHeight, width: newWidth || window.innerWidth});
            }
        };

        return {
            resize: resize
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", [browserClient]);

}(angular, $));
