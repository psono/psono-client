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
    angular.module('psonocli').controller('NotificationBannerCtrl', ['$scope', 'device', 'storage',
        function ($scope, device, storage) {
            $scope.show_android_download = !storage.find_key('config', 'hide_android_download') && device.is_mobile_android();
            $scope.close = close;


            /**
             * @ngdoc
             * @name psonocli.controller:NotificationBannerCtrl#close
             * @methodOf psonocli.controller:NotificationBannerCtrl
             *
             * @description
             * Triggered once someone clicks the close button
             */
            function close() {
                storage.upsert('config', {key: 'hide_android_download', value: true});
                storage.save();
                $scope.show_android_download = false;
            }
        }]);

}(angular));
