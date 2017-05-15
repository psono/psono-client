(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:OpenSecretCtrl
     * @requires $rootScope
     * @requires $route
     *
     * @description
     * Controller for the open secret view
     */
    angular.module('psonocli').controller('OpenSecretCtrl', ['$rootScope', '$route',
        function ($rootScope, $route) {

            activate();
            function activate() {
                var show_lock = function (percent) {
                    var lock = angular.element(document.querySelector('#loading-lock-logo-loaded-fa'));
                    lock.css('width', (percent) + '%');
                    lock.css('marginLeft', (-200 + percent) + '%');
                };

                $rootScope.$on("cfpLoadingBar:loading", function () {
                    show_lock(20);
                });

                $rootScope.$on("cfpLoadingBar:loaded", function (status) {
                    show_lock(80);
                });

                $rootScope.$on("cfpLoadingBar:completed", function () {
                    show_lock(100);
                });
            }
        }]
    );
}(angular));