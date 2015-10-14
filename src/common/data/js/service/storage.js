(function(angular) {
    'use strict';

    var storage = function(localStorageService, cryptoLibrary) {
        localStorageService.set('user', 'me');

        return {

        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("storage", ['localStorageService', 'cryptoLibrary', storage]);

}(angular));