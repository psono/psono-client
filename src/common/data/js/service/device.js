(function(angular, ClientJS) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.device
     * @description
     *
     * Service with some device functions that do not fit anywhere else
     */
    var device = function($q) {

        var client_js = new ClientJS();

        var fingerprint;

        activate();
        function activate() {
            get_device_fingerprint_async().then(function(local_fingerprint){
                fingerprint = local_fingerprint;
            })
        }


        /**
         * @ngdoc
         * @name psonocli.device#get_device_fingerprint_async
         * @methodOf psonocli.device
         *
         * @description
         * Returns the device fingerprint
         *
         * @returns {promise} Returns promise with the device fingerprint
         */
        function get_device_fingerprint_async() {
            return $q(function(resolve, reject) {
                resolve(client_js.getFingerprint());
            });
        }

        /**
         * @ngdoc
         * @name psonocli.device#get_device_fingerprint
         * @methodOf psonocli.device
         *
         * @description
         * Returns the device fingerprint
         *
         * @returns {string} Fingerprint of the device
         */
        function get_device_fingerprint() {
            if (fingerprint) {
                return fingerprint;
            }
            fingerprint = client_js.getFingerprint();
            return fingerprint;
        }

        /**
         * @ngdoc
         * @name psonocli.device#is_ie
         * @methodOf psonocli.device
         *
         * @description
         * Returns weather we have an IE or not
         *
         * @returns {boolean} Is this an IE user
         */
        function is_ie() {
            return client_js.isIE();
        }

        /**
         * @ngdoc
         * @name psonocli.device#is_chrome
         * @methodOf psonocli.device
         *
         * @description
         * Returns weather we have a Chrome or not
         *
         * @returns {boolean} Is this an Chrome user
         */
        function is_chrome() {
            return client_js.isChrome();
        }

        /**
         * @ngdoc
         * @name psonocli.device#is_firefox
         * @methodOf psonocli.device
         *
         * @description
         * Returns weather we have a Firefox or not
         *
         * @returns {boolean} Is this an Firefox user
         */
        function is_firefox() {
            return client_js.isFirefox();
        }

        /**
         * @ngdoc
         * @name psonocli.device#is_safari
         * @methodOf psonocli.device
         *
         * @description
         * Returns weather we have a Safari or not
         *
         * @returns {boolean} Is this an Safari user
         */
        function is_safari() {
            return client_js.isSafari();
        }

        /**
         * @ngdoc
         * @name psonocli.device#is_opera
         * @methodOf psonocli.device
         *
         * @description
         * Returns weather we have a Opera or not
         *
         * @returns {boolean} Is this an Opera user
         */
        function is_opera() {
            return client_js.isOpera();
        }

        /**
         * @ngdoc
         * @name psonocli.device#get_device_description
         * @methodOf psonocli.device
         *
         * @description
         * Generates the Device description out of the Vendor, OS, Version and others
         *
         * @returns {string} Returns the device's description
         */
        function get_device_description() {
            var description = '';
            if (typeof(client_js.getDeviceVendor()) !== 'undefined') {
                description = description + client_js.getDeviceVendor() + ' ';
            }
            if (typeof(client_js.getDevice()) !== 'undefined') {
                description = description + client_js.getDevice() + ' ';
            }
            if (typeof(client_js.getOS()) !== 'undefined') {
                description = description + client_js.getOS() + ' ';
            }
            if (typeof(client_js.getOSVersion()) !== 'undefined') {
                description = description + client_js.getOSVersion() + ' ';
            }
            if (typeof(client_js.getBrowser()) !== 'undefined') {
                description = description + client_js.getBrowser() + ' ';
            }
            if (typeof(client_js.getBrowserVersion()) !== 'undefined') {
                description = description + client_js.getBrowserVersion() + ' ';
            }
            return description
        }


        return {
            get_device_fingerprint: get_device_fingerprint,
            is_ie: is_ie,
            is_chrome: is_chrome,
            is_firefox: is_firefox,
            is_safari: is_safari,
            is_opera: is_opera,
            get_device_description: get_device_description,
        };
    };

    var app = angular.module('psonocli');
    app.factory("device", ['$q', device]);

}(angular, ClientJS));
