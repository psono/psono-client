(function (angular) {
    'use strict';

    /**
     * message - General Message Service to relay messages and information across the application
     * Might be later extended with WebSocket Client capabilities
     */

    var message = function () {

        var registrations = {};

        /**
         * used to register functions for specific events
         *
         * @param event
         * @param func
         */
        var on = function (event, func) {
            if (!registrations.hasOwnProperty(event)){
                registrations[event] = [];
            }

            registrations[event].push(func);
        };

        /**
         * sends an event message to browser
         *
         * @param event
         * @param data
         */
        var emit = function (event, data) {

            if (!registrations.hasOwnProperty(event)){
                return;
            }
            for(var i = 0, l = registrations[event].length; i < l; i++) {
                registrations[event][i](data);
            }
        };


        return {
            on: on,
            emit: emit
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("message", [message]);

}(angular));