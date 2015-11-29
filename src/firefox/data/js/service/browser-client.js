(function(angular, $) {
    'use strict';


    var port;
    if (typeof addon !== "undefined"){
        port = addon.port;
    } else {
        port = self.port;
    }

    var events = [
        'login',
        'logout',
        'storage-getItem'
    ];

    var browserClient = function($rootScope, storage) {
        /**
         * Resize the panel according to the provided width and height
         *
         * @param height
         * @param width
         */
        var resize = function (height, width) {
            if (typeof port === "undefined")
                return;
            port.emit("resize", {height: height || window.innerHeight, width: width || window.innerWidth});
        };

        /**
         * Opens the URL in a new browser tab
         * @param url
         */
        var openTab = function(url) {

            if (typeof port === "undefined")
                return;

            port.emit("openTab", {url: url});
        };

        /**
         * Dummy function to see if the background page works
         */
        var testBackgroundPage = function () {
            return false;
        };

        /**
         * sends an event message to browser
         *
         * @param event
         * @param data
         */
        var emit = function (event, data) {
            port.emit(event, data);
            $rootScope.$broadcast(event, '');
        };

        /**
         * emits sensitive data only to secure locations
         *
         * @param event
         * @param data
         */
        var emit_sec = function(event, data) {
            port.emit(event, data);
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

            port.on(event, myFunction);
            $rootScope.$on(event, myFunction);
        };

        /**
         * initializing service
         *
         * @private
         */
        var _init = function () {
            /**
             * due to the fact that firefox doesnt allow local storage access, we have here an api, so content scripts
             * can access the local storage though the panel
             */
            on('storage-getItem', function(payload) {

                var event_data = {};
                event_data.id = payload.id;

                // lets make sure not everything is exposed
                if (payload.data === "datastore-password-leafs") {
                    event_data.data = storage.data(payload.data);
                }
                emit_sec('storage-getItem', JSON.stringify(event_data));
            })
        };

        _init();

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
    app.factory("browserClient", ['$rootScope', 'storage', browserClient]);

}(angular, $));
