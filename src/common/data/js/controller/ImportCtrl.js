(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ImportCtrl
     * @requires $scope
     * @requires psonocli.managerImport
     * @requires psonocli.importPsonoPwJson
     *
     * @description
     * Controller for the "Import" tab in the "Others" menu
     */
    angular.module('psonocli').controller('ImportCtrl', ['$scope', '$window', '$timeout', 'managerImport', 'importPsonoPwJson', 'importLastPassComCsv',
        function ($scope, $window, $timeout, managerImport, importPsonoPwJson, importLastPassComCsv) {

            $scope.import_options = {
                options: managerImport.get_importer()
            };
            $scope.state = {
            };

            $scope.import_datastore = import_datastore;

            activate();

            function activate() {

            }

            /**
             * Imports all data of a datastore
             *
             * @param {string} type The type of the import
             * @param {string} data The data of the import
             */
            function import_datastore(type, data) {
                $scope.msgs = [];
                $scope.errors = [];

                var onSuccess = function (data) {
                    $scope.msgs = data.msgs;
                    $scope.errors = [];
                };
                var onError = function (data) {
                    $scope.msgs = [];
                    $scope.errors = data.errors;
                };

                managerImport.import_datastore(type, data)
                    .then(onSuccess, onError);
            }
        }]
    );
}(angular));