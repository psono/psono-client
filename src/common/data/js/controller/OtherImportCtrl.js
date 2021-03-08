(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:OtherImportCtrl
     * @requires $scope
     * @requires psonocli.managerImport
     * @requires psonocli.import1PasswordCsv
     * @requires psonocli.importChromeCsv
     * @requires psonocli.importPsonoPwJson
     * @requires psonocli.importLastPassComCsv
     * @requires psonocli.importKeePassCsv
     * @requires psonocli.importKeePassXml
     * @requires psonocli.importKeePassXCsv
     * @requires psonocli.importPasswordSafeCsv
     *
     * @description
     * Controller for the "Import" tab in the "Others" menu
     */
    angular.module('psonocli').controller('OtherImportCtrl', ['$scope', 'managerImport', 'importPsonoPwJson',
        'import1PasswordCsv', 'importChromeCsv',
        'importLastPassComCsv', 'importKeePassCsv', 'importKeePassXml', 'importKeePassXCsv', 'importPasswordSafeCsv',
        function ($scope, managerImport, importPsonoPwJson,
                  import1PasswordCsv, importChromeCsv,
                  importLastPassComCsv, importKeePassCsv, importKeePassXml, importKeePassXCsv, importPasswordSafeCsv) {

            $scope.import_options = {
                options: managerImport.get_importer(),
                encoding: [
                    'utf-8',
                    'utf-16',
                    'iso-8859-2',
                    'iso-8859-3',
                    'iso-8859-4',
                    'iso-8859-5',
                    'iso-8859-6',
                    'iso-8859-7',
                    'iso-8859-8',
                    'iso-8859-8-i',
                    'iso-8859-10',
                    'iso-8859-13',
                    'iso-8859-14',
                    'iso-8859-15',
                    'iso-8859-16',
                    'windows-874',
                    'windows-1250',
                    'windows-1251',
                    'windows-1252',
                    'windows-1254',
                    'windows-1255',
                    'windows-1256',
                    'windows-1257',
                    'windows-1258',
                ],
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
             * @ngdoc
             * @name psonocli.controller:OtherImportCtrl#import_datastore
             * @methodOf psonocli.controller:OtherImportCtrl
             *
             * @description
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