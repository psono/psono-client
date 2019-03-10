(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalAddGPGReceiverCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires $uibModal
     * @requires psonocli.managerDatastoreGPGUser
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.helper
     * @requires psonocli.openpgp
     *
     * @description
     * Controller for the "AcceptShare" modal
     */
    angular.module('psonocli').controller('ModalAddGPGReceiverCtrl', ['$scope', '$uibModalInstance', '$uibModal',
        'managerDatastoreGPGUser', 'managerDatastore', 'cryptoLibrary', 'settings', 'helper', 'openpgp', 'email',
        function ($scope, $uibModalInstance, $uibModal,
                  managerDatastoreGPGUser, managerDatastore, cryptoLibrary, settings, helper, openpgp, email) {

            $scope.save = save;
            $scope.cancel = cancel;
            $scope.search_public_key_server = search_public_key_server;
            $scope.add_new_recipient = add_new_recipient;
            $scope.add_existing_recipient = add_existing_recipient;
            $scope.delete_receiver = delete_receiver;
            $scope.edit_gpg_user = edit_gpg_user;
            $scope.data = {
                new_email: '',
                new_public_key: '',
                new_fingerprint: '',
                receiver: [],
                add_recipients_tab_active: false
            };

            activate();

            function activate() {
                if (email) {
                    $scope.new_email = email;
                    $scope.add_recipients_tab_active = true;
                }

                var onSuccess = function (datastore) {

                    managerDatastore.filter(datastore, function(user) {
                        $scope.data.receiver.push(user);
                    });


                };

                var onError = function () {
                    alert("Error, should not happen.");
                };

                managerDatastoreGPGUser.get_gpg_user_datastore().then(onSuccess, onError);


                $scope.$watch('data.new_public_key', function(newValue, oldValue) {
                    var key = openpgp.key.readArmored(newValue).keys[0];
                    if (key) {
                        $scope.data.new_fingerprint = key.primaryKey.fingerprint;
                    } else {
                        $scope.data.new_fingerprint = '';
                    }
                });
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalAddGPGReceiverCtrl#search_public_key_server
             * @methodOf psonocli.controller:ModalAddGPGReceiverCtrl
             *
             * @description
             * Triggered once someone clicks the "Search Public Key Server" Button
             */
            function search_public_key_server () {
                $scope.errors = [];
                if (!$scope.data.new_email) {
                    $scope.errors.push("E-Mail required.");
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
                        $scope.errors.push("No public key found for this email.")
                    }
                }, function(error) {
                    console.log(error);
                });

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAddGPGReceiverCtrl#edit_gpg_user
             * @methodOf psonocli.controller:ModalAddGPGReceiverCtrl
             *
             * @description
             * Triggered once someone clicks on the address book link next to a user. Will open the edit gpg user modal
             */
            function edit_gpg_user(user) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/edit-gpg-user.html',
                    controller: 'ModalEditGPGUserCtrl',
                    resolve: {
                        user: function() {
                            return user;
                        }
                    }
                });

                modalInstance.result.then(function (data) {
                    // User clicked the prime button
                    $uibModalInstance.close(data);
                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAddGPGReceiverCtrl#delete_receiver
             * @methodOf psonocli.controller:ModalAddGPGReceiverCtrl
             *
             * @description
             * Triggered once someone clicks the "Delete" Button for a recipient
             */
            function delete_receiver (user) {

                var onSuccess = function (datastore) {
                    helper.remove_from_array($scope.data.receiver, user, function(a, b) {
                        return a.id === b.id;
                    });

                };
                var onError = function () {
                    // pass
                };

                managerDatastoreGPGUser.delete_user(user)
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAddGPGReceiverCtrl#add_new_recipient
             * @methodOf psonocli.controller:ModalAddGPGReceiverCtrl
             *
             * @description
             * Triggered once someone clicks the "Add" Button for a new recipient
             */
            function add_new_recipient () {
                $scope.errors = [];
                if (!$scope.data.new_public_key) {
                    $scope.errors.push("Public Key required.");
                    return;
                }
                if (!$scope.data.new_public_key) {
                    $scope.errors.push("Public Key required.");
                    return;
                }
                if (!$scope.data.new_email) {
                    $scope.errors.push("E-Mail not provided.");
                    return;
                }
                if (!helper.is_valid_email($scope.data.new_email)) {
                    $scope.errors.push("Invalid E-Mail address.");
                    return;
                }

                var user = {
                    'id': cryptoLibrary.generate_uuid(),
                    'email': $scope.data.new_email,
                    'public_keys': [
                        openpgp.key.readArmored($scope.data.new_public_key).keys[0].armor()
                    ]
                };

                var onSuccess = function (user) {
                    if (user.hasOwnProperty('error')) {
                        $scope.errors.push(user.error);
                    } else {
                        $uibModalInstance.close({user: user, public_key: user.default_public_key});
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

                managerDatastoreGPGUser.add_user(user).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAddGPGReceiverCtrl#add_existing_recipient
             * @methodOf psonocli.controller:ModalAddGPGReceiverCtrl
             *
             * @description
             * Triggered once someone clicks the "Add" Button for an existing user
             */
            function add_existing_recipient (user) {
                $scope.errors = [];
                $uibModalInstance.close({user: angular.copy(user), public_key: user.default_public_key});
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAddGPGReceiverCtrl#save
             * @methodOf psonocli.controller:ModalAddGPGReceiverCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save () {

                $uibModalInstance.close();
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAddGPGReceiverCtrl#cancel
             * @methodOf psonocli.controller:ModalAddGPGReceiverCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }

        }]
    );
}(angular));