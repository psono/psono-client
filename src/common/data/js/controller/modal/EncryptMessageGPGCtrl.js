(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEncryptMessageGPGCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires $uibModal
     * @requires $uibModalInstance
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.managerDatastoreSetting
     * @requires psonocli.managerDatastore
     * @requires psonocli.browserClient
     * @requires psonocli.settings
     * @requires psonocli.helper
     * @requires psonocli.openpgp
     *
     * @description
     * Controller for the Group view
     */
    angular.module('psonocli').controller('ModalEncryptMessageGPGCtrl', ["$scope", "$timeout", "$routeParams", "$uibModal", "$uibModalInstance",
        "cryptoLibrary", "managerDatastorePassword", "managerDatastoreSetting", "managerDatastore", "managerDatastoreGPGUser",
        "managerSecret", "browserClient", "settings", "helper", "openpgp", "secret_id",
        function ($scope, $timeout, $routeParams, $uibModal, $uibModalInstance,
                  cryptoLibrary, managerDatastorePassword, managerDatastoreSetting, managerDatastore, managerDatastoreGPGUser,
                  managerSecret, browserClient, settings, helper, openpgp, secret_id) {

            var receiver_index = {};

            var known_users = [];
            var known_user_index = {};

            $scope.encrypt = encrypt;
            $scope.cancel = cancel;
            $scope.delete_receiver = delete_receiver;
            $scope.open_address_book = open_address_book;
            $scope.edit_gpg_user = edit_gpg_user;
            $scope.add_gpg_user = add_gpg_user;
            $scope.data = {
                encrypting: false,
                encrypting_complete: false,
                sign_message: true,
                message: '',
                receiver: [],
                errors: [],
                private_key_options: [],
                private_key: {}
            };

            activate();

            function activate() {
                load_own_pgp_keys(secret_id);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEncryptMessageGPGCtrl#load_own_pgp_keys
             * @methodOf psonocli.controller:ModalEncryptMessageGPGCtrl
             *
             * @description
             * Loads the own pgp keys for the select menu and preselects the default key.
             */
            function load_own_pgp_keys(secret_id) {

                var onSuccess = function () {
                    var settings_default_key = settings.get_setting('gpg_default_key');

                    managerDatastorePassword.get_password_datastore().then(function(datastore) {

                        var own_pgp_secrets = [];

                        var default_secret;

                        managerDatastore.filter(datastore, function(item) {
                            if (!item.hasOwnProperty("type") || item['type'] !== 'mail_gpg_own_key') {
                                return;
                            }

                            var own_pgp_secret = {
                                id: item.id,
                                label: item.name,
                                secret_id: item.secret_id,
                                secret_key: item.secret_key
                            };

                            if (secret_id && item.secret_id === secret_id) {
                                default_secret = own_pgp_secret;
                            }
                            if (!default_secret && settings_default_key && settings_default_key.hasOwnProperty('id') && settings_default_key.id === item.id) {
                                default_secret = own_pgp_secret;
                            }
                            own_pgp_secrets.push(own_pgp_secret);
                        });

                        if (default_secret) {
                            $scope.data.private_key = default_secret;
                        }
                        $scope.data.private_key_options = own_pgp_secrets;

                    })
                };

                var onError = function () {
                    alert("Error, should not happen.");
                };

                managerDatastoreSetting.get_settings_datastore().then(onSuccess, onError);
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalEncryptMessageGPGCtrl#delete_receiver
             * @methodOf psonocli.controller:ModalEncryptMessageGPGCtrl
             *
             * @description
             * Removes a receiver from the receiver list
             */
            function delete_receiver(receiver) {
                helper.remove_from_array($scope.data.receiver, receiver, function(a, b) {
                    return a.email === b.email;
                });
                if (receiver_index.hasOwnProperty(receiver.email.toLowerCase())) {
                    delete receiver_index[receiver.email.toLowerCase()];
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEncryptMessageGPGCtrl#update_known_users
             * @methodOf psonocli.controller:ModalEncryptMessageGPGCtrl
             *
             * @description
             * Updates the known_user_index and known_users array with the user details provided
             *
             * @param user
             */
            function update_known_users(user) {
                if (known_user_index.hasOwnProperty(user.email.toLowerCase())) {
                    known_user_index[user.email.toLowerCase()].id = user.id;
                    known_user_index[user.email.toLowerCase()].email = user.email;
                    known_user_index[user.email.toLowerCase()].public_keys = user.public_keys;
                    known_user_index[user.email.toLowerCase()].default_public_key = user.default_public_key;
                } else {
                    var known_user = {
                        id: user.id,
                        email: user.email,
                        public_keys: user.public_keys,
                        default_public_key: user.default_public_key
                    };
                    known_users.push(known_user);
                    known_user_index[user.email.toLowerCase()] = known_user;
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEncryptMessageGPGCtrl#update_receiver_index
             * @methodOf psonocli.controller:ModalEncryptMessageGPGCtrl
             *
             * @description
             * updates the user details in the list that is shown on the page.
             *
             * @param user
             * @param public_key
             */
            function update_receiver_index(user, public_key) {
                var i;
                if (user.public_keys.length > 0 && receiver_index.hasOwnProperty(user.email.toLowerCase())) {

                    if (public_key) {
                        for (i = 0; i < user.public_keys.length; i++) {
                            if (user.default_public_key === user.public_keys[i].id) {
                                receiver_index[user.email.toLowerCase()]['status'] = 'found';
                                receiver_index[user.email.toLowerCase()]['key_status'] = 'trusted';
                                receiver_index[user.email.toLowerCase()]['public_key'] = public_key;
                                receiver_index[user.email.toLowerCase()]['public_keys'] = user.public_keys;
                            }
                        }
                    } else if (user.default_public_key) {
                        //lets search for the default key
                        for (i = 0; i < user.public_keys.length; i++) {
                            if (user.default_public_key === user.public_keys[i].id) {
                                receiver_index[user.email.toLowerCase()]['status'] = 'found';
                                receiver_index[user.email.toLowerCase()]['key_status'] = 'trusted';
                                receiver_index[user.email.toLowerCase()]['public_key'] = user.public_keys[i];
                                receiver_index[user.email.toLowerCase()]['public_keys'] = user.public_keys;
                                receiver_index[user.email.toLowerCase()]['default_public_key'] = user.default_public_key;
                            }
                        }
                    }
                    // if we havent found a default key, we add the first one.
                    if (!receiver_index[user.email.toLowerCase()]['public_key']) {
                        receiver_index[user.email.toLowerCase()]['status'] = 'found';
                        receiver_index[user.email.toLowerCase()]['key_status'] = 'trusted';
                        receiver_index[user.email.toLowerCase()]['public_key'] = user.public_keys[0];
                        receiver_index[user.email.toLowerCase()]['public_keys'] = user.public_keys;
                        receiver_index[user.email.toLowerCase()]['default_public_key'] = user.public_keys[0];
                    }
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEncryptMessageGPGCtrl#remove_receiver
             * @methodOf psonocli.controller:ModalEncryptMessageGPGCtrl
             *
             * @description
             * Removes an email from the receiver index and receiver list
             *
             * @param email
             */
            function remove_receiver(email) {
                email = email.toLowerCase();
                if (receiver_index.hasOwnProperty(email)) {
                    delete receiver_index[email];
                }

                helper.remove_from_array($scope.data.receiver, email, function(a, b) {
                    return a.email === b;
                })
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEncryptMessageGPGCtrl#open_address_book
             * @methodOf psonocli.controller:ModalEncryptMessageGPGCtrl
             *
             * @description
             * Adds a receiver to the receiver list
             */
            function open_address_book(email) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-add-gpg-receiver.html',
                    controller: 'ModalAddGPGReceiverCtrl',
                    resolve: {
                        email: function() {
                            return email;
                        }
                    }
                });

                modalInstance.result.then(function (data) {
                    // User clicked the prime button
                    var user = data.user;
                    var public_key = data.public_key;

                    if (receiver_index.hasOwnProperty(user.email.toLowerCase())) {
                        receiver_index[user.email.toLowerCase()].status = 'searching';
                        receiver_index[user.email.toLowerCase()].key_status = 'trusted';
                        receiver_index[user.email.toLowerCase()].public_key = '';
                        receiver_index[user.email.toLowerCase()].public_keys = user.public_keys;
                    } else {
                        var receiver_entry = {
                            email: user.email,
                            status: "searching",
                            key_status: "trusted",
                            public_key: "",
                            public_keys: user.public_keys
                        };
                        receiver_index[user.email.toLowerCase()] = receiver_entry;
                        $scope.data.receiver.push(receiver_entry);
                    }

                    update_known_users(user);
                    update_receiver_index(user, public_key);

                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEncryptMessageGPGCtrl#edit_gpg_user
             * @methodOf psonocli.controller:ModalEncryptMessageGPGCtrl
             *
             * @description
             * Triggered once someone clicks on the address book link next to a user. Will open the edit gpg user modal
             */
            function edit_gpg_user(user) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-edit-gpg-user.html',
                    controller: 'ModalEditGPGUserCtrl',
                    resolve: {
                        user: function() {
                            return user;
                        }
                    }
                });

                modalInstance.result.then(function (data) {
                    // User clicked the prime button
                    update_receiver_index(data.user, data.public_key);
                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEncryptMessageGPGCtrl#add_gpg_user
             * @methodOf psonocli.controller:ModalEncryptMessageGPGCtrl
             *
             * @description
             * Triggered once someone clicks on the address book link next to a user. Will open the edit gpg user modal
             */
            function add_gpg_user(user) {

                user.id = cryptoLibrary.generate_uuid();
                user.default_public_key = user.public_key;
                user.key_status = 'trusted';

                managerDatastoreGPGUser.add_user(user)
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEncryptMessageGPGCtrl#encrypt
             * @methodOf psonocli.controller:ModalEncryptMessageGPGCtrl
             *
             * @description
             * Triggered once someone clicks the "Encrypt" button
             */
            function encrypt() {
                $scope.errors = [];
                $scope.data['encrypting'] = true;

                if ($scope.data.receiver.length === 0) {
                    $scope.errors = ['You have to pick a receiver'];
                    $scope.data['encrypting'] = false;
                    return;
                }

                if ($scope.data.sign_message && !$scope.data.private_key) {
                    $scope.errors = ['You have to specify a private key if you want to sign messages.'];
                    $scope.data['encrypting'] = false;
                    return;
                }

                var receivers = [];
                var public_keys = [];

                for (var i = 0; i < $scope.data.receiver.length; i++) {
                    if (!$scope.data.receiver[i]['public_key']) {
                        $scope.errors = ['Please remove receivers that have no public key.'];
                        $scope.data['encrypting'] = false;
                        return;
                    }
                    receivers.push($scope.data.receiver[i]['email']);
                    public_keys.push($scope.data.receiver[i]['public_key']);
                }

                var options;

                function finalise_encryption(options) {
                    openpgp.encrypt(options).then(function(ciphertext) {
                        $scope.$evalAsync(function() {
                            $scope.data.encrypted_message = ciphertext.data;
                            $scope.data.encrypting = false;
                            $scope.data.encrypting_complete = true;
                        });
                    });
                }

                if ($scope.data.sign_message) {

                    var onSuccess = function(data) {

                        options = {
                            data: $scope.data.message,
                            publicKeys: openpgp.key.readArmored(public_keys.join("\n")).keys,
                            privateKeys: openpgp.key.readArmored(data['mail_gpg_own_key_private']).keys
                        };

                        finalise_encryption(options);
                    };

                    var onError = function() {

                    };

                    managerSecret.read_secret($scope.data.private_key.secret_id, $scope.data.private_key.secret_key)
                        .then(onSuccess, onError);
                } else {
                    options = {
                        data: $scope.data.message,
                        publicKeys: openpgp.key.readArmored(public_keys.join("\n")).keys,
                    };
                    finalise_encryption(options);
                }

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEncryptMessageGPGCtrl#cancel
             * @methodOf psonocli.controller:ModalEncryptMessageGPGCtrl
             *
             * @description
             * Triggered once someone clicks the close button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('close');
            }
        }]);

}(angular));