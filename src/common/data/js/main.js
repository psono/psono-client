(function (angular) {
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


    angular.module('psonocli', ['ngRoute', 'ng', 'ui.bootstrap', 'snap', 'chieffancypants.loadingBar', 'ngAnimate',
            'LocalStorageModule', 'ngTree', 'ngDraggable', 'ng-context-menu', 'ui.select', 'ngSanitize',
            'angular-complexify', 'datatables', 'chart.js'])
        .config(['$routeProvider', '$locationProvider', '$compileProvider', 'localStorageServiceProvider',
            function ($routeProvider, $locationProvider, $compileProvider, localStorageServiceProvider) {
                //Router config
                $routeProvider
                    .when('/settings', {
                        templateUrl: 'view/settings.html',
                        controller: 'SettingsCtrl'
                    })
                    .when('/account', {
                        templateUrl: 'view/account.html',
                        controller: 'AccountCtrl'
                    })
                    .when('/other', {
                        templateUrl: 'view/other.html',
                        controller: 'OtherCtrl'
                    })
                    .when('/share/pendingshares', {
                        templateUrl: 'view/index-share-shares.html',
                        controller: 'ShareCtrl'
                    })
                    .when('/share/users', {
                        templateUrl: 'view/index-share-users.html',
                        controller: 'IndexCtrl'
                    })
                    .when('/security-report', {
                        templateUrl: 'view/index-security-report.html',
                        controller: 'SecurityReportCtrl'
                    })
                    .when('/secret/:type/:secret_id', {})
                    .when('/activation-code/:activation_code', {})
                    .when('/datastore/search/:default_search', {
                        templateUrl: 'view/index.html',
                        controller: 'IndexCtrl'
                    })
                    .otherwise({
                        templateUrl: 'view/index.html',
                        controller: 'IndexCtrl'
                    });

                $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);

            }])
        .filter('typeof', function() {
            return function(obj) {
                return typeof obj
            };
        })
        .run(['$rootScope', '$location', '$routeParams', 'managerSecret',
            function ($rootScope, $location, $routeParams, managerSecret) {
                $rootScope.$on('$routeChangeSuccess', function () {
                    var redirect = '/secret/';
                    if ($location.path().substring(0, redirect.length) === redirect && $routeParams.hasOwnProperty('secret_id')) {
                        managerSecret.redirect_secret($routeParams.type, $routeParams.secret_id);
                    }

                });
            }]);
}(angular));


/* creates the base href tag for angular location */
angular.element(document.getElementsByTagName('head')).append(angular.element('<base href="' + encodeURI(window.location.pathname) + '" />'));

/* Fastclick */
document.addEventListener('DOMContentLoaded', function() {
    FastClick.attach(document.body);
}, false);