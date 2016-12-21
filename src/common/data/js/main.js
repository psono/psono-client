(function (angular, uuid) {
    'use strict';

    /**
     * @ngdoc overview
     * @name psonocli
     * @description
     * The Psono client
     *
     *
     *
     * @typedef {Object} PublicPrivateKeyPair
     * @property {string} public_key The public key (hex encoded)
     * @property {string} private_key The private key (hex encoded)
     *
     * @typedef {Object} EncryptedValue
     * @property {string} text The public key (hex encoded)
     * @property {string} nonce The private key (hex encoded)
     *
     *
     * @typedef {Object} SplittedUrl
     * @property {string} scheme The scheme e.g. 'http' or 'ftps'
     * @property {string} authority The scheme e.g. 'test.example.com:6000'
     * @property {string} full_domain The full domain e.g. 'test.example.com'
     * @property {string} top_domain The top level domain e.g. 'example.com'
     * @property {string} port The port e.g. '6000'
     * @property {string} port The path e.g. '/url-part/'
     * @property {string} port The query, evething after '?' e.g. 'myFunnyParameter=test'
     * @property {string} port The query, evething after '#' e.g. 'anotherParameter=test'
     *
     * @typedef {Object} TreeObject
     * @property {uuid} [datastore_id] The datastore id if its the top
     * @property {uuid} [parent_datastore_id] The parent datastore id
     * @property {uuid} [parent_share_id] The parent share id
     * @property {object} [share_rights] All the share rights in an object
     * @property {boolean} [expanded] Is the folder expanded or not
     * @property {Array} [items] The items in the tree object
     * @property {Array} [folders] The folders in the tree object containing other TreeObject
     * @property {Object} [share_index] The share index
     *
     * @typedef {Object} RightObject
     * @property {boolean} read The read rights
     * @property {boolean} write The write rights
     * @property {boolean} grant The grant rights
     * @property {boolean} [delete] The delete rights
     *
     */


    var app = angular.module('psonocli', ['ngRoute', 'ng', 'ui.bootstrap', 'snap', 'adf',
            'adf.widget.datastore', 'adf.widget.shareusers', 'adf.widget.acceptshare', 'chieffancypants.loadingBar', 'ngAnimate',
            'LocalStorageModule', 'ngTree', 'ngDraggable', 'ng-context-menu', 'ui.select', 'ngSanitize',
            'angular-complexify', 'datatables']);

    app.config(['$routeProvider', '$locationProvider', 'dashboardProvider', 'localStorageServiceProvider',
        function ($routeProvider, $locationProvider, dashboardProvider, localStorageServiceProvider) {
            //Router config
            $routeProvider
                .when('/test', {
                    templateUrl: 'view/test.html',
                    controller: 'TestCtrl'
                })
                .when('/settings', {
                    templateUrl: 'view/settings.html',
                    controller: 'SettingsCtrl'
                })
                .when('/share/pendingshares', {
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

    app.run(['$rootScope', '$location', '$routeParams', 'managerSecret', function ($rootScope, $location, $routeParams, managerSecret) {
        $rootScope.$on('$routeChangeSuccess', function () {
            var redirect = '/secret/';
            if ($location.path().substring(0, redirect.length) == redirect && $routeParams.hasOwnProperty('secret_id')) {
                managerSecret.redirect_secret($routeParams.type, $routeParams.secret_id);
            }

        });
    }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:RegisterCtrl
     * @requires $scope
     * @requires $route
     * @requires $filter
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.browserClient
     * @requires psonocli.helper
     *
     * @description
     * Controller for the registration view
     */
    app.controller('RegisterCtrl', ['$scope', '$route', '$filter', 'managerDatastoreUser', 'browserClient', 'helper',
        function ($scope, $route, $filter, managerDatastoreUser, browserClient, helper) {

            var onSuccess = function(config) {

                // TODO interpret "allow_custom_server"
                // TODO check last visited server for "preselection"

                /* Server selection with preselection */
                $scope.servers = config['backend_servers'];
                $scope.filtered_servers = $scope.servers;
                $scope.selected_server = $scope.servers[0];
                $scope.selected_server_title = $scope.selected_server.title;
                $scope.selected_server_url = $scope.selected_server.url;
                $scope.selected_server_domain = helper.get_domain($scope.selected_server.url);
            };

            var onError = function() {

            };

            browserClient.get_config().then(onSuccess, onError);

            /**
             * @ngdoc
             * @name psonocli.controller:RegisterCtrl#select_server
             * @methodOf psonocli.controller:RegisterCtrl
             *
             * @description
             * Select a server from the offered choices
             *
             * @param {object} server The selected server
             */
            $scope.select_server = function (server) {
                //triggered when selecting an server
                $scope.selected_server = server;
                $scope.selected_server_title = server.title;
                $scope.selected_server_url = server.url;
                $scope.selected_server_domain = helper.get_domain(server.url);
            };

            /**
             * @ngdoc
             * @name psonocli.controller:RegisterCtrl#changing
             * @methodOf psonocli.controller:RegisterCtrl
             *
             * @description
             * Triggered automatically once someone types something into the "Server" Field
             *
             * @param {url} url The typed url
             */
            $scope.changing = function (url) {
                //triggered when typing an url
                $scope.selected_server = {title: url, url: url};
                $scope.selected_server_url = url;
                $scope.selected_server_domain = helper.get_domain(url);
                $scope.filtered_servers = $filter('filter')($scope.servers, {url: url});
            };

            /* preselected values */
            $scope.registerFormEmail = "register@saschapfeiffer.com";
            $scope.registerFormUsername = "register";
            $scope.registerFormPassword = "myPassword";
            $scope.registerFormPasswordRepeat = "myPassword";

            /**
             * @ngdoc
             * @name psonocli.controller:RegisterCtrl#register
             * @methodOf psonocli.controller:RegisterCtrl
             *
             * @description
             * Triggered once someone clicks the register button
             *
             * @param {email} email The email one wants to register with
             * @param {string} username The username one wants to register with
             * @param {string} password The password one wants to register with
             * @param {string} password2 The password repeated
             */
            $scope.register = function (email, username, password, password2) {

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
                        // handle server is offline
                        if (data.error_data == null) {
                            $scope.errors.push('Server offline.');
                            return;
                        }

                        // server is not offline and returned some errors
                        for (var property in data.error_data) {
                            if (!data.error_data.hasOwnProperty(property)) {
                                continue;
                            }
                            for (var i = 0; i < data.error_data[property].length; i++) {
                                $scope.errors.push(data.error_data[property][i]);
                            }
                        }
                    }
                }

                if (email === undefined || password === undefined || password2 === undefined || username === undefined) {
                    return;
                }


                if (password !== password2) {
                    $scope.errors.push("Passwords don't match.");
                    return;
                }

                if (username.indexOf('@') == -1){
                    username = username + '@' + $scope.selected_server_domain;
                }

                if ((username.match(/@/g) || []).length != 1) {
                    $scope.errors.push("No valid username (must be in email format).");
                }
                var res = username.split("@");
                var username_part = res[0];

                var test_result = helper.is_valid_username(username_part);
                if (test_result !== true) {
                    $scope.errors.push(test_result);
                    return;
                }

                // TODO forbid weak and poor passwords

                managerDatastoreUser.register(email, username, password, angular.copy($scope.selected_server))
                    .then(onRequestReturn, onError);
            };

            browserClient.get_base_url().then(function(base_url){
                $scope.base_url = base_url;
            });
        }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:ActivationCtrl
     * @requires $scope
     * @requires $route
     * @requires $routeParams
     * @requires $filter
     * @requires $location
     * @requires $timeout
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.browserClient
     * @requires psonocli.helper
     *
     * @description
     * Controller for the activation view
     */
    app.controller('ActivationCtrl', ['$scope', '$route', '$routeParams', '$filter', '$location', '$timeout',
        'managerDatastoreUser', 'browserClient', 'helper',
        function ($scope, $route, $routeParams, $filter, $location, $timeout, managerDatastoreUser,
                  browserClient, helper) {

            var onSuccess = function(config) {

                // TODO interpret "allow_custom_server"
                // TODO check last visited server for "preselection"

                /* Server selection with preselection */
                $scope.servers = config['backend_servers'];
                $scope.filtered_servers = $scope.servers;
                $scope.selected_server = $scope.servers[0];
                $scope.selected_server_title = $scope.selected_server.title;
                $scope.selected_server_url = $scope.selected_server.url;
                $scope.selected_server_domain = helper.get_domain($scope.selected_server.url);
            };

            var onError = function() {

            };

            browserClient.get_config().then(onSuccess, onError);

            /**
             * @ngdoc
             * @name psonocli.controller:ActivationCtrl#select_server
             * @methodOf psonocli.controller:ActivationCtrl
             *
             * @description
             * Select a server from the offered choices
             *
             * @param {object} server The selected server
             */
            $scope.select_server = function (server) {
                //triggered when selecting an server
                $scope.selected_server = server;
                $scope.selected_server_title = server.title;
                $scope.selected_server_url = server.url;
                $scope.selected_server_domain = helper.get_domain(server.url);
            };

            /**
             * @ngdoc
             * @name psonocli.controller:ActivationCtrl#changing
             * @methodOf psonocli.controller:ActivationCtrl
             *
             * @description
             * Triggered automatically once someone types something into the "Server" Field
             *
             * @param {url} url The typed url
             */
            $scope.changing = function (url) {
                //triggered when typing an url
                $scope.selected_server = {title: url, url: url};
                $scope.selected_server_url = url;
                $scope.selected_server_domain = helper.get_domain(url);
                $scope.filtered_servers = $filter('filter')($scope.servers, {url: url});
            };

            /**
             * @ngdoc
             * @name psonocli.controller:ActivationCtrl#activate
             * @methodOf psonocli.controller:ActivationCtrl
             *
             * @description
             * Triggered either automatically or by pressing the activate button
             *
             * @param {string} activation_code The activation code
             */
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

                if (activation_code !== undefined) {
                    $timeout(function(){
                        managerDatastoreUser.activate(activation_code, angular.copy($scope.selected_server))
                            .then(onRequestReturn, onError);
                    },200);
                }
            };

            /* preselected values */
            $scope.$on('$routeChangeSuccess', function () {
                $scope.activationFormKey = $routeParams['activation_code'];
                if ($routeParams.hasOwnProperty('activation_code') && $routeParams['activation_code'].length > 0) {
                    activate($routeParams['activation_code']);
                }
            });

            $scope.activate = activate;

            browserClient.get_base_url().then(function(base_url){
                $scope.base_url = base_url;
            });
        }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:WrapperCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires $filter
     * @requires $timeout
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.browserClient
     * @requires psonocli.storage
     * @requires snapRemote
     * @requires $window
     * @requires $route
     * @requires $routeParams
     * @requires $location
     *
     * @description
     * Controller for the wrapper
     */
    app.controller('WrapperCtrl', ['$scope', '$rootScope', '$filter', '$timeout', 'managerDatastoreUser', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function ($scope, $rootScope, $filter, $timeout, managerDatastoreUser, browserClient, storage,
                  snapRemote, $window, $route, $routeParams, $location) {


            /* open_tab function to pass through */
            $scope.open_tab = browserClient.open_tab;

            /* test background page */
            //console.log(browserClient.test_background_page());

            /* snapper */
            snapRemote.getSnapper().then(function (snapper) {
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
                function adjustWith(snapper, behave_inverse) {
                    //console.log('adjustWith');
                    var total_width = angular.element(document.querySelectorAll(".snap-content")[0])[0].clientWidth;
                    if ((snapper.state().state !== 'closed') != behave_inverse) {
                        $scope.snap_content_with = (total_width - scrollWidth) + 'px';
                    } else {
                        $scope.snap_content_with = total_width + 'px';
                    }
                }

                snapper.on('start', function () {
                    console.log('start');
                });

                snapper.on('end', function () {
                    console.log('end');
                });

                snapper.on('open', function () {
                    adjustWith(snapper, true);
                });
                snapper.on('close', function () {
                    adjustWith(snapper, true);
                });

                snapper.open('left');
                adjustWith(snapper);

                $scope.$on("login", function () {
                    snapRemote.getSnapper().then(function (snapper) {
                        snapper.settings(snappersettings);
                        snapper.open('left');
                        adjustWith(snapper);
                    });
                });

                /* TODO enable snapper if the device is too small */
                snapper.disable();

                angular.element($window).bind(orientationEvent, function () {
                    snapRemote.getSnapper().then(function (snapper) {
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

            browserClient.on("login", function () {
                $timeout(function () {
                    $scope.data.loggedin = true;
                });
            });

            browserClient.on("logout", function () {
                $timeout(function () {
                    $scope.data.loggedin = false;
                    browserClient.resize(250);
                });
            });

        }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:OpenSecretCtrl
     * @requires $scope
     * @requires cfpLoadingBar
     * @requires $route
     *
     * @description
     * Controller for the open secret view
     */
    app.controller('OpenSecretCtrl', ['$scope', 'cfpLoadingBar', '$route',
        function ($scope, cfpLoadingBar, $route) {
            var lock = angular.element(document.querySelector('#loading-lock-logo-loaded-fa'));
            cfpLoadingBar.on("set", function (status) {
                lock.css('width', (status * 100) + '%');
                lock.css('marginLeft', (-200 + status * 100) + '%');
            })

        }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:MainCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires $filter
     * @requires $timeout
     * @requires psonocli.manager
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerSecret
     * @requires psonocli.browserClient
     * @requires psonocli.storage
     * @requires snapRemote
     * @requires $window
     * @requires $route
     * @requires $routeParams
     * @requires $location
     *
     * @description
     * Controller for main view
     */
    app.controller('MainCtrl', ['$scope', '$rootScope', '$filter', '$timeout', 'manager',
        'managerDatastorePassword', 'managerDatastoreUser', 'managerSecret', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function ($scope, $rootScope, $filter, $timeout, manager,
                  managerDatastorePassword, managerDatastoreUser, managerSecret, browserClient, storage,
                  snapRemote, $window, $route, $routeParams, $location ) {

            /**
             * @ngdoc
             * @name psonocli.controller:MainCtrl#open_tab
             * @methodOf psonocli.controller:MainCtrl
             *
             * @description
             * browserClient.open_tab function to pass through
             *
             * @param {url} url The url to open
             */
            $scope.open_tab = browserClient.open_tab;

            /* test background page */
            //console.log(browserClient.test_background_page());

            /**
             * @ngdoc
             * @name psonocli.controller:MainCtrl#get_link_state
             * @methodOf psonocli.controller:MainCtrl
             *
             * @description
             * Returns the link state ('active' or '')
             * for navigation, can maybe moved to another controller
             *
             * @param {string} path The current path
             */
            $scope.get_link_state = function (path) {
                if (path === '/' && $location.path().length == 0) {
                    return 'active';
                } else if (path !== '/' && $location.path().substr(0, path.length) === path) {
                    return 'active';
                } else {
                    return '';
                }
            };

            /**
             * @ngdoc
             * @name psonocli.controller:MainCtrl#logout
             * @methodOf psonocli.controller:MainCtrl
             *
             * @description
             * managerDatastoreUser.logout function to pass through
             */
            $scope.logout = managerDatastoreUser.logout;

            /**
             * @ngdoc
             * @name psonocli.controller:MainCtrl#generate_password
             * @methodOf psonocli.controller:MainCtrl
             *
             * @description
             * managerDatastorePassword.generate_password_active_tab function to pass through
             */
            $scope.generate_password = managerDatastorePassword.generate_password_active_tab;

            $scope.user_username = manager.find_one('config', 'user_username');

            /**
             * @ngdoc
             * @name psonocli.controller:MainCtrl#on_item_click
             * @methodOf psonocli.controller:MainCtrl
             *
             * @description
             * managerSecret.on_item_click function to pass through
             */
            $scope.on_item_click = managerSecret.on_item_click;
            $scope.messages = [];
            browserClient.load_version().then(function(version) {
                $scope.version = version;
            });
        }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:PanelCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires $filter
     * @requires $timeout
     * @requires psonocli.manager
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerSecret
     * @requires snapRemote
     * @requires $window
     * @requires $route
     * @requires $routeParams
     * @requires $location
     *
     * @description
     * Controller for the panel
     */
    app.controller('PanelCtrl', ['$scope', '$rootScope', '$filter', '$timeout', 'manager',
        'managerDatastorePassword', 'managerDatastoreUser', 'managerSecret', 'browserClient',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function ($scope, $rootScope, $filter, $timeout, manager,
                  managerDatastorePassword, managerDatastoreUser, managerSecret, browserClient,
                  snapRemote, $window, $route, $routeParams, $location) {

            /**
             * @ngdoc
             * @name psonocli.controller:PanelCtrl#open_tab
             * @methodOf psonocli.controller:PanelCtrl
             *
             * @description
             * browserClient.open_tab function to pass through
             *
             * @param {url} url The url to open
             */
            $scope.open_tab = browserClient.open_tab;


            /**
             * @ngdoc
             * @name psonocli.controller:PanelCtrl#logout
             * @methodOf psonocli.controller:PanelCtrl
             *
             * @description
             * managerDatastoreUser.logout function to pass through
             */
            $scope.logout = managerDatastoreUser.logout;

            /**
             * @ngdoc
             * @name psonocli.controller:PanelCtrl#generate_password
             * @methodOf psonocli.controller:PanelCtrl
             *
             * @description
             * managerDatastorePassword.generate_password_active_tab function to pass through
             */
            $scope.generate_password = managerDatastorePassword.generate_password_active_tab;

            /* datastore search */

            $scope.searchArray = [];

            $scope.datastore = {
                search: '',
                filteredSearcArray: []
            };

            manager.storage_on('datastore-password-leafs', 'update', function (ele) {
                //console.log("main.js update");
                //console.log(ele);
            });


            manager.storage_on('datastore-password-leafs', 'insert', function (ele) {
                //console.log("main.js insert");
                $scope.searchArray.push(ele);
            });


            manager.storage_on('datastore-password-leafs', 'delete', function (ele) {
                //console.log("main.js update");
                //console.log(ele);
                for (var i = $scope.searchArray.length - 1; i >= 0; i--) {
                    if ($scope.searchArray[i].key === ele.key) {
                        $scope.searchArray.splice(i, 1);
                    }
                }
            });

            managerDatastorePassword.get_password_datastore(true);
            

            var regex;

            $scope.$watch('datastore.search', function (value) {
                regex = new RegExp(value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'i');

                $timeout(function () {
                    if (!managerDatastoreUser.is_logged_in()) {
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

            $scope.filterBySearch = function (searchEntry) {
                if (!$scope.datastore.search) return false;
                return regex.test(searchEntry.name) || regex.test(searchEntry.urlfilter);
            };

            /**
             * @ngdoc
             * @name psonocli.controller:PanelCtrl#on_item_click
             * @methodOf psonocli.controller:PanelCtrl
             *
             * @description
             * managerSecret.on_item_click function to pass through
             */
            $scope.on_item_click = managerSecret.on_item_click;

        }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:LoginCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires $filter
     * @requires $timeout
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.browserClient
     * @requires snapRemote
     * @requires $window
     * @requires $route
     * @requires $routeParams
     * @requires $location
     * @requires psonocli.helper
     *
     * @description
     * Controller for the Login view
     */
    app.controller('LoginCtrl', ['$scope', '$rootScope', '$filter', '$timeout', 'managerDatastoreUser', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location', 'helper',
        function ($scope, $rootScope, $filter, $timeout, managerDatastoreUser, browserClient, storage,
                  snapRemote, $window, $route, $routeParams, $location, helper) {

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#open_tab
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * browserClient.open_tab function to pass through
             *
             * @param {url} url The url to open
             */
            $scope.open_tab = browserClient.open_tab;

            /* test background page */
            //console.log(browserClient.test_background_page());

            var onSuccess = function(config) {

                // TODO interpret "allow_custom_server"
                // TODO check last visited server for "preselection"

                /* Server selection with preselection */
                $scope.servers = config['backend_servers'];
                $scope.filtered_servers = $scope.servers;
                $scope.selected_server = $scope.servers[0];
                $scope.selected_server_title = $scope.selected_server.title;
                $scope.selected_server_url = $scope.selected_server.url;
                $scope.selected_server_domain = helper.get_domain($scope.selected_server.url);
            };

            var onError = function() {

            };

            browserClient.get_config().then(onSuccess, onError);

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#select_server
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Select a server from the offered choices
             *
             * @param {object} server The selected server
             */
            $scope.select_server = function (server) {
                //triggered when selecting an server
                $scope.selected_server = server;
                $scope.selected_server_title = server.title;
                $scope.selected_server_url = server.url;
                $scope.selected_server_domain = helper.get_domain(server.url);
            };

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#changing
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered automatically once someone types something into the "Server" Field
             *
             * @param {url} url The typed url
             */
            $scope.changing = function (url) {
                //triggered when typing an url
                $scope.selected_server = {title: url, url: url};
                $scope.selected_server_url = url;
                $scope.selected_server_domain = helper.get_domain(url);
                $scope.filtered_servers = $filter('filter')($scope.servers, {url: url});
            };

            /* preselected values */
            $scope.loginFormUsername = "test";
            $scope.loginFormPassword = "myPassword";

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#login
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone clicks the login button
             *
             * @param {string} username The username
             * @param {string} password The password
             */
            $scope.login = function (username, password) {
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
                        } else if (data.error_data.hasOwnProperty('non_field_errors')) {
                            $scope.errors = data.error_data.non_field_errors;
                        } else {
                            $scope.errors = ['Username or password incorrect'];
                        }
                    }
                }

                if (username !== undefined && password !== undefined) {
                    if (username.indexOf('@') === -1) {
                        username = username + '@' + $scope.selected_server_domain;
                    }
                    managerDatastoreUser.login(username, password, angular.copy($scope.selected_server)).then(onRequestReturn, onError);
                }
            };
        }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:TestCtrl
     * @requires $scope
     * @requires $routeParams
     *
     * @description
     * Controller for the Test view
     */
    app.controller('TestCtrl', ['$scope', '$routeParams', function ($scope, $routeParams) {
        $scope.has_head = 'yes';
        $scope.executor = function() {
            $scope.has_head = 'no';
        };
    }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:SettingsCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires psonocli.settings
     * @requires psonocli.managerDatastoreSetting
     *
     * @description
     * Controller for the Settings view
     */
    app.controller('SettingsCtrl', ['$scope', '$routeParams', 'settings', 'managerDatastoreSetting',
        function ($scope, $routeParams, settings, managerDatastoreSetting) {

            var onSuccess = function () {
                $scope.settings = settings.get_settings();
            };

            var onError = function () {
                alert("Error, should not happen.");
            };

            managerDatastoreSetting.get_settings_datastore().then(onSuccess, onError);

            $scope.tabs = settings.get_tabs();

            /**
             * @ngdoc
             * @name psonocli.controller:SettingsCtrl#save
             * @methodOf psonocli.controller:SettingsCtrl
             *
             * @description
             * Triggered once someone clicks the save button
             */
            $scope.save = function () {

                var onSuccess = function (data) {
                    $scope.msgs = data.msgs;
                    $scope.errors = [];
                };
                var onError = function (data) {
                    $scope.msgs = [];
                    $scope.errors = data.errors;
                };

                settings.save().then(onSuccess, onError)
            };
        }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:ShareCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires $uibModal
     * @requires psonocli.managerShare
     * @requires psonocli.managerDatastorePassword
     *
     * @description
     * Controller for the Share view
     */
    app.controller('ShareCtrl', ['$scope', '$routeParams', '$uibModal', 'managerShare', 'managerDatastorePassword',
        function ($scope, $routeParams, $uibModal, managerShare, managerDatastorePassword) {
            this.name = "ShareCtrl";
            this.params = $routeParams;
            $scope.routeParams = $routeParams;
            $scope.shares = [];

            // populates the the data with all shares

            var onSuccess = function (data) {
                $scope.shares = data.shares;
            };
            var onError = function (data) {
                //pass
            };
            managerShare.read_shares().then(onSuccess, onError);

            /**
             * Helper function to remove a specified item from the pending shares list
             *
             * @param item
             * @param shares
             */
            var remove_item_from_pending_list = function (item, shares) {

                for (var i = shares.length - 1; i >= 0; i--) {
                    if (shares[i].id !== item.id) {
                        continue;
                    }
                    shares.splice(i, 1);
                }
            };



            /**
             * @ngdoc
             * @name psonocli.controller:ShareCtrl#accept
             * @methodOf psonocli.controller:ShareCtrl
             *
             * @description
             * accepts a share offer
             *
             * @param {object} item The item to accept
             * @param {Array} pending_shares List of all pending shares
             */
            $scope.accept = function (item, pending_shares) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-accept-share.html',
                    controller: 'ModalAcceptShareCtrl',
                    resolve: {
                        item: function () {
                            return item;
                        }
                    }
                });

                modalInstance.result.then(function (breadcrumbs) {
                    // User clicked the prime button

                    var onSuccess = function (datastore) {

                        var link_id = uuid.v4();

                        var path;
                        var parent_path;

                        var target;
                        var parent_share_id;
                        var datastore_id;

                        if (typeof breadcrumbs.id_breadcrumbs !== "undefined") {
                            path = breadcrumbs.id_breadcrumbs.slice();
                            var path_copy = breadcrumbs.id_breadcrumbs.slice();
                            parent_path = breadcrumbs.id_breadcrumbs.slice();
                            // find drop zone
                            var val1 = managerDatastorePassword.find_in_datastore(breadcrumbs.id_breadcrumbs, datastore);
                            target = val1[0][val1[1]];

                            // get the parent (share or datastore)
                            var parent_share = managerShare.get_closest_parent_share(path_copy, datastore, datastore, 0);
                            if (parent_share.hasOwnProperty("datastore_id")) {
                                datastore_id = parent_share.datastore_id;
                            } else if (parent_share.hasOwnProperty("share_id")){
                                parent_share_id = parent_share.share_id;
                            } else {
                                alert("Wupsi, that should not happen: d6da43af-e0f5-46ba-ae5b-d7e5ccd2fa92")
                            }
                        } else {
                            path = [];
                            parent_path = [];
                            target = datastore;
                            datastore_id = target.datastore_id;
                        }

                        if (item.share_right_grant == false && typeof(parent_share_id) != 'undefined') {
                            // No grant right, yet the parent is a a share?!?
                            alert("Wups, this should not happen. Error: 781f3da7-d38b-470e-a3c8-dd5787642230");
                        }

                        var onSuccess = function (share) {

                            share.id = link_id;

                            if (typeof share.name === "undefined") {
                                share.name = item.share_right_title;
                            }

                            if (typeof share.type === "undefined") {
                                //its a folder, lets add it to folders
                                if (typeof target.folders === "undefined") {
                                    target.folders = []
                                }
                                target.folders.push(share)
                            } else {
                                // its an item, lets add it to items
                                if (typeof target.items === "undefined") {
                                    target.items = []
                                }
                                target.items.push(share)
                            }
                            path.push(share.id);
                            var changed_paths = managerDatastorePassword.on_share_added(share.share_id, path, datastore, 1);
                            changed_paths.push(parent_path);
                            
                            managerDatastorePassword.save_datastore(datastore, changed_paths);

                            remove_item_from_pending_list(item, pending_shares);
                        };

                        var onError = function (data) {
                            //pass
                        };

                        managerShare.accept_share_right(item.share_right_id, item.share_right_key,
                            item.share_right_key_nonce, breadcrumbs.user.data.user_public_key, link_id, parent_share_id,
                            datastore_id
                        ).then(onSuccess, onError);
                    };
                    var onError = function (data) {
                        //pass
                    };

                    managerDatastorePassword.get_password_datastore()
                        .then(onSuccess, onError);

                }, function () {
                    // cancel triggered
                });


            };

            /**
             * @ngdoc
             * @name psonocli.controller:ShareCtrl#decline
             * @methodOf psonocli.controller:ShareCtrl
             *
             * @description
             * declines a share offer
             *
             * @param {object} item The item to decline
             * @param {Array} pending_shares List of all pending shares
             */
            $scope.decline = function (item, pending_shares) {
                managerShare.decline_share_right(item.share_right_id);
                remove_item_from_pending_list(item, pending_shares);
            };

            /**
             * @ngdoc
             * @name psonocli.controller:ShareCtrl#pending_approval_filter
             * @methodOf psonocli.controller:ShareCtrl
             *
             * @description
             * Filter function that returns if an item has already been accepted
             *
             * @param {object} item The item to check
             */
            $scope.pending_approval_filter = function (item) {
                return item.share_right_accepted === null;
            };
        }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalAcceptShareCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires $uibModal
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.message
     * @requires psonocli.shareBlueprint
     * @requires psonocli.item
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "AcceptShare" modal
     */
    app.controller('ModalAcceptShareCtrl', ['$scope', '$uibModalInstance', '$uibModal', 'managerDatastoreUser',
        'message', 'shareBlueprint', 'item', 'helper',
        function ($scope, $uibModalInstance, $uibModal, managerDatastoreUser, message, shareBlueprint, item, helper) {

            $scope.item = item;
            $scope.user_is_trusted = false;

            /**
             * message is sent once someone selects another folder in the datastore
             */
            message.on("modal_accept_share_breadcrumbs_update", function (data) {
                $scope.breadcrumbs = data;
            });

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAcceptShareCtrl#cut_breadcrumbs
             * @methodOf psonocli.controller:ModalAcceptShareCtrl
             *
             * @description
             * triggered once someone clicks on one of the breadcrumbs in the path
             *
             * @param {int} index The index to jump to
             * @param {object} node The node to jump to
             */
            $scope.cut_breadcrumbs = function (index, node) {

                // prevent jumping to folders with no read nor write rights
                if (node.hasOwnProperty('share_rights') && ( !node.share_rights.read || !node.share_rights.write )) {
                    return;
                }

                $scope.breadcrumbs.breadcrumbs = $scope.breadcrumbs.breadcrumbs.slice(0, index + 1);
                $scope.breadcrumbs.id_breadcrumbs = $scope.breadcrumbs.id_breadcrumbs.slice(0, index + 1);
            };

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAcceptShareCtrl#clear_breadcrumbs
             * @methodOf psonocli.controller:ModalAcceptShareCtrl
             *
             * @description
             * triggered once someone clicks the "delete" button near path. The function will clear the breadcrumbs.
             */
            $scope.clear_breadcrumbs = function () {
                $scope.breadcrumbs = {};
            };

            /**
             * identifies trusted users
             */
            managerDatastoreUser
                .search_user_datastore(item.share_right_create_user_id, item.share_right_create_user_username)
                .then(function (user) {

                    if (user !== null) {
                        $scope.user_is_trusted = true;
                        $scope.user = user;
                        return;
                    }

                    var onSuccess = function (data) {

                        $scope.user = {
                            data: {
                                user_search_username: data.data.username,
                                user_id: data.data.id,
                                user_username: data.data.username,
                                user_public_key: data.data.public_key
                            },
                            name: data.data.username
                        };
                        $scope.user_list = [
                            {name: 'user_search_username', value: data.data.username},
                            {name: 'user_id', value: data.data.id},
                            {name: 'user_username', value: data.data.username},
                            {name: 'user_public_key', value: data.data.public_key}
                        ]
                    };
                    var onError = function (data) {
                        //pass
                    };

                    managerDatastoreUser.search_user(item.share_right_create_user_username)
                        .then(onSuccess, onError);
                });

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAcceptShareCtrl#trust
             * @methodOf psonocli.controller:ModalAcceptShareCtrl
             *
             * @description
             * triggered once a users clicks the "trust this user" button and adds the user to the trusted datastore
             *
             * @param {Array} users List of users to trust
             */
            $scope.trust = function (users) {

                var onSuccess = function (user_data_store) {

                    if (typeof user_data_store.items === 'undefined') {
                        user_data_store.items = [];
                    }

                    var user_object = {
                        id: uuid.v4(),
                        type: "user",
                        data: {}
                    };

                    if (shareBlueprint.get_blueprint("user").getName) {
                        user_object.name = shareBlueprint.get_blueprint("user").getName(users);
                    }

                    for (var i = 0; i < users.length; i++) {

                        if (!users[i].hasOwnProperty("value")) {
                            continue;
                        }
                        if (!user_object.name && shareBlueprint.get_blueprint("user").title_field == users[i].name) {
                            user_object.name = user[i].value;
                        }
                        if (shareBlueprint.get_blueprint("user").hasOwnProperty("urlfilter_field")
                            && shareBlueprint.get_blueprint("user").urlfilter_field == users[i].name) {
                            user_object.urlfilter = users[i].value;
                        }
                        user_object.data[users[i].name] = users[i].value;

                        user_data_store.items.push(user_object);
                    }

                    managerDatastoreUser.save_datastore(user_data_store);
                    $scope.user_is_trusted = true;
                };
                var onError = function (data) {
                    //pass
                };

                managerDatastoreUser.get_user_datastore()
                    .then(onSuccess, onError);

            };

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAcceptShareCtrl#save
             * @methodOf psonocli.controller:ModalAcceptShareCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            $scope.save = function () {
                if (typeof $scope.breadcrumbs === "undefined") {
                    $scope.breadcrumbs = {};
                }
                $scope.breadcrumbs['user'] = $scope.user;
                $scope.breadcrumbs['item'] = $scope.item;
                $uibModalInstance.close($scope.breadcrumbs);
            };

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAcceptShareCtrl#cancel
             * @methodOf psonocli.controller:ModalAcceptShareCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

        }]);

    /**
     * @ngdoc controller
     * @name psonocli.controller:IndexCtrl
     * @requires $scope
     * @requires $routeParams
     *
     * @description
     * Controller for the index
     */
    app.controller('IndexCtrl', ['$scope', '$routeParams', function ($scope, $routeParams) {
        this.name = "IndexCtrl";
        this.params = $routeParams;
        $scope.routeParams = $routeParams;
    }]);

})(angular, uuid);


/* creates the base href tag for angular location */
angular.element(document.getElementsByTagName('head')).append(angular.element('<base href="' + encodeURI(window.location.pathname) + '" />'));
