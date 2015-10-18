(function(angular){
    'use strict';

    var app = angular.module('passwordManagerApp', ['ngRoute', 'ng', 'ui.bootstrap', 'snap', 'adf',
        'adf.widget.datastore', 'LocalStorageModule', 'AxelSoft']);

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

    app.controller('DashboardController', function($scope, localStorageService){
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
    });

    app.controller('MainController', ['$scope', 'manager', 'browserClient', 'storage', 'snapRemote', '$window', '$route', '$routeParams', '$location', function($scope, manager, browserClient, storage, snapRemote, $window, $route, $routeParams, $location){

        /* for debugging purposes */
        this.$route = $route;
        this.$location = $location;
        this.$routeParams = $routeParams;

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

            snapper.smallView = screen.width < 640;
            // Do something with snapper
            snapper.settings({
                hyperextensible: false,
                disable: 'right',
                tapToClose: false
            });
            function adjustWith (snapper, behave_inverse) {
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
        $scope.loggedin = manager.isLoggedIn();
        $scope.user_email = manager.getUserEmail();

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
                    $scope.loggedin = true;
                    $scope.user_email = manager.getUserEmail();
                    browserClient.emit("loggedIn", null);
                    browserClient.resize(300);
                } else {
                    $scope.errors = data.error_data.non_field_errors;
                }
            }
            if (email !== undefined && password !== undefined) {
                manager.login(email, password).then(onRequestReturn, onError);
            }
        };

        $scope.logout = function () {


            function onError(data) {
                alert("Error, should not happen.");
            }
            function onRequestReturn(data) {
                console.log(data);
                $scope.loggedin = false;
                $scope.user_email = '';
                browserClient.emit("loggedOut", null);
                browserClient.resize(200);

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
