(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:IndexCtrl
     * @requires $scope
     * @requires $routeParams
     *
     * @description
     * Controller for the index
     */
    angular.module('psonocli').controller('IndexCtrl', ['$scope', '$routeParams',
        function ($scope, $routeParams) {

            $scope.name = "IndexCtrl";
            $scope.params = $routeParams;
            $scope.routeParams = $routeParams;
        }]
    );

}(angular));