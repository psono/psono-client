(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:GPGEncryptMessageCtrl
     * @requires $rootScope
     * @requires $scope
     * @requires $routeParams
     * @requires $uibModal
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.managerDatastoreSetting
     * @requires psonocli.managerDatastore
     * @requires psonocli.browserClient
     * @requires psonocli.offlineCache
     * @requires psonocli.settings
     * @requires psonocli.helper
     * @requires psonocli.openpgp
     *
     * @description
     * Controller for the Group view
     */
    angular.module('psonocli').controller('GPGEncryptMessageCtrl', ["$rootScope", "$scope", "$timeout", "$routeParams", "$uibModal",
        "cryptoLibrary", "managerDatastorePassword", "managerDatastoreSetting", "managerDatastore", "managerDatastoreGPGUser",
        "browserClient", "offlineCache", "settings", "helper", "openpgp",
        function ($rootScope, $scope, $timeout, $routeParams, $uibModal,
                  cryptoLibrary, managerDatastorePassword, managerDatastoreSetting, managerDatastore, managerDatastoreGPGUser,
                  browserClient, offlineCache, settings, helper, openpgp) {

            var receiver_index = {};

            var known_users = [];
            var known_user_index = {};

            $scope.encrypt = encrypt;
            $scope.delete_receiver = delete_receiver;
            $scope.open_address_book = open_address_book;
            $scope.edit_gpg_user = edit_gpg_user;
            $scope.add_gpg_user = add_gpg_user;
            $scope.data = {
                encrypting: false,
                sign_message: true,
                message: '',
                receiver: [],
                errors: [],
                private_key_options: [],
                private_key: {}
            };

            activate();

            function activate() {
                $scope.offline = offlineCache.is_active();
                $rootScope.$on('offline_mode_enabled', function() {
                    $scope.offline = true;
                });

                $rootScope.$on('offline_mode_disabled', function() {
                    $scope.offline = false;
                });

                browserClient.emit_sec("write-gpg", $routeParams.gpg_message_id, function(data) {
                    $scope.$evalAsync(function() {
                        load_receiver(data.receiver);
                    });
                });

                load_own_pgp_keys();
            }

            /**
             * @ngdoc
             * @name psonocli.controller:GPGEncryptMessageCtrl#load_own_pgp_keys
             * @methodOf psonocli.controller:GPGEncryptMessageCtrl
             *
             * @description
             * Loads the own pgp keys for the select menu and preselects the default key.
             */
            function load_own_pgp_keys() {

                var onSuccess = function () {
                    var settings_default_key = settings.get_setting('gpg_default_key');

                    managerDatastorePassword.get_password_datastore().then(function(datastore) {

                        var own_pgp_secrets = [];

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

                            if (settings_default_key && settings_default_key.hasOwnProperty('id') && settings_default_key.id === item.id) {
                                $scope.data.private_key = own_pgp_secret;
                            }
                            own_pgp_secrets.push(own_pgp_secret);
                        });
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
             * @name psonocli.controller:GPGEncryptMessageCtrl#load_receiver
             * @methodOf psonocli.controller:GPGEncryptMessageCtrl
             *
             * @description
             * Loads the list of receivers
             *
             * @param receiver
             */
            function load_receiver(receiver) {

                var onSuccess = function (datastore) {
                    var i;

                    // First build the preselected receiver list
                    $scope.data.receiver = [];
                    receiver_index = {};
                    for (i = 0; i < receiver.length; i ++) {
                        var receiver_entry = {
                            email: receiver[i].toLowerCase(),
                            status: "not searched",
                            key_status: "",
                            public_key: "",
                            public_keys: []
                        };
                        receiver_index[receiver_entry['email']] = receiver_entry;
                        $scope.data.receiver.push(receiver_entry);
                    }

                    known_users=[];
                    known_user_index={};

                    managerDatastore.filter(datastore, function(user) {

                        update_known_users(user);
                        update_receiver_index(user);
                    });

                    function lookup_from_hkp(receiver) {
                        var hkp = new openpgp.HKP(settings.get_setting('gpg_hkp_key_server'));
                        var options = {
                            query: receiver['email']
                        };
                        hkp.lookup(options).then(function(public_key) {
                            if (typeof(public_key) !== 'undefined') {
                                receiver['status'] = 'found';
                                receiver['key_status'] = 'untrusted';
                                receiver['public_key'] = public_key;
                                receiver['public_keys'].push(public_key);
                            } else {
                                remove_receiver(receiver['email'])
                            }
                        }, function(error) {
                            remove_receiver(receiver['email']);
                            console.log(error);
                        });
                    }

                    var hkp_search = settings.get_setting('gpg_hkp_search');
                    for (i=0; i < $scope.data.receiver.length; i++) {
                        if ($scope.data.receiver[i]['status'] !== 'not searched') {
                            continue;
                        }
                        if (hkp_search &&  $scope.data.receiver[i]['email'] && $scope.data.receiver[i]['email'].length) {
                            lookup_from_hkp($scope.data.receiver[i]);
                        } else {
                            remove_receiver($scope.data.receiver[i]['email'])
                        }
                    }

                };

                var onError = function () {
                    alert("Error, should not happen.");
                };

                managerDatastoreGPGUser.get_gpg_user_datastore().then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:GPGEncryptMessageCtrl#delete_receiver
             * @methodOf psonocli.controller:GPGEncryptMessageCtrl
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
             * @name psonocli.controller:GPGEncryptMessageCtrl#update_known_users
             * @methodOf psonocli.controller:GPGEncryptMessageCtrl
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
             * @name psonocli.controller:GPGEncryptMessageCtrl#update_receiver_index
             * @methodOf psonocli.controller:GPGEncryptMessageCtrl
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
             * @name psonocli.controller:GPGEncryptMessageCtrl#remove_receiver
             * @methodOf psonocli.controller:GPGEncryptMessageCtrl
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
             * @name psonocli.controller:GPGEncryptMessageCtrl#open_address_book
             * @methodOf psonocli.controller:GPGEncryptMessageCtrl
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
             * @name psonocli.controller:GPGEncryptMessageCtrl#edit_gpg_user
             * @methodOf psonocli.controller:GPGEncryptMessageCtrl
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
             * @name psonocli.controller:GPGEncryptMessageCtrl#add_gpg_user
             * @methodOf psonocli.controller:GPGEncryptMessageCtrl
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
             * @name psonocli.controller:GPGEncryptMessageCtrl#encrypt
             * @methodOf psonocli.controller:GPGEncryptMessageCtrl
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

                browserClient.emit_sec('write-gpg-complete', {
                    'message': $scope.data.message,
                    'message_id': $routeParams.gpg_message_id,
                    'receivers': receivers,
                    'public_keys': public_keys,
                    'sign_message': $scope.data.sign_message,
                    'private_key': $scope.data.private_key
                });

            }
        }]);

}(angular));