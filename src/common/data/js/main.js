(function(angular){
    'use strict';

    var app = angular.module('passwordManagerApp', ['ngRoute', 'ng', 'ui.bootstrap', 'snap', 'adf',
        'adf.widget.datastore', 'LocalStorageModule', 'AxelSoft', 'ng-context-menu']);

    app.config(['$routeProvider', '$locationProvider', 'dashboardProvider', 'localStorageServiceProvider',
        function($routeProvider, $locationProvider, dashboardProvider, localStorageServiceProvider) {
            //Router config
            $routeProvider
                .when('/test', {
                    templateUrl: 'view/test.html',
                    controller: 'BookCtrl'
                })
                .when('/Book/:bookId/ch/:chapterId', {
                    templateUrl: 'view/chapter.html',
                    controller: 'ChapterCtrl',
                    controllerAs: 'chapter'
                })
                .otherwise({
                    templateUrl: 'view/index.html',
                    controller: 'ChapterCtrl'
                });
            //$locationProvider.html5Mode(true);

            // ADF config
            localStorageServiceProvider.setPrefix('adf.datastore');
            dashboardProvider
                .structure('6-6', {
                    rows: [{
                        columns: [{
                            styleClass: 'col-md-6'
                        }, {
                            styleClass: 'col-md-6'
                        }]
                    }]
                })
                .structure('4-8', {
                    rows: [{
                        columns: [{
                            styleClass: 'col-md-4',
                            widgets: []
                        }, {
                            styleClass: 'col-md-8',
                            widgets: []
                        }]
                    }]
                })
                .structure('12/4-4-4', {
                    rows: [{
                        columns: [{
                            styleClass: 'col-md-12'
                        }]
                    }, {
                        columns: [{
                            styleClass: 'col-md-4'
                        }, {
                            styleClass: 'col-md-4'
                        }, {
                            styleClass: 'col-md-4'
                        }]
                    }]
                })
                .structure('12/6-6', {
                    rows: [{
                        columns: [{
                            styleClass: 'col-md-12'
                        }]
                    }, {
                        columns: [{
                            styleClass: 'col-md-6'
                        }, {
                            styleClass: 'col-md-6'
                        }]
                    }]
                })
                .structure('12/6-6/12', {
                    rows: [{
                        columns: [{
                            styleClass: 'col-md-12'
                        }]
                    }, {
                        columns: [{
                            styleClass: 'col-md-6'
                        }, {
                            styleClass: 'col-md-6'
                        }]
                    }, {
                        columns: [{
                            styleClass: 'col-md-12'
                        }]
                    }]
                })
                .structure('3-9 (12/6-6)', {
                    rows: [{
                        columns: [{
                            styleClass: 'col-md-3'
                        }, {
                            styleClass: 'col-md-9',
                            rows: [{
                                columns: [{
                                    styleClass: 'col-md-12'
                                }]
                            }, {
                                columns: [{
                                    styleClass: 'col-md-6'
                                }, {
                                    styleClass: 'col-md-6'
                                }]
                            }]
                        }]
                    }]
                });

        }]);

    app.controller('DashboardController', ['$scope', 'localStorageService', function($scope, localStorageService){
        var model = localStorageService.get('widgetHomeDashboard');
        if (!model){
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
                noTitle: true,
                sexy: "I bin sexy"
            };
        }

        $scope.dashboard = {
            model: model,
            sexy: {narf: "sehr serxy"}
        };
        $scope.$on('adfDashboardChanged', function (event, name, model) {
            localStorageService.set(name, model);
        });
    }]);

    app.controller('MainController', ['$scope', '$rootScope', '$filter', '$timeout', 'manager', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function($scope, $rootScope, $filter, $timeout, manager, browserClient, storage,
                 snapRemote, $window, $route, $routeParams, $location)
        {

            /* openTab function to pass through */
            $scope.openTab = browserClient.openTab;

            /* test background page */
            //console.log(browserClient.testBackgroundPage());


            /* for navigation, can maybe moved to another controller */
            $scope.getClass = function (path) {
                if (path === '/' && $location.path().length == 0) {
                    return 'active';
                } else if (path !== '/' && $location.path().substr(0, path.length) === path) {
                    return 'active';
                } else {
                    return '';
                }
            };

            /* snapper */
            snapRemote.getSnapper().then(function(snapper) {
                var scrollWidth = 266;
                var orientationEvent = "onorientationchange" in angular.element($window) ? "orientationchange" : "resize";
                var snappersettings = {
                    hyperextensible: false,
                    disable: 'right',
                    tapToClose: false
                };

                snapper.smallView = screen.width < 640;
                // Do something with snapper
                snapper.settings(snappersettings);
                function adjustWith (snapper, behave_inverse) {
                    //console.log('adjustWith');
                    var total_width = angular.element(document.querySelectorAll(".snap-content")[0])[0].clientWidth;
                    if ((snapper.state().state !== 'closed') != behave_inverse) {
                        $scope.snap_content_with = (total_width-scrollWidth) + 'px';
                    } else {
                        $scope.snap_content_with = total_width + 'px';
                    }
                }

                snapper.on('start', function(){
                    console.log('start');
                });

                snapper.on('end', function(){
                    console.log('end');
                });

                snapper.on('open', function(){
                    adjustWith(snapper, true);
                });
                snapper.on('close', function(){
                    adjustWith(snapper, true);
                });

                snapper.open('left');
                adjustWith(snapper);

                $scope.$on("login", function(event, message){
                    snapRemote.getSnapper().then(function(snapper) {
                        snapper.settings(snappersettings);
                        snapper.open('left');
                        adjustWith(snapper);
                    });
                });

                /* TODO enable snapper if the device is too small */
                snapper.disable();

                angular.element($window).bind(orientationEvent, function () {
                    snapRemote.getSnapper().then(function(snapper) {
                        adjustWith(snapper);
                    });
                    /*
                     var smallView = screen.width < 640;
                     var element = document.getElementById('content');
                     var minPosition = 266;
                     if (snapper.smallView != smallView) {
                     if(smallView) {
                     disable = 'none';
                     } else if(!smallView) {
                     disable = 'right';
                     element.style.width = ((window.innerWidth || document.documentElement.clientWidth)-minPosition)+'px';
                     }
                     snapper.settings({
                     element: element,
                     hyperextensible: false,
                     disable: disable,
                     minPosition: -minPosition
                     });
                     snapper.smallView = smallView;
                     }
                     */
                });

            });

            /* login / logout */
            $scope.loggedin = manager.is_logged_in();

            $rootScope.$on("login", function(event, message){
                $scope.loggedin = true;
            });

            $rootScope.$on("logout", function(event, message){
                $scope.loggedin = false;
            });

            /*
            $scope.$on("login", function(event, message){
                $scope.loggedin = true;
            });
            $scope.$on("logout", function(event, message){
                $scope.loggedin = false;
            });
            */
            /*
            angular.element($window).bind('login', function () {
                $scope.loggedin = true;
            });

            angular.element($window).bind('logout', function () {
                $scope.loggedin = false;
            });
            */
        }]);

    app.controller('Main2Controller', ['$scope', '$rootScope', '$filter', '$timeout', 'manager', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function($scope, $rootScope, $filter, $timeout, manager, browserClient, storage,
                 snapRemote, $window, $route, $routeParams, $location)
        {

            /* openTab function to pass through */
            $scope.openTab = browserClient.openTab;

            /* test background page */
            //console.log(browserClient.testBackgroundPage());

            /* for navigation, can maybe moved to another controller */
            $scope.getClass = function (path) {
                if (path === '/' && $location.path().length == 0) {
                    return 'active';
                } else if (path !== '/' && $location.path().substr(0, path.length) === path) {
                    return 'active';
                } else {
                    return '';
                }
            };

            $scope.user_email = manager.find_one('config', 'user_email');

            $scope.logout = function () {


                function onError(data) {
                    alert("Error, should not happen.");
                }
                function onRequestReturn(data) {
                    browserClient.emit("logout", null);
                    //$scope.$emit('logout', '');
                    $rootScope.$broadcast('logout', '');
                    browserClient.resize(250);

                }

                manager.logout().then(onRequestReturn, onError);

            };

            /* datastore search */

            $scope.searchArray = [
                "google.com email",
                "gmx.de email",
                "test.de kA",
                "lolig.com test",
                "amazon.com",
                "ebay.com",
                "Spotify",
                "Bank Onlinebanking"
            ];

            $scope.datastore = { search: '' };

            var regex;

            $scope.$watch('datastore.search', function (value) {
                regex = new RegExp(value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'i');
            });

            $scope.filterBySearch = function(searchEntry) {
                if (!$scope.datastore.search) return false;
                return regex.test(searchEntry);
            };

        }]);

    app.controller('LoginController', ['$scope', '$rootScope', '$filter', '$timeout', 'manager', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function($scope, $rootScope, $filter, $timeout, manager, browserClient, storage,
                 snapRemote, $window, $route, $routeParams, $location)
        {

            /* openTab function to pass through */
            $scope.openTab = browserClient.openTab;

            /* test background page */
            //console.log(browserClient.testBackgroundPage());


            /* Server selection with preselection of dev server */
            $scope.servers = [
                {
                    title: 'Sanso.pw', url: 'https://www.sanso.pw'
                },
                {
                    title: 'Dev Sanso.pw', url: 'http://dev.sanso.pw:8001'
                }
            ];
            $scope.filtered_servers = $scope.servers;
            $scope.selected_server = $scope.servers[1];
            $scope.selected_server_title = $scope.selected_server.title;
            $scope.selected_server_url = $scope.selected_server.url;

            $scope.select_server = function (server) {
                //triggered when selecting an server
                $scope.selected_server = server;
                $scope.selected_server_title = server.title;
                $scope.selected_server_url = server.url;
            };
            $scope.changing = function (url) {
                //triggered when typing an url
                $scope.selected_server = {title: url, url: url};
                $scope.filtered_servers = $filter('filter')($scope.servers, {url: url});
            };


            /* for navigation, can maybe moved to another controller */
            $scope.getClass = function (path) {
                if (path === '/' && $location.path().length == 0) {
                    return 'active';
                } else if (path !== '/' && $location.path().substr(0, path.length) === path) {
                    return 'active';
                } else {
                    return '';
                }
            };

            /* preselected values */
            $scope.loginFormEmail = "test@saschapfeiffer.com";
            $scope.loginFormPassword = "myPassword";

            $scope.login = function (email, password) {

                function onError(data) {
                    alert("Error, should not happen.");
                }

                function onRequestReturn(data) {
                    // TODO bring message to the user
                    if (data.response === "success") {
                        $scope.errors = [];
                        browserClient.emit("login", null);
                        //$scope.$emit('login', '');
                        $rootScope.$broadcast('login', '');
                        browserClient.resize(300);
                    } else {
                        if (data.error_data == null) {
                            $scope.errors = ['Server offline.']
                        } else {
                            $scope.errors = data.error_data.non_field_errors;
                        }
                    }
                }
                if (email !== undefined && password !== undefined) {
                    manager.login(email, password, angular.copy($scope.selected_server)).then(onRequestReturn, onError);
                }
            };
        }]);


    app.controller('BookCtrl', ['$routeParams', function($routeParams) {
        this.name = "BookCtrl";
        this.params = $routeParams;
    }])
    .controller('ChapterCtrl', ['$routeParams', function($routeParams) {
        this.name = "ChapterCtrl";
        this.params = $routeParams;
    }]);
})(angular);

/* creates the base href tag for angular location */
angular.element(document.getElementsByTagName('head')).append(angular.element('<base href="' + encodeURI(window.location.pathname) + '" />'));
