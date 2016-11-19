(function(angular) {
    'use strict';

    var app = angular.module('psonocli');

    app.controller('HomeDashboardController', ['$scope', 'localStorageService',
    function ($scope, localStorageService) {
        var model = localStorageService.get('widgetHomeDashboard');
        if (!model) {
            model = {
                rows: [{
                    columns: [{
                        styleClass: 'col-md-12',
                        widgets: [{
                            type: 'datastore',
                            title: 'Dashboard',
                            config: {}
                        }]
                    }]
                }],
                noTitle: true
            };
        }

        $scope.datastore = {
            model: model
        };

        $scope.$on('adfDashboardChanged', function (event, name, model) {
            localStorageService.set(name, model);
        });
    }]);

    app.controller('ShareusersDashboardController', ['$scope', 'localStorageService',
    function ($scope, localStorageService) {
        var model = localStorageService.get('widgetShareusersDashboard');
        if (!model) {
            model = {
                rows: [{
                    columns: [{
                        styleClass: 'col-md-12',
                        widgets: [{
                            type: 'shareusers',
                            title: 'Users',
                            config: {}
                        }]
                    }]
                }],
                noTitle: true
            };
        }

        $scope.shareuser = {
            model: model
        };

        $scope.$on('adfDashboardChanged', function (event, name, model) {
            localStorageService.set(name, model);
        });
    }]);

    app.controller('AcceptshareDashboardController', ['$scope', 'localStorageService',
    function ($scope, localStorageService) {

        var model = localStorageService.get('widgetAcceptshareDashboard');
        if (!model) {
            model = {
                rows: [{
                    columns: [{
                        styleClass: 'col-md-12',
                        widgets: [{
                            type: 'acceptshare',
                            title: 'Pending Requests',
                            config: {
                            }
                        }]
                    }]
                }],
                noTitle: true
            };
        }

        $scope.init = function(item) {
            model.rows[0].columns[0].widgets[0].config.item = item;
        };

        $scope.acceptshare = {
            model: model
        };

        $scope.$on('adfDashboardChanged', function (event, name, model) {
            localStorageService.set(name, model);
        });
    }]);

}(angular));