(function(angular) {
    'use strict';


    var browserClient = function() {

        var resize = function (newHeight, newWidth) {
            console.log("addon.js browserClient.resize triggered");
        };

        return {
            resize: resize
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", [browserClient]);

}(angular));
