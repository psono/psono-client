(function(angular){
    'use strict';

    var app = angular.module('passwordManagerApp', ['ngRoute', 'ng', 'ui.bootstrap', 'snap', 'adf',
        'adf.widget.datastore', 'adf.widget.shareusers', 'chieffancypants.loadingBar', 'ngAnimate',
        'LocalStorageModule', 'ngTree', 'ngDraggable', 'ng-context-menu', 'ui.select', 'ngSanitize',
        'angular-complexify', 'datatables'])
        .constant('BACKEND_SERVERS', [
            {
                title: 'Sanso.pw', url: 'https://www.sanso.pw'
            },
            {
                title: 'Dev Sanso.pw', url: 'https://dev.sanso.pw'
            },
            {
                title: 'Dev2 Sanso.pw', url: 'http://dev.sanso.pw:8001'
            }
        ]);

    app.config(['$routeProvider', '$locationProvider', 'dashboardProvider', 'localStorageServiceProvider',
        function($routeProvider, $locationProvider, dashboardProvider, localStorageServiceProvider) {
            //Router config
            $routeProvider
                .when('/test', {
                    templateUrl: 'view/test.html',
                    controller: 'TestCtrl'
                })
                .when('/settings', {
                    templateUrl: 'view/settings.html',
                    controller: 'SettingsController'
                })
                .when('/share/shares', {
                    templateUrl: 'view/index-share-shares.html',
                    controller: 'ShareCtrl'
                })
                .when('/share/users', {
                    templateUrl: 'view/index-share-users.html',
                    controller: 'IndexCtrl'
                })
                .when('/secret/:type/:secret_id', {})
                .when('/activation-code/:activation_code', {})
                .otherwise({
                    templateUrl: 'view/index.html',
                    controller: 'IndexCtrl'
                });

            // ADF config
            localStorageServiceProvider.setPrefix('adf');
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

    app.run(['$rootScope','$location', '$routeParams', 'managerSecret' , function($rootScope, $location, $routeParams, managerSecret) {
        $rootScope.$on('$routeChangeSuccess', function() {
            var redirect = '/secret/';
            if ($location.path().substring(0, redirect.length) == redirect && $routeParams.hasOwnProperty('secret_id')) {
                managerSecret.redirectSecret($routeParams.type, $routeParams.secret_id);
            }

        });
    }]);

    app.controller('HomeDashboardController', ['$scope', 'localStorageService', function($scope, localStorageService){
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

    app.controller('ShareusersDashboardController', ['$scope', 'localStorageService', function($scope, localStorageService){
        var model = localStorageService.get('widgetShareusersDashboard');
        if (!model){
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

    app.controller('RegisterController', ['$scope', '$route', '$filter', 'managerDatastoreUser', 'BACKEND_SERVERS',
        function($scope, $route, $filter, managerDatastoreUser, BACKEND_SERVERS)
        {
            /* Server selection with preselection of dev server */
            $scope.servers = BACKEND_SERVERS;
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


            /* preselected values */
            $scope.registerFormEmail = "register@saschapfeiffer.com";
            $scope.registerFormPassword = "myPassword";
            $scope.registerFormPasswordRepeat = "myPassword";

            $scope.register = function (email, password, password2) {

                $scope.errors = [];
                $scope.msgs = [];

                function onError() {
                    alert("Error, should not happen.");
                }

                function onRequestReturn(data) {
                    if (data.response === "success") {
                        $scope.success = true;
                        $scope.msgs.push('Successful, check your e-mail.');
                    } else {
                        if (data.error_data == null) {
                            $scope.errors.push('Server offline.');
                        } else {
                            for (var property in data.error_data) {
                                if (data.error_data.hasOwnProperty(property)) {
                                    for (var i = 0; i < data.error_data[property].length; i++) {
                                        $scope.errors.push(data.error_data[property][i]);
                                    }
                                }
                            }
                        }
                    }
                }
                if (email === undefined || password === undefined || password2 === undefined) {
                    return;
                }

                if( password !== password2 ) {
                    $scope.errors.push("Passwords don't match.");
                    return;
                }

                // TODO forbid weak and poor passwords

                managerDatastoreUser.register(email, password, angular.copy($scope.selected_server)).then(onRequestReturn, onError);
            };
        }]);

    app.controller('ActivationController', ['$scope', '$route', '$routeParams', 'managerDatastoreUser', 'BACKEND_SERVERS',
        function($scope, $route, $routeParams, managerDatastoreUser, BACKEND_SERVERS)
        {

            /* Server selection with preselection of dev server */
            $scope.servers = BACKEND_SERVERS;
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

            var activate = function (activation_code) {
                function onError() {
                    alert("Error, should not happen.");
                }

                function onRequestReturn(data) {
                    $scope.errors = [];
                    $scope.msgs = [];
                    if (data.response === "success") {
                        $scope.msgs.push('Successful, please login.');
                        $scope.success = true;
                    } else {
                        if (data.error_data == null) {
                            $scope.errors.push('Server offline.');
                        } else {
                            for (var property in data.error_data) {
                                if (data.error_data.hasOwnProperty(property)) {
                                    for (var i = 0; i < data.error_data[property].length; i++) {
                                        $scope.errors.push(data.error_data[property][i]);
                                    }
                                }
                            }
                        }
                    }
                }
                if (activation_code !== undefined ) {
                    managerDatastoreUser.activate(activation_code, angular.copy($scope.selected_server)).then(onRequestReturn, onError);
                }
            };

            /* preselected values */
            $scope.$on('$routeChangeSuccess', function() {
                $scope.activationFormKey = $routeParams['activation_code'];
                if ($routeParams.hasOwnProperty('activation_code') && $routeParams['activation_code'].length > 0)  {
                    activate($routeParams['activation_code']);
                }
            });

            $scope.activate = activate;
        }]);

    app.controller('WrapperController', ['$scope', '$rootScope', '$filter', '$timeout', 'managerDatastoreUser', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function($scope, $rootScope, $filter, $timeout, managerDatastoreUser, browserClient, storage,
                 snapRemote, $window, $route, $routeParams, $location)
        {

            /* openTab function to pass through */
            $scope.openTab = browserClient.openTab;

            /* test background page */
            //console.log(browserClient.testBackgroundPage());

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

                $scope.$on("login", function(){
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
            $scope.data = {
                loggedin: managerDatastoreUser.is_logged_in()
            };

            if ($scope.data.loggedin) {
                browserClient.resize(295);
            }

            browserClient.on("login", function(){
                $timeout(function() {
                    $scope.data.loggedin = true;
                });
            });

            browserClient.on("logout", function(){
                $timeout(function() {
                    $scope.data.loggedin = false;
                    browserClient.resize(250);
                });
            });

        }]);


    app.controller('OpenSecretController', ['$scope', 'cfpLoadingBar', '$route',
        function($scope, cfpLoadingBar, $route)
        {
            var lock = angular.element( document.querySelector( '#loading-lock-logo-loaded-fa' ) );
            cfpLoadingBar.on("set", function (status) {
                lock.css('width', (status*100) + '%');
                lock.css('marginLeft', (-200+status*100) + '%');
            })

        }]);

    app.controller('MainController', ['$scope', '$rootScope', '$filter', '$timeout', 'manager', 'managerDatastorePassword', 'managerDatastoreUser', 'managerSecret', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function($scope, $rootScope, $filter, $timeout, manager, managerDatastorePassword, managerDatastoreUser, managerSecret, browserClient, storage,
                 snapRemote, $window, $route, $routeParams, $location)
        {

            /* openTab function to pass through */
            $scope.openTab = browserClient.openTab;

            /* test background page */
            //console.log(browserClient.testBackgroundPage());

            /* for navigation, can maybe moved to another controller */
            $scope.getLinkState = function (path) {
                if (path === '/' && $location.path().length == 0) {
                    return 'active';
                } else if (path !== '/' && $location.path().substr(0, path.length) === path) {
                    return 'active';
                } else {
                    return '';
                }
            };

            $scope.logout = managerDatastoreUser.logout;
            $scope.generatePassword = managerDatastorePassword.generatePasswordActiveTab;

            $scope.user_email = manager.find_one('config', 'user_email');

            $scope.onItemClick = managerSecret.onItemClick;

            $scope.messages = [
            ];

        }]);

    app.controller('PanelController', ['$scope', '$rootScope', '$filter', '$timeout', 'manager', 'managerDatastorePassword', 'managerDatastoreUser', 'managerSecret', 'browserClient',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function($scope, $rootScope, $filter, $timeout, manager, managerDatastorePassword, managerDatastoreUser, managerSecret, browserClient,
                 snapRemote, $window, $route, $routeParams, $location)
        {

            /* openTab function to pass through */
            $scope.openTab = browserClient.openTab;

            $scope.logout = managerDatastoreUser.logout;
            $scope.generatePassword = managerDatastorePassword.generatePasswordActiveTab;

            /* datastore search */

            $scope.searchArray = [];

            $scope.datastore = {
                search: '',
                filteredSearcArray: []
            };

            manager.storage_on('datastore-password-leafs', 'update', function(ele) {
                //console.log("main.js update");
                //console.log(ele);
            });


            manager.storage_on('datastore-password-leafs', 'insert', function(ele) {
                //console.log("main.js insert");
                $scope.searchArray.push(ele);
            });


            manager.storage_on('datastore-password-leafs', 'delete', function(ele) {
                //console.log("main.js update");
                //console.log(ele);
                for(var i = $scope.searchArray.length - 1; i >= 0; i--) {
                    if($scope.searchArray[i].key === ele.key) {
                        $scope.searchArray.splice(i, 1);
                    }
                }
            });


            managerDatastorePassword.get_password_datastore();

            var regex;

            $scope.$watch('datastore.search', function (value) {
                regex = new RegExp(value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'i');

                $timeout(function() {
                    if (! managerDatastoreUser.is_logged_in()) {
                        browserClient.resize(250);
                    } else if ($scope.datastore.search === '' && managerDatastoreUser.is_logged_in()) {
                        browserClient.resize(295);
                    } else {
                        /*
                         3 = 295*
                         2 = 252
                         1 = 209*
                         0 = 166
                         */
                        browserClient.resize(166 + Math.max($scope.datastore.filteredSearcArray.length, 1) * 43);
                    }
                });
            });

            $scope.filterBySearch = function(searchEntry) {
                if (!$scope.datastore.search) return false;
                return regex.test(searchEntry.name) || regex.test(searchEntry.urlfilter);
            };

            $scope.onItemClick = managerSecret.onItemClick;

        }]);

    app.controller('LoginController', ['$scope', '$rootScope', '$filter', '$timeout', 'managerDatastoreUser', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location', 'BACKEND_SERVERS',
        function($scope, $rootScope, $filter, $timeout, managerDatastoreUser, browserClient, storage,
                 snapRemote, $window, $route, $routeParams, $location, BACKEND_SERVERS)
        {

            /* openTab function to pass through */
            $scope.openTab = browserClient.openTab;

            /* test background page */
            //console.log(browserClient.testBackgroundPage());


            /* Server selection with preselection of dev server */
            $scope.servers = BACKEND_SERVERS;
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

            /* preselected values */
            $scope.loginFormEmail = "test@saschapfeiffer.com";
            $scope.loginFormPassword = "myPassword";

            $scope.login = function (email, password) {
                function onError() {
                    alert("Error, should not happen.");
                }

                function onRequestReturn(data) {
                    // TODO bring message to the user
                    if (data.response === "success") {
                        $scope.errors = [];
                        browserClient.emit("login", null);
                        browserClient.resize(295);
                    } else {
                        if (data.error_data == null) {
                            $scope.errors = ['Server offline.']
                        } else {
                            $scope.errors = data.error_data.non_field_errors;
                        }
                    }
                }
                if (email !== undefined && password !== undefined) {
                    managerDatastoreUser.login(email, password, angular.copy($scope.selected_server)).then(onRequestReturn, onError);
                }
            };
        }]);

    app.controller('TestCtrl', ['$scope', '$routeParams', function($scope, $routeParams) {
        this.name = "TestCtrl";
        this.params = $routeParams;
        $scope.routeParams = $routeParams;
    }]);

    app.controller('SettingsController', ['$scope', '$routeParams', 'settings', 'managerDatastoreSetting',
    function($scope, $routeParams, settings, managerDatastoreSetting) {

        var onError = function() {
            alert("Error, should not happen.");
        };
        var onRequestReturn = function() {
            $scope.settings = settings.get_settings();
        };

        managerDatastoreSetting.get_settings_datastore().then(onRequestReturn, onError);

        $scope.tabs = settings.get_tabs();
        $scope.save = function() {

            var onSuccess = function(data) {
                $scope.msgs = data.msgs;
                $scope.errors = [];
            };
            var onError = function(data) {
                $scope.msgs = [];
                $scope.errors = data.errors;
            };

            settings.save().then(onSuccess, onError)
        };
    }]);

    app.controller('ShareCtrl', ['$scope', '$routeParams', 'managerShare', function($scope, $routeParams, managerShare) {
        this.name = "ShareCtrl";
        this.params = $routeParams;
        $scope.routeParams = $routeParams;

        $scope.pendingApprovalFilter = function (item) {
            return item.share_right_accepted === null;
        };


        var onSuccess = function(data) {
            console.log(data);
            $scope.shares = data.shares;
        };
        var onError = function(data) {
            //pass
        };

        managerShare.read_shares().then(onSuccess, onError);
    }]);

    app.controller('IndexCtrl', ['$scope', '$routeParams', function($scope, $routeParams) {
        this.name = "IndexCtrl";
        this.params = $routeParams;
        $scope.routeParams = $routeParams;
    }]);

})(angular);



/* creates the base href tag for angular location */
angular.element(document.getElementsByTagName('head')).append(angular.element('<base href="' + encodeURI(window.location.pathname) + '" />'));
