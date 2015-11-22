(function(angular) {
    'use strict';

    //var config = chrome.extension.getBackgroundPage().config;
    //var db = chrome.extension.getBackgroundPage().db;

    var db = new loki("password_manager_local_storage");
    var config = db.getCollection('config') || db.addCollection('config');

    var events = [
        'login',
        'logout'
    ];

    var browserClient = function($rootScope) {

        /**
         * Resize the panel according to the provided width and height
         *
         * @param height
         * @param width
         */
        var resize = function (height, width) {
            // pass
        };

        /**
         * Opens the URL in a new browser tab
         * @param url
         */
        var openTab = function(url) {
            window.open(url, '_blank');
        };

        /**
         * Dummy function to see if the background page works
         */
        var testBackgroundPage = function () {
            return backgroundPage.bg.test();
        };

        /**
         * sends an event message to browser
         *
         * @param event
         * @param data
         */
        var emit = function (event, data) {
            chrome.runtime.sendMessage({event: event, data: data}, function(response) {
                console.log(response);
            });
            $rootScope.$broadcast(event, '');
        };

        /**
         * emits sensitive data only to secure locations
         *
         * @param event
         * @param data
         */
        var emit_sec = function(event, data) {
            chrome.runtime.sendMessage({event: event, data: data}, function(response) {
                console.log(response);
            });
        };

        /**
         * registers for an event with a function
         *
         * @param event
         * @param myFunction
         *
         * @returns {boolean}
         */
        var on = function (event, myFunction) {

            if(events.indexOf(event) == -1)
                return false;

            $rootScope.$on(event, myFunction);
        };

        return {
            resize: resize,
            openTab: openTab,
            testBackgroundPage: testBackgroundPage,
            emit: emit,
            emit_sec: emit_sec,
            on: on
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", ['$rootScope', browserClient]);

}(angular));