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
            'angular-complexify', 'datatables', 'chart.js', 'pascalprecht.translate'])
        .config(['$translateProvider', '$routeProvider', '$httpProvider', '$locationProvider', '$compileProvider', 'localStorageServiceProvider',
            function ($translateProvider, $routeProvider, $httpProvider, $locationProvider, $compileProvider, localStorageServiceProvider) {
                //Router config
                $routeProvider
                    .when('/settings', {
                        templateUrl: 'view/settings.html',
                        controller: 'SettingsCtrl'
                    })
                    .when('/settings/:tab_slug', {
                        templateUrl: 'view/settings.html',
                        controller: 'SettingsCtrl'
                    })
                    .when('/account', {
                        templateUrl: 'view/account.html',
                        controller: 'AccountCtrl'
                    })
                    .when('/account/:tab_slug', {
                        templateUrl: 'view/account.html',
                        controller: 'AccountCtrl'
                    })
                    .when('/other', {
                        templateUrl: 'view/other.html',
                        controller: 'OtherCtrl'
                    })
                    .when('/other/:tab_slug', {
                        templateUrl: 'view/other.html',
                        controller: 'OtherCtrl'
                    })
                    .when('/share/pendingshares', {
                        templateUrl: 'view/index-share-shares.html',
                        controller: 'ShareCtrl'
                    })
                    .when('/share/users', {
                        templateUrl: 'view/index-share-users.html'
                    })
                    .when('/groups', {
                        templateUrl: 'view/index-groups.html'
                    })
                    .when('/security-report', {
                        templateUrl: 'view/index-security-report.html',
                        controller: 'SecurityReportCtrl'
                    })
                    .when('/gpg/read/:gpg_message_id', {
                        templateUrl: 'view/index-gpg-decrypt.html'
                    })
                    .when('/gpg/write/:gpg_message_id', {
                        templateUrl: 'view/index-gpg-encrypt.html'
                    })
                    .when('/secret/:type/:secret_id', {})
                    .when('/activation-code/:activation_code', {})
                    .when('/datastore/search/:default_search', {
                        templateUrl: 'view/datastore.html',
                        controller: 'DatastoreCtrl'
                    })
                    .when('/datastore/edit/:secret_type/:secret_id', {
                        templateUrl: 'view/datastore.html',
                        controller: 'DatastoreCtrl'
                    })
                    .when('/', {
                        templateUrl: 'view/datastore.html',
                        controller: 'DatastoreCtrl'
                    });

                $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|s?ftp|mailto|tel|file|chrome-extension|blob):/);
                $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|chrome-extension|blob):|data:image\/)/);

                // Prevent caching for IE
                // taken from https://stackoverflow.com/a/19771501/4582775
                if (!$httpProvider.defaults.headers.get) {
                    $httpProvider.defaults.headers.get = {};
                }
                $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
                $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
                $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';


                $translateProvider
                    .useStaticFilesLoader({
                        prefix: 'translations/locale-',
                        suffix: '.json'
                    })
                    .registerAvailableLanguageKeys(['cs', 'de', 'en', 'es', 'fi', 'fr', 'hr', 'it', 'ja', 'ko', 'nl', 'pl', 'ru', 'vi', 'zh-cn'], {
                        'de_*': 'de',
                        'en_*': 'en',
                        'es_*': 'es',
                        'fr_*': 'fr',
                        'it_*': 'it',
                        'zh_*': 'zh-cn',
                        '*': 'en'
                    })
                    .fallbackLanguage('en')
                    .determinePreferredLanguage()
                    .useSanitizeValueStrategy('escape');

            }])
        .filter('typeof', function() {
            return function(obj) {
                return typeof obj
            };
        })
        .filter('fingerprint', ['openpgp', function(openpgp) {
            return function(obj) {

                if (!obj) {
                    return ''
                }

                if (obj.indexOf('-----') !== -1) {
                    var key = openpgp.key.readArmored(obj).keys[0];
                    if (key) {
                        obj = key.primaryKey.fingerprint;
                    } else {
                        obj = '';
                    }
                }

                var cleaned = obj.toUpperCase().replace(/\s/g,'');
                var parts = [];

                for(var i = 0; i < cleaned.length; i += 4) {
                    parts.push(cleaned.substr(i, 4));
                }

                return parts.join(' ');
            };
        }])
        .run(['$rootScope', '$location', '$routeParams', '$http', '$templateCache', 'managerSecret', 'offlineCache',
            function ($rootScope, $location, $routeParams, $http, $templateCache, managerSecret, offlineCache) {

                $rootScope.$on( "$routeChangeStart", function(event, next, current) {
                    var offline_redirect_urls = [
                        'view/account.html',
                        'view/other.html',
                        'view/settings.html',
                        'view/index-share-shares.html',
                        'view/index-share-users.html',
                        'view/index-share-groups.html',
                        'view/index-security-report.html'
                    ];

                    if ( offlineCache.is_active() && next.templateUrl && offline_redirect_urls.indexOf(next.templateUrl.toLowerCase()) !== -1 ) {
                        $location.path( "/" )
                    }
                });
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

console.log("%cDanger:","color:red;font-size:40px;");
console.log("%cDo not type or paste anything here. This feature is for developers and typing or pasting something here can compromise your account.","font-size:20px;");