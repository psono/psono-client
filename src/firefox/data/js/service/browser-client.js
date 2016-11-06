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
            return $q(function (resolve) {
                resolve("resource://psonopw/data/");
            });
        };

        /**
         * returns a promise with the version string
         *
         * @returns {Promise}
         */
        var loadVersion = function() {
            if (typeof port === "undefined")
                return;

            port.emit('get-version', {});
            return $q(function (resolve) {
                port.on('get-version', function(payload) {
                    resolve(payload.data);
                });
            });
        };

        /**
         * returns a promise with the version string
         *
         * @returns {Promise}
         */
        var loadConfig = function() {

            if (typeof port === "undefined")
                return;

            port.emit('get-config', {});
            return $q(function (resolve) {
                port.on('get-config', function(payload) {
                    resolve(payload);
                });
            });
        };

        /**
         * returns the active tabs url
         *
         * @returns {promise}
         */
        var getActiveTabUrl = function() {
            if (typeof port === "undefined")
                return;

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
            if (typeof port === "undefined")
                return;

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
            if (typeof port === "undefined")
                return
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
            if (typeof port === "undefined")
                return;

            if(events.indexOf(event) == -1) {
                console.log("browserclient received registration for unknown event: " + event);
                return false;
            }

            port.on(event, myFunction);
            $rootScope.$on(event, myFunction);
        };


        var config = {};

        /**
         * helper function to return either the config itself or if key has been specified only the config part for the key
         *
         * @param key
         * @returns {*}
         * @private
         */
        var _get_config = function(key) {

            if (typeof(key) == 'undefined') {
                return config;
            }
            if (config.hasOwnProperty(key)) {
                return config[key];
            }

            return null;
        };

        /**
         * Loads the config (or only the part specified by the "key") fresh or from "cache"
         *
         * @param key
         * @returns {*}
         */
        var get_config = function (key) {
            return $q(function(resolve, reject) {

                if (Object.keys(config).length === 0) {


                    var onSuccess = function(data) {
                        console.log(data);
                        config = data.data;
                        return resolve(_get_config(key));
                    };

                    var onError = function(data) {
                        reject(data);
                    };

                    loadConfig()
                        .then(onSuccess, onError);

                } else {
                    return resolve(_get_config(key));
                }
            });

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
            loadVersion: loadVersion,
            loadConfig: loadConfig,
            getActiveTabUrl: getActiveTabUrl,
            testBackgroundPage: testBackgroundPage,
            emit: emit,
            emitSec: emitSec,
            on: on,
            get_config:get_config
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", ['$rootScope', '$q', 'storage', 'apiClient', 'cryptoLibrary', browserClient]);

}(angular, $, window));
