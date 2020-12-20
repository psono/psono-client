(function (angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.notification
     * @requires psonocli.browserClient
     * @requires psonocli.settings
     * @description
     * Service for notifications
     */

    var notification = function (browserClient, settings) {

        /**
         * @ngdoc
         * @name psonocli.notification#push
         * @methodOf psonocli.notification
         *
         * @description
         * Display a notification for notification type
         *
         * @param {string} notificationContent The content of the notification
         * @param {string} notificationType The suffix key to manage this type of notification in settings
         */
        function push(notificationType, notificationContent) {
            switch (notificationType) {
                case 'password_copy':
                    if (settings.get_setting('enable_notification_' + notificationType)) {
                        browserClient.notify(notificationContent)
                    }
                    return
                default:
                    console.error("This notification type: '" + notificationType + "' doesn't exist");
            }

        };

        return {
            push: push
        };
    };

    var app = angular.module('psonocli');
    app.factory("notification", ['browserClient', 'settings', notification]);

}(angular));
