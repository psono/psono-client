(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalImportMailGPGKeyAsTextCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.openpgp
     *
     * @description
     * Controller for the "Import Mail GPG Key as Text" modal
     */
    angular.module('psonocli').controller('ModalImportMailGPGKeyAsTextCtrl', ['$scope', '$uibModalInstance', 'managerDatastoreUser', 'openpgp',
        function ($scope, $uibModalInstance, managerDatastoreUser, openpgp) {

            $scope.errors = [];

            $scope.data = {
                title: '',
                name: '',
                email: '',
                passphrase: '',
                public_key: '',
                private_key: ''
            };

            $scope.close = close;
            $scope.save = save;

            activate();

            function activate() {

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalImportMailGPGKeyAsTextCtrl#save
             * @methodOf psonocli.controller:ModalImportMailGPGKeyAsTextCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal. Will trigger the generation of the openpgp key
             */
            function save() {

                $scope.errors = [];

                var public_key = $scope.data['public_key'].trim();
                var private_key = $scope.data['private_key'].trim();

                if (!$scope.data['title']) {
                    $scope.errors.push('TITLE_IS_REQUIRED');
                    return;
                }

                if (!public_key) {
                    $scope.errors.push('YOUR_PUBLIC_GPG_KEY_IS_REQUIRED');
                    return;
                }

                if (!public_key.startsWith('-----BEGIN PGP PUBLIC KEY BLOCK-----') || !public_key.endsWith('-----END PGP PUBLIC KEY BLOCK-----')) {
                    $scope.errors.push('PUBLIC_KEY_MISSING_TAGS');
                    return;
                }

                if (!private_key) {
                    $scope.errors.push('YOUR_PRIVATE_GPG_KEY_IS_REQUIRED');
                    return;
                }

                if (!private_key.startsWith('-----BEGIN PGP PRIVATE KEY BLOCK-----') || !private_key.endsWith('-----END PGP PRIVATE KEY BLOCK-----')) {
                    $scope.errors.push('PRIVATE_KEY_MISSING_TAGS');
                    return;
                }

                var private_key_obj = openpgp.key.readArmored(private_key);
                var public_key_obj = openpgp.key.readArmored(public_key);

                if (private_key_obj.keys.length > 1) {
                    $scope.errors.push('PRIVATE_KEY_CONTAINS_MULTIPLE_KEYS');
                    return;
                }

                if (public_key_obj.keys.length > 1) {
                    $scope.errors.push('PUBLIC_KEY_CONTAINS_MULTIPLE_KEYS');
                    return;
                }

                var priv_key = private_key_obj.keys[0];
                var pub_key = public_key_obj.keys[0];

                pub_key.getPrimaryUser().then(function(primary_user){
                    var name_email_sum = primary_user.user.userId.userid;
                    var emails = name_email_sum.match(/[^@<\s]+@[^@\s>]+/g);
                    if (emails.length > 0) {
                        $scope.data['email'] = emails[0];
                    }

                    var names = name_email_sum.split(/\s+/);

                    if (names.length > 1) {
                        names.pop();
                        $scope.data['name'] = names.join(" ").replace(/"/g, "");
                    }

                    priv_key.decrypt($scope.data.passphrase).then(function(success) {
                        $scope.data['private_key'] = priv_key.armor();
                        $scope.data['public_key'] = pub_key.armor();
                        $uibModalInstance.close($scope.data);
                    }, function(error) {
                        if (error.message === 'KEY_PACKET_IS_ALREADY_DECRYPTED') {
                            $scope.data['private_key'] = priv_key.armor();
                            $scope.data['public_key'] = pub_key.armor();
                            console.log(pub_key);
                            $uibModalInstance.close($scope.data);
                        }
                        $scope.errors.push(error.message);
                    });
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalImportMailGPGKeyAsTextCtrl#close
             * @methodOf psonocli.controller:ModalImportMailGPGKeyAsTextCtrl
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
