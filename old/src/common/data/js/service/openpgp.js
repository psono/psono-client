(function (angular, openpgp) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.openpgp
     *
     * @description
     * OpenPGP JS service
     */

    var openpgp_js = function () {

        // Remove any version that might be specified because of  https://github.com/openpgpjs/openpgpjs/issues/166
        openpgp.config.commentstring = 'https://psono.com';
        // Don't show the real version, but keep some version info so we could increment it if ever required.
        openpgp.config.versionstring = 'Psono v1';
        openpgp.initWorker({path: 'js/lib/openpgp.worker.min.js'});

        return openpgp;
    };

    var app = angular.module('psonocli');
    app.factory("openpgp", [openpgp_js]);

}(angular, openpgp));