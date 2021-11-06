(function(angular) {
    'use strict';

    /**
     * @ngdoc directive
     * @name psonocli.directive:autoFocus
     * @restrict EA
     *
     * @description
     * Directive to handle automatic focus on inputs
     */
    var autoFocus = function($timeout) {
        return {
            restrict: 'AC',
            link: function(scope, element) {
                function apply_focus() {
                    element[0].focus();
                }
                $timeout(apply_focus, 300);
            }
        };
    };

    var app = angular.module('psonocli');
    app.directive('autoFocus', ['$timeout', autoFocus]);

}(angular));
