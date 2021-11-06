(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:GPGDecryptMessageCtrl
     * @requires $rootScope
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
    angular.module('psonocli').controller('GPGDecryptMessageCtrl', ["$rootScope", "$scope", "$timeout", "$routeParams",
        "$uibModal", "cryptoLibrary", "managerDatastorePassword", "browserClient", "offlineCache",
        function ($rootScope, $scope, $timeout, $routeParams,
                  $uibModal, cryptoLibrary, managerDatastorePassword, browserClient, offlineCache) {

            $scope.data = {
                decrypting: true,
                message: '',
                sender: '',
                errors: []
            };

            activate();

            function activate() {

                if (!offlineCache.is_active() || !offlineCache.is_locked()) {
                    read_gpg()
                } else {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/unlock-offline-cache.html',
                        controller: 'ModalUnlockOfflineCacheCtrl',
                        backdrop: 'static',
                        resolve: {
                        }
                    });

                    modalInstance.result.then(function () {
                        // pass, will be catched later with the on_set_encryption_key event
                    }, function () {
                        $rootScope.$broadcast('force_logout', '');
                    });

                    offlineCache.on_set_encryption_key(function() {
                        modalInstance.close();
                        $timeout(function() {
                            read_gpg();
                        }, 500);
                    });
                }

            }

            function read_gpg() {

                browserClient.emit_sec("read-gpg", $routeParams.gpg_message_id, function(data) {
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