(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:NotificationBannerCtrl
     * @requires $scope
     * @requires psonocli.device
     *
     * @description
     * Controller for the "Notification Banner" at the top, promoting apps or extensions
     */
    angular.module('psonocli').controller('NotificationBannerCtrl', ['$scope', 'device', 'storage', 'browserClient',
        function ($scope, device, storage, browserClient) {
            $scope.disable_download_bar = true;
            $scope.show_android_download = !storage.find_key('config', 'hide_android_download') && device.is_mobile_android();
            $scope.show_chrome_download = !storage.find_key('config', 'hide_chrome_download') && !device.is_mobile() && device.is_chrome() && browserClient.get_client_type() === 'webclient';
            $scope.show_firefox_download = !storage.find_key('config', 'hide_firefox_download') && !device.is_mobile() && device.is_firefox() && browserClient.get_client_type() === 'webclient';
            $scope.close_android = close_android;
            $scope.close_chrome = close_chrome;
            $scope.close_firefox = close_firefox;

            activate();

            function activate() {

                var onSuccess = function(config) {
                    $scope.disable_download_bar = config['disable_download_bar'];
                };

                var onError = function() {

                };

                browserClient.get_config().then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:NotificationBannerCtrl#close_android
             * @methodOf psonocli.controller:NotificationBannerCtrl
             *
             * @description
             * Triggered once someone clicks the close button om the install android app bar
             */
            function close_android() {
                storage.upsert('config', {key: 'hide_android_download', value: true});
                storage.save();
                $scope.show_android_download = false;
            }
            /**
             * @ngdoc
             * @name psonocli.controller:NotificationBannerCtrl#close_chrome
             * @methodOf psonocli.controller:NotificationBannerCtrl
             *
             * @description
             * Triggered once someone clicks the close button om the install chrome extension bar
             */
            function close_chrome() {
                storage.upsert('config', {key: 'hide_chrome_download', value: true});
                storage.save();
                $scope.show_chrome_download = false;
            }
            /**
             * @ngdoc
             * @name psonocli.controller:NotificationBannerCtrl#close_firefox
             * @methodOf psonocli.controller:NotificationBannerCtrl
             *
             * @description
             * Triggered once someone clicks the close button om the install firefox extension bar
             */
            function close_firefox() {
                storage.upsert('config', {key: 'hide_firefox_download', value: true});
                storage.save();
                $scope.show_firefox_download = false;
            }
        }]);

}(angular));
