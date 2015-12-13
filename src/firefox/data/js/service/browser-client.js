(function(angular, $, window) {
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
        'storage-getItem',
        'secret-getItem'
    ];

    var browserClient = function($rootScope, $q, storage, apiClient, cryptoLibrary) {
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
         * returns the base url which can be used to generate activation links
         * 
         * @returns {string}
         */
        var getBaseUrl = function() {
            return "resource://sansopw/";
        };

        /**
         * returns the active tabs url
         *
         * @returns {promise}
         */
        var getActiveTabUrl = function() {
            port.emit('get-active-tab-url', {});
            return $q(function (resolve) {
                port.on('get-active-tab-url', function(payload) {
                    resolve(payload.data);
                });
            });
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
        var emitSec = function(event, data) {
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

            if(events.indexOf(event) == -1) {
                console.log("browserclient received registration for unknown event: " + event);
                return false;
            }

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
             * due to the fact that firefox doesn't allow local storage access, we have here an api, so content scripts
             * can access the local storage though the panel
             */

            /**
             * Privat function, that will return the object with the specified key from the specified db
             *
             * @param db
             * @param key
             *
             * @returns {*}
             *
             * @private
             */
            var _find_one = function(db, key) {

                var obj = storage.find_one(db, {'key': key});
                if (obj === null) {
                    return ''
                }
                return obj['value'];
            };


            /**
             * triggered by event 'storage-getItem'
             * queries the storage for the leafs and returns them
             * emits 'storage-getItem'
             *
             * @param payload
             */
            var on_storage_get_item = function(payload) {
                var event_data = {};
                event_data.id = payload.id;

                // lets make sure not everything is exposed
                if (payload.data === "datastore-password-leafs") {
                    event_data.data = storage.data(payload.data);
                }
                emitSec('storage-getItem', JSON.stringify(event_data));
            };

            on('storage-getItem', on_storage_get_item);

            /**
             * triggered by event 'secret-getItem'
             * queries the api backend for a secret, decrypts the secret and returns the secret in an event
             * emits 'secret-getItem'
             *
             * @param payload
             */
            var on_secret_get_item = function(payload) {

                var onSuccess = function(value) {

                    var event_data = {};
                    event_data.id = payload.id;

                    var secret_key = _find_one('datastore-password-leafs', payload.data);

                    value = value.data;
                    event_data.data = cryptoLibrary.decrypt_data(
                        value.data,
                        value.data_nonce,
                        secret_key
                    );
                    emitSec('secret-getItem', JSON.stringify(event_data));
                };

                var onError = function(value) {
                    // failed
                };

                apiClient.read_secret(_find_one('config', 'user_token'), payload.data)
                    .then(onSuccess, onError);

            };

            on('secret-getItem', on_secret_get_item);
        };

        _init();

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
    app.factory("browserClient", ['$rootScope', '$q', 'storage', 'apiClient', 'cryptoLibrary', browserClient]);

}(angular, $, window));
