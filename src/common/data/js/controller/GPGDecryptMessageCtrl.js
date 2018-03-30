(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:GPGDecryptMessageCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires $uibModal
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.browserClient
     *
     * @description
     * Controller for the Group view
     */
    angular.module('psonocli').controller('GPGDecryptMessageCtrl', ["$scope", "$timeout", "$routeParams", "$uibModal", "cryptoLibrary", "managerDatastorePassword", "browserClient",
        function ($scope, $timeout, $routeParams, $uibModal, cryptoLibrary, managerDatastorePassword, browserClient) {

            $scope.data = {
                decrypting: true,
                message: '',
                sender: '',
                errors: []
            };

            activate();

            function activate() {
                browserClient.emit_sec("read-gpg", $routeParams.gpg_message_id, function(data) {
                    console.log(data);
                    if (data.hasOwnProperty('plaintext')) {
                        $scope.$evalAsync(function() {
                            $scope.data['decrypting'] = false;
                            $scope.data['message'] = data.plaintext.data;
                            $scope.data['sender'] = data.sender;
                        });
                    } else {
                        $scope.$evalAsync(function() {
                            $scope.data['decrypting'] = false;
                            $scope.data['message'] = data.message;
                            $scope.data['sender'] = data.sender;
                        });
                    }
                });
            }
        }]);

}(angular));