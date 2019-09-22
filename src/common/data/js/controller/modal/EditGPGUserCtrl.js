(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditGPGUserCtrl
     * @requires $rootScope
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.managerDatastoreGPGUser
     * @requires psonocli.helper
     * @requires psonocli.offlineCache
     * @requires psonocli.settings
     * @requires psonocli.openpgp
     *
     * @description
     * Controller for the "Edit Folder" modal
     */
    angular.module('psonocli').controller('ModalEditGPGUserCtrl', ['$rootScope', '$scope', '$uibModalInstance',
        'managerDatastoreGPGUser', 'helper', 'offlineCache', 'settings', 'openpgp', 'user',
        function ($rootScope, $scope, $uibModalInstance,
                  managerDatastoreGPGUser, helper, offlineCache, settings, openpgp, user) {

            $scope.cancel = cancel;
            $scope.add_public_key = add_public_key;
            $scope.add_new_public_key = add_new_public_key;
            $scope.delete_public_key = delete_public_key;
            $scope.search_public_key_server = search_public_key_server;
            $scope.choose_as_default_key = choose_as_default_key;
            $scope.add_existing_recipient = add_existing_recipient;
            $scope.data = user;
            $scope.data.new_email = user.email;

            activate();

            function activate() {
                $scope.offline = offlineCache.is_active();
                $rootScope.$on('offline_mode_enabled', function() {
                    $scope.offline = true;
                });

                $rootScope.$on('offline_mode_disabled', function() {
                    $scope.offline = false;
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGPGUserCtrl#add_public_key
             * @methodOf psonocli.controller:ModalEditGPGUserCtrl
             *
             * @description
             * Triggered once someone clicks the "Add Public Key" link
             */
            function add_public_key() {
                console.log($scope.data);
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGPGUserCtrl#add_new_recipient
             * @methodOf psonocli.controller:ModalEditGPGUserCtrl
             *
             * @description
             * Triggered once someone clicks the "Add" in the "Add New Key" tab
             */
            function add_new_public_key() {
                $scope.errors = [];
                if (!$scope.data.new_public_key) {
                    $scope.errors.push("PUBLIC_KEY_IS_REQUIRED");
                    return;
                }

                var onSuccess = function (data) {

                    $scope.data.default_public_key = data.default_public_key;

                    if (data.hasOwnProperty('error')) {
                        $scope.errors.push(data.error);
                    } else {
                        $uibModalInstance.close({
                            user: angular.copy($scope.data),
                            public_key: $scope.data.new_public_key
                        });
                    }
                };

                var onError = function (data) {
                    if (data.hasOwnProperty('error')) {
                        $scope.errors.push(data.error);
                    } else {
                        console.log(data);
                        alert("Error, should not happen.");
                    }
                };

                managerDatastoreGPGUser.add_public_key(user, [$scope.data.new_public_key]).then(onSuccess, onError);
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGPGUserCtrl#add_public_key
             * @methodOf psonocli.controller:ModalEditGPGUserCtrl
             *
             * @description
             * Triggered once someone clicks the "Add Public Key" link
             */
            function delete_public_key(public_key) {

                var onSuccess = function (data) {

                    $scope.data.default_public_key = data.default_public_key;

                    var fp2 = openpgp.key.readArmored(public_key).keys[0];
                    helper.remove_from_array($scope.data.public_keys, public_key, function(pub1, pub2) {
                        var fp1 = openpgp.key.readArmored(pub1).keys[0];
                        return fp1.primaryKey.fingerprint === fp2.primaryKey.fingerprint;
                    })
                };

                var onError = function (data) {
                    if (data.hasOwnProperty('error')) {
                        $scope.errors.push(data.error);
                    } else {
                        console.log(data);
                        alert("Error, should not happen.");
                    }
                };

                managerDatastoreGPGUser.remove_public_key($scope.data, [public_key]).then(onSuccess, onError);
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGPGUserCtrl#search_public_key_server
             * @methodOf psonocli.controller:ModalEditGPGUserCtrl
             *
             * @description
             * Triggered once someone clicks the "Search Public Key Server" Button
             */
            function search_public_key_server () {
                $scope.errors = [];
                if (!$scope.data.new_email) {
                    $scope.errors.push("EMAIL_IS_REQUIRED");
                    return;
                }

                var hkp = new openpgp.HKP(settings.get_setting('gpg_hkp_key_server'));
                var options = {
                    query: $scope.data.new_email
                };

                hkp.lookup(options).then(function(public_key) {
                    if (typeof(public_key) !== 'undefined') {
                        $scope.$evalAsync(function() {
                            $scope.data.new_public_key = public_key;
                        });
                    } else {
                        $scope.errors.push("NO_PUBLIC_KEY_FOUND_FOR_EMAIL")
                    }
                }, function(error) {
                    console.log(error);
                });

            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGPGUserCtrl#choose_as_default_key
             * @methodOf psonocli.controller:ModalEditGPGUserCtrl
             *
             * @description
             * Triggered once someone clicks the "Crosshair" Button
             */
            function choose_as_default_key (public_key) {
                $scope.data.default_public_key = public_key;
                managerDatastoreGPGUser.choose_as_default_key($scope.data, public_key);
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGPGUserCtrl#add_existing_recipient
             * @methodOf psonocli.controller:ModalEditGPGUserCtrl
             *
             * @description
             * Triggered once someone clicks the "Plus" button to select a specific key
             */
            function add_existing_recipient (public_key) {
                $uibModalInstance.close({
                    user: angular.copy($scope.data),
                    public_key: public_key
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGPGUserCtrl#cancel
             * @methodOf psonocli.controller:ModalEditGPGUserCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));
