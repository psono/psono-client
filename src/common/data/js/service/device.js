(function(angular, ClientJS) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.device
     * @requires psonocli.storage
     * @requires psonocli.cryptoLibrary
     * @description
     *
     * Service with some device functions that do not fit anywhere else
     */
    var device = function(storage, cryptoLibrary) {

        var client_js = new ClientJS();

        var fingerprint;

        activate();
        function activate() {

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

            fingerprint = storage.find_key('persistent', 'fingerprint');
            if (fingerprint == null) {
                fingerprint = cryptoLibrary.generate_uuid();
                storage.upsert('persistent', {key: 'fingerprint', value: fingerprint});
            } else {
                fingerprint = fingerprint['value'];
            }

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
    app.factory("device", ['storage', 'cryptoLibrary', device]);

}(angular, ClientJS));
