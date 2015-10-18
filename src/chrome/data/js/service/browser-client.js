(function(angular) {
    'use strict';

    //var config = chrome.extension.getBackgroundPage().config;
    //var db = chrome.extension.getBackgroundPage().db;

    var db = new loki("password_manager_local_storage");
    var config = db.getCollection('config') || db.addCollection('config');

    var browserClient = function() {

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

        };

        return {
            resize: resize,
            openTab: openTab,
            testBackgroundPage: testBackgroundPage,
            emit: emit
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", [browserClient]);

}(angular));