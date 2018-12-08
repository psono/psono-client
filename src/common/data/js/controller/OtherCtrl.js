(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:OtherCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires $location
     *
     * @description
     * Controller for the Account view
     */
    angular.module('psonocli').controller('OtherCtrl', ['$scope', '$routeParams', '$location',
        function ($scope, $routeParams, $location) {

            $scope.open_tab = open_tab;

            var default_tab = 'sessions';
            var tabs = {
                'sessions': 0,
                'api-keys': 1,
                'data-stores': 2,
                'known-hosts': 3,
                'export': 4,
                'import': 5
            };


            activate();
            function activate() {
                open_linked_tab()
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherCtrl#open_linked_tab
             * @methodOf psonocli.controller:OtherCtrl
             *
             * @description
             * Triggered once someone selects a different tab with the slug of the new selected tab.
             * Will update the history of the browser.
             *
             * @param {string} slug The slug of the tab that was opened
             */
            function open_tab(slug) {
                if(typeof($routeParams.tab_slug) === 'undefined') {
                    $location.path('/other/' + default_tab).replace();
                } else {
                    $location.path('/other/' + slug);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherCtrl#open_linked_tab
             * @methodOf psonocli.controller:OtherCtrl
             *
             * @description
             * Called during the activation of the tab. Selects the correct tab according to the provided slug.
             */
            function open_linked_tab() {

                if(typeof($routeParams.tab_slug) === 'undefined') {
                    return;
                }
                if(!tabs.hasOwnProperty($routeParams.tab_slug)) {
                    return;
                }
                $scope.active_tab = tabs[$routeParams.tab_slug];
            }
        }]
    );
}(angular));