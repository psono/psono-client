(function(angular) {
    'use strict';


    var browserClient = function() {

        var resize = function (newHeight, newWidth) {
            // pass
        };

        return {
            resize: resize
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", [browserClient]);

}(angular));