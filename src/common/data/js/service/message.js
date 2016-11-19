(function (angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.message
     * @description
     *
     * Service for general message. Relays messages and information across the application
     * Might be later extended with WebSocket Client capabilities.
     */

    var message = function () {

        var registrations = {};

        /**
         * @ngdoc
         * @name psonocli.message#on
         * @methodOf psonocli.message
         *
         * @description
         * used to register functions for specific events
         *
         * @param {string} event The event to subscribe to
         * @param {function} func The callback function to subscribe
         */
        var on = function (event, func) {
            if (!registrations.hasOwnProperty(event)){
                registrations[event] = [];
            }

            registrations[event].push(func);
        };

        /**
         * @ngdoc
         * @name psonocli.message#emit
         * @methodOf psonocli.message
         *
         * @description
         * sends an event message to browser
         *
         * @param {string} event The event to trigger
         * @param {*} data The payload data to send to the subscribed callback functions
         */
        var emit = function (event, data) {

            if (!registrations.hasOwnProperty(event)){
                return;
            }
            for (var i = registrations[event].length - 1; i >= 0; i--) {
                registrations[event][i](data);
            }
        };


        return {
            on: on,
            emit: emit
        };
    };

    var app = angular.module('psonocli');
    app.factory("message", [message]);

}(angular));