(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerFileTransfer
     * @requires $q
     * @requires $window
     * @requires $timeout
     * @requires psonocli.managerSecret
     * @requires psonocli.managerDatastorePassword
     *
     * @description
     * Service to manage the export of datastores
     */

    var managerFileTransfer = function($q, $window, $timeout, managerSecret, managerDatastorePassword) {


        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#upload
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Triggered once someone wants to upload a file
         *
         * @returns {promise} promise
         */
        var upload = function () {
            console.log("managerFileTransfer:upload")
        };

        return {
            upload: upload
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerFileTransfer", ['$q', '$window', '$timeout', 'managerSecret', 'managerDatastorePassword', managerFileTransfer]);

}(angular));