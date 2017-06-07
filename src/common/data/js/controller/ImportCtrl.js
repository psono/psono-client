(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ImportCtrl
     * @requires $scope
     * @requires psonocli.managerImport
     * @requires psonocli.importPsonoPwJson
     * @requires psonocli.importLastPassComCsv
     *
     * @description
     * Controller for the "Import" tab in the "Others" menu
     */
    angular.module('psonocli').controller('ImportCtrl', ['$scope', 'managerImport', 'importPsonoPwJson',
        'importLastPassComCsv', 'importKeePassCsv', 'importKeePassXCsv',
        function ($scope, managerImport, importPsonoPwJson,
                  importLastPassComCsv, importKeePassCsv, importKeePassXCsv) {

            $scope.import_options = {
                options: managerImport.get_importer()
            };
            $scope.state = {
                open_secret_requests: 0,
                closed_secret_request: 0,
                upload_ongoing: false
            };

            $scope.import_datastore = import_datastore;

            activate();

            function activate() {
                managerImport.on('import-started', function(){
                    $scope.state.upload_ongoing = true;
                });

                managerImport.on('create-secret-started', function(){
                    $scope.state.open_secret_requests = $scope.state.open_secret_requests + 1;
                });

                managerImport.on('create-secret-complete', function(){
                    $scope.state.closed_secret_request = $scope.state.closed_secret_request + 1;
                });

                managerImport.on('import-complete', function(){
                    $scope.state.open_secret_requests = 0;
                    $scope.state.closed_secret_request = 0;
                    $scope.state.upload_ongoing = false;
                });
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