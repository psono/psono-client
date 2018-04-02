(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalDecryptMessageGPGCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires $routeParams
     * @requires $uibModal
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.settings
     *
     * @description
     * Controller for the Group view
     */
    angular.module('psonocli').controller('ModalDecryptMessageGPGCtrl', ["$scope", "$uibModalInstance", "$timeout", "$routeParams", "$uibModal", "cryptoLibrary", "managerDatastorePassword", "settings",
        function ($scope, $uibModalInstance, $timeout, $routeParams, $uibModal, cryptoLibrary, managerDatastorePassword, settings) {

            $scope.decrypt = decrypt;
            $scope.cancel = cancel;
            $scope.data = {
                decrypting: false,
                message: '',
                sender: ''
            };
            $scope.errors = [];

            activate();

            function activate() {

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDecryptMessageGPGCtrl#decrypt
             * @methodOf psonocli.controller:ModalDecryptMessageGPGCtrl
             *
             * @description
             * Triggered once someone clicks the "Decrypt" button
             */
            function decrypt() {
                $scope.errors = [];
                $scope.data['decrypting'] = true;

                if (!$scope.data.message) {
                    $scope.errors = ['You have to provide an encrypted message'];
                    $scope.data['decrypting'] = false;
                    return;
                }

                var pgp_sender = [];

                function decrypt(public_key) {
                    return managerDatastorePassword.get_all_own_pgp_keys().then(function(private_keys) {

                        var private_keys_array = [];

                        for (var i = 0; i < private_keys.length; i++ ) {
                            var temp = openpgp.key.readArmored(private_keys[i]).keys;
                            for (var ii = 0; ii < temp.length; ii++) {
                                private_keys_array.push(temp[ii]);
                            }
                        }

                        //console.log(pgp_sender);

                        if (public_key) {
                            options = {
                                message: openpgp.message.readArmored($scope.data.message),     // parse armored message
                                publicKeys: openpgp.key.readArmored(public_key).keys,
                                privateKeys: private_keys_array
                            };
                        } else {
                            options = {
                                message: openpgp.message.readArmored($scope.data.message),     // parse armored message
                                privateKeys: private_keys_array
                            };
                        }

                        openpgp.decrypt(options).then(function(plaintext) {
                            $scope.$evalAsync(function() {
                                $scope.data.decrypted_message = plaintext.data;
                                $scope.data.decrypting_complete = true;
                                $scope.data.decrypting = false;
                            });
                        }, function(error) {
                            $scope.$evalAsync(function() {
                                console.log(error);
                                $scope.errors.push(error.message);
                                $scope.data.decrypting = false;
                            });
                        });
                    });
                }

                var gpg_hkp_search = new openpgp.HKP(settings.get_setting('gpg_hkp_search'));

                if (gpg_hkp_search && pgp_sender && pgp_sender.length) {

                    var hkp = new openpgp.HKP(settings.get_setting('gpg_hkp_key_server'));
                    var options = {
                        query: pgp_sender
                    };
                    hkp.lookup(options).then(function(public_key) {
                        decrypt(public_key);
                    }, function(error) {
                        console.log(error);
                        console.log(error.message);
                        decrypt();
                    });
                } else {
                    decrypt();
                }


            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDecryptMessageGPGCtrl#cancel
             * @methodOf psonocli.controller:ModalDecryptMessageGPGCtrl
             *
             * @description
             * Triggered once someone clicks the close button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('close');
            }
        }]);

}(angular));