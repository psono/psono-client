(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalGenerateNewMailGPGKeyCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.settings
     * @requires psonocli.openpgp
     *
     * @description
     * Controller for the "Generate New Mail GPG Key" modal
     */
    angular.module('psonocli').controller('ModalGenerateNewMailGPGKeyCtrl', ['$scope', '$uibModalInstance', 'managerDatastoreUser', 'settings', 'openpgp',
        function ($scope, $uibModalInstance, managerDatastoreUser, settings, openpgp) {

            $scope.errors = [];
            $scope.data = {
                title: '',
                name: '',
                publish: true,
                email: managerDatastoreUser.get_email()
            };

            $scope.generating = false;

            $scope.close = close;
            $scope.save = save;

            activate();

            function activate() {

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalGenerateNewMailGPGKeyCtrl#save
             * @methodOf psonocli.controller:ModalGenerateNewMailGPGKeyCtrl
             *
             * @description
             * Triggered once someone clicks the Generate button in the modal. Will trigger the generation of the openpgp key
             */
            function save() {

                $scope.errors = [];

                if (!$scope.data['title']) {
                    $scope.errors.push('Title missing.');
                    return;
                }

                if (!$scope.data['email']) {
                    $scope.errors.push('Email missing.');
                    return;
                }

                $scope.generating = true;

                var options = {
                    userIds: [{ name: $scope.data['name'], email: $scope.data['email'] }],
                    numBits: 4096,
                    passphrase: ''
                };
                try {
                    openpgp.generateKey(options).then(function(key) {
                        $scope.data['private_key'] = key.privateKeyArmored;
                        $scope.data['public_key'] = key.publicKeyArmored;

                        if ($scope.data['publish']) {
                            var hkp = new openpgp.HKP(settings.get_setting('gpg_hkp_key_server'));
                            hkp.upload(key.publicKeyArmored).then(function() {
                                $uibModalInstance.close($scope.data);
                            })
                        } else {
                            $uibModalInstance.close($scope.data);
                        }
                    });
                } catch(err) {

                    $scope.generating = false;
                    $scope.errors.push('Email address invalid.')
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalGenerateNewMailGPGKeyCtrl#close
             * @methodOf psonocli.controller:ModalGenerateNewMailGPGKeyCtrl
             *
             * @description
             * Triggered once someone clicks the close button in the modal
             */
            function close() {
                $uibModalInstance.dismiss('close');
            }

        }]
    );
}(angular));
