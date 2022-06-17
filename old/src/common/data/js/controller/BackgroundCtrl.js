(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:BackgroundCtrl
     * @requires psonocli.background
     *
     * @description
     * Main Controller in the background. Only responsibility is to fire the background service.
     */
    angular.module('psonocli').controller('BackgroundCtrl', ["managerBackground",
        function(managerBackground){
            // don't do anything
        }]);

}(angular));