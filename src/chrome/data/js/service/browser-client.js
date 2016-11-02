(function(angular, $, window) {
    'use strict';

    var browserClient = function($rootScope, $q) {

        var registrations = {};

        chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
                "from the extension");

            console.log("received something");
            console.log(request);

            for (var i = 0; registrations.hasOwnProperty(request.event) && i < registrations[request.event].length; i++) {
                registrations[request.event][i](request.data);
            }
        });

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
         * returns the base url which can be used to generate activation links
         *
         * @returns {string}
         */
        var getBaseUrl = function() {
            return $q(function (resolve) {
                resolve("chrome-extension://"+chrome.runtime.id+"/");
            });
        };

        /**
         * returns the active tabs url
         *
         * @returns {promise}
         */
        var getActiveTabUrl = function() {
            return $q(function (resolve) {
                chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
                    resolve(arrayOfTabs[0].url)}
                );
            });
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
        var emitSec = function(event, data) {
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

            $rootScope.$on(event, myFunction);

            if (!registrations.hasOwnProperty(event)) {
                registrations[event] = [];
            }
            registrations[event].push(myFunction);
        };

        return {
            resize: resize,
            openTab: openTab,
            getBaseUrl: getBaseUrl,
            getActiveTabUrl: getActiveTabUrl,
            testBackgroundPage: testBackgroundPage,
            emit: emit,
            emitSec: emitSec,
            on: on
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", ['$rootScope', '$q', browserClient]);

}(angular, $, window));