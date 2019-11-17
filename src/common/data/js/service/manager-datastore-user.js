(function(angular, Raven) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerDatastoreUser
     * @requires $q
     * @requires $rootScope
     * @requires $uibModal
     * @requires $location
     * @requires $window
     * @requires psonocli.apiClient
     * @requires psonocli.browserClient
     * @requires psonocli.storage
     * @requires psonocli.helper
     * @requires psonocli.managerBase
     * @requires psonocli.managerDatastore
     * @requires psonocli.shareBlueprint
     * @requires psonocli.itemBlueprint
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Service to manage the user datastore and user related functions
     */

    var managerDatastoreUser = function($q, $rootScope, $uibModal, $location, $window, apiClient,
                                        browserClient, storage, helper, device, managerBase, managerDatastore, shareBlueprint,
                                        itemBlueprint, cryptoLibrary) {

        var required_multifactors = [];
        var session_keys;
        var session_secret_key;
        var token;
        var user_sauce;
        var user_public_key;
        var user_private_key;
        var session_password;
        var verification;
        var registrations = {};


        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#is_logged_in
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Checks if the user is logged in.
         *
         * @return {boolean} Returns either if the user is logged in
         */
        var is_logged_in = function () {
            var token = managerBase.get_token();
            return token !== null && token !== "";
        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#require_two_fa_setup
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Checks if the user needs to setup a second factor
         *
         * @return {boolean} Returns whether the user should be forced to setup two factor
         */
        var require_two_fa_setup = function () {
            var user_has_two_factor = managerBase.find_key('config', 'user_has_two_factor');
            var server_info = managerBase.find_key('config', 'server_info');
            return server_info !== null
                && !user_has_two_factor
                && server_info['compliance_enforce_2fa']
                && server_info['allowed_second_factors']
                && server_info['allowed_second_factors'].length > 0;
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#on
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * used to register functions for specific events
         *
         * @param {string} event The event to subscribe to
         * @param {function} func The callback function to subscribe
         */
        var on = function (event, func) {
            if (!registrations.hasOwnProperty(event)){
                registrations[event] = [];
            }

            registrations[event].push(func);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#emit
         * @methodOf psonocli.message
         *
         * @description
         * emits an event and calls all registered functions for this event.
         *
         * @param {string} event The event to trigger
         * @param {*} data The payload data to send to the subscribed callback functions
         */
        var emit = function (event, data) {

            if (!registrations.hasOwnProperty(event)){
                return;
            }
            for (var i = registrations[event].length - 1; i >= 0; i--) {
                registrations[event][i](data);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#register
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Responsible for the registration. Generates the users public-private-key-pair together with the secret
         * key and the user sauce. Encrypts the sensible data before initiating the register call with the api client.
         *
         * @param {email} email The email to register with
         * @param {string} username The username to register with
         * @param {string} password The password to register with
         * @param {string} server The server to send the registration to
         *
         * @returns {promise} promise
         */
        var register = function(email, username, password, server) {

            var onSuccess = function(base_url){

                managerBase.delete_local_data();

                storage.upsert('config', {key: 'user_email', value: email});
                storage.upsert('config', {key: 'user_username', value: username});
                storage.upsert('config', {key: 'server', value: server});

                var pair = cryptoLibrary.generate_public_private_keypair();
                var user_sauce = cryptoLibrary.generate_user_sauce();

                var priv_key_enc = cryptoLibrary.encrypt_secret(pair.private_key, password, user_sauce);
                var secret_key_enc = cryptoLibrary
                    .encrypt_secret(cryptoLibrary.generate_secret_key(), password, user_sauce);

                var onSuccess = function () {

                    storage.save();

                    return {
                        response:"success"
                    };
                };

                var onError = function(response){

                    storage.remove('config', storage.find_key('config', 'user_email'));
                    storage.remove('config', storage.find_key('config', 'server'));
                    storage.save();

                    return {
                        response:"error",
                        error_data: response.data
                    };
                };

                return apiClient.register(email, username, cryptoLibrary.generate_authkey(username, password), pair.public_key,
                    priv_key_enc.text, priv_key_enc.nonce, secret_key_enc.text, secret_key_enc.nonce, user_sauce,
                    base_url)
                    .then(onSuccess, onError);

            };

            var onError = function(){

            };

            return browserClient.get_base_url().then(onSuccess, onError)

        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#activate_code
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Activates a user account with the provided activation code after registration
         *
         * @param {string} activation_code The activation code sent via mail
         * @param {string} server The server to send the activation code to
         *
         * @returns {promise} Returns a promise with the activation status
         */
        var activate_code = function(activation_code, server) {

            storage.upsert('config', {key: 'server', value: server});

            var onSuccess = function () {

                storage.save();

                return {
                    response:"success"
                };
            };

            var onError = function(response){

                storage.remove('config', storage.find_key('config', 'server'));
                storage.save();

                return {
                    response:"error",
                    error_data: response.data
                };
            };

            return apiClient.verify_email(activation_code)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#activate_token
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Handles the validation of the token with the server by solving the cryptographic puzzle
         *
         * @returns {promise} Returns a promise with the the final activate token was successful or not
         */
        var activate_token = function() {

            var onError = function(response){

                // in case of any error we remove the items we already added to our storage
                // maybe we adjust this behaviour at some time
                storage.remove('config', storage.find_key('config', 'user_username'));
                storage.remove('config', storage.find_key('config', 'server'));

                storage.save();

                // no need anymore for the public / private session keys
                session_keys = null;
                session_secret_key = null;
                token = null;
                user_sauce = null;
                user_public_key = null;
                user_private_key = null;
                session_password = null;
                verification = null;

                return $q.reject({
                    response:"error",
                    error_data: response.data
                });
            };

            var onSuccess = function (activation_data) {
                // decrypt user secret key
                var user_secret_key = cryptoLibrary.decrypt_secret(
                    activation_data.data.user.secret_key,
                    activation_data.data.user.secret_key_nonce,
                    session_password,
                    user_sauce
                );

                Raven.setUserContext({
                    username: managerBase.find_key('config', 'user_username')
                });

                storage.insert('config', {key: 'user_id', value: activation_data.data.user.id});
                storage.insert('config', {key: 'user_token', value: token});
                storage.insert('config', {key: 'user_email', value: activation_data.data.user.email});
                storage.insert('config', {key: 'session_secret_key', value: session_secret_key});
                storage.insert('config', {key: 'user_public_key', value: user_public_key});
                storage.insert('config', {key: 'user_private_key', value: user_private_key});
                storage.insert('config', {key: 'user_secret_key', value: user_secret_key});
                storage.insert('config', {key: 'user_sauce', value: user_sauce});

                storage.save();

                // no need anymore for the public / private session keys
                session_keys = null;
                session_secret_key = null;
                token = null;
                user_sauce = null;
                user_public_key = null;
                user_private_key = null;
                session_password = null;
                verification = null;

                browserClient.emit("login", null);

                return {
                    response:"success"
                };

            };

            return apiClient.activate_token(token, verification.text, verification.nonce, session_secret_key)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#ga_verify
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Ajax POST request to the backend with the token
         *
         * @param {string} ga_token The GA Token
         *
         * @returns {promise} Returns a promise with the login status
         */
        var ga_verify = function(ga_token) {


            var onError = function(response){
                return $q.reject({
                    response:"error",
                    error_data: response.data
                });
            };

            var onSuccess = function () {
                helper.remove_from_array(required_multifactors, 'google_authenticator_2fa');
                return required_multifactors;
            };

            return apiClient.ga_verify(token, ga_token, session_secret_key)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#duo_verify
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Ajax POST request to the backend with the token
         *
         * @param {string} [duo_token] (optional) The Duo Token
         *
         * @returns {promise} Returns a promise with the login status
         */
        var duo_verify = function(duo_token) {


            var onError = function(response){
                return $q.reject({
                    response:"error",
                    error_data: response.data
                });
            };

            var onSuccess = function () {
                helper.remove_from_array(required_multifactors, 'duo_2fa');
                return required_multifactors;
            };

            return apiClient.duo_verify(token, duo_token, session_secret_key)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#yubikey_otp_verify
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Ajax POST request to the backend with the token
         *
         * @param {string} yubikey_otp The YubiKey OTP token
         *
         * @returns {promise} Returns a promise with the login status
         */
        var yubikey_otp_verify = function(yubikey_otp) {


            var onError = function(response){
                return $q.reject({
                    response:"error",
                    error_data: response.data
                });
            };

            var onSuccess = function () {
                helper.remove_from_array(required_multifactors, 'yubikey_otp_2fa');
                return required_multifactors;
            };

            return apiClient.yubikey_otp_verify(token, yubikey_otp, session_secret_key)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#get_default
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Returns the default value for the specified item (username or server)
         *
         * @param {string} item The saved item to return
         *
         * @returns {promise} Returns the saved default value
         */
        var get_default = function(item) {
            if (item === 'username') {
                return managerBase.find_key('persistent', 'username');
            } else if (item === 'server') {
                return managerBase.find_key('persistent', 'server');
            } else if (item === 'trust_device') {
                return managerBase.find_key('persistent', 'trust_device');
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#handle_login_response
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * handles the response of the login with all the necessary cryptography and returns the required multifactors
         *
         * @param {object} response The login response
         * @param {string} password The password
         * @param {object} session_keys The session keys
         * @param {string} server_public_key The server's public key
         *
         * @returns {Array} The list of required multifactor challenges to solve
         */
        var handle_login_response = function(response, password, session_keys, server_public_key) {

            response.data = JSON.parse(cryptoLibrary.decrypt_data_public_key(
                response.data.login_info,
                response.data.login_info_nonce,
                server_public_key,
                session_keys.private_key
            ));
            if (response.data.user.username) {
                storage.upsert('config', {key: 'user_username', value: response.data.user.username});
                storage.upsert('config', {key: 'user_has_two_factor', value: response.data['required_multifactors'].length > 0});
            }

            token = response.data.token;
            user_sauce = response.data.user.user_sauce;
            user_public_key = response.data.user.public_key;
            session_password = password;

            // decrypt the session key
            session_secret_key = cryptoLibrary.decrypt_data_public_key(
                response.data.session_secret_key,
                response.data.session_secret_key_nonce,
                response.data.session_public_key,
                session_keys.private_key
            );

            // decrypt user private key
            user_private_key = cryptoLibrary.decrypt_secret(
                response.data.user.private_key,
                response.data.user.private_key_nonce,
                password,
                user_sauce
            );

            // decrypt the user_validator
            var user_validator = cryptoLibrary.decrypt_data_public_key(
                response.data.user_validator,
                response.data.user_validator_nonce,
                response.data.session_public_key,
                user_private_key
            );

            // encrypt the validator as verification
            verification = cryptoLibrary.encrypt_data(
                user_validator,
                session_secret_key
            );

            required_multifactors = response.data['required_multifactors'];

            return required_multifactors;
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#login
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Ajax POST request to the backend with username and authkey for login, saves a token together with user_id
         * and all the different keys of a user in the api data storage.
         * Also handles the validation of the token with the server by solving the cryptographic puzzle
         *
         * @param {string} username The username to login with
         * @param {string} domain The domain which we append if necessary to the username
         * @param {string} password The password to login with
         * @param {boolean|undefined} remember Remember the username and server
         * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
         * @param {object} server The server object to send the login request to
         * @param {object} server_info Some info about the server including its public key
         * @param {object} verify_key The signature of the server
         * @param {boolean} send_plain Indicates to send the password in the login info in plaintext. Necessary for e.g. LDAP
         *
         * @returns {promise} Returns a promise with the login status
         */
        var login = function(username, domain, password, remember, trust_device, server, server_info, verify_key, send_plain) {

            username = helper.form_full_username(username, domain);

            managerBase.delete_local_data();

            var authkey = cryptoLibrary.generate_authkey(username, password);

            if (remember) {
                storage.upsert('persistent', {key: 'username', value: username});
                storage.upsert('persistent', {key: 'server', value: server});
            } else {
                if (storage.key_exists('persistent', 'username')) {
                    storage.remove('persistent', storage.find_key('persistent', 'username'));
                }
                if (storage.key_exists('persistent', 'server')) {
                    storage.remove('persistent', storage.find_key('persistent', 'server'));
                }
                storage.save();
            }
            storage.upsert('persistent', {key: 'trust_device', value: trust_device});

            if (!server_info.hasOwnProperty('allowed_second_factors')) {
                server_info['allowed_second_factors'] = ['yubikey_otp', 'google_authenticator', 'duo'];
            }

            if (!server_info.hasOwnProperty('allow_user_search_by_email')) {
                server_info['allow_user_search_by_email'] = false;
            }

            storage.upsert('config', {key: 'server_info', value: server_info});
            storage.upsert('config', {key: 'server_verify_key', value: verify_key});
            storage.upsert('config', {key: 'user_username', value: username});
            storage.upsert('config', {key: 'server', value: server});

            session_keys = cryptoLibrary.generate_public_private_keypair();

            var onError = function(response){

                // in case of any error we remove the items we already added to our storage
                // maybe we adjust this behaviour at some time
                storage.remove('config', storage.find_key('config', 'user_username'));
                storage.remove('config', storage.find_key('config', 'server'));
                storage.save();

                return $q.reject({
                    response:"error",
                    error_data: response.data
                });
            };

            var onSuccess = function (response) {
                return handle_login_response(response, password, session_keys, server_info['public_key']);
            };

            var login_info = {
                'username': username,
                'authkey': authkey,
                'device_time': new Date().toISOString(),
                'device_fingerprint': device.get_device_fingerprint(),
                'device_description': device.get_device_description()
            };

            if (send_plain) {
                login_info['password'] = password;
            }

            login_info = JSON.stringify(login_info);

            // encrypt the login infos
            var login_info_enc = cryptoLibrary.encrypt_data_public_key(
                login_info,
                server_info['public_key'],
                session_keys.private_key
            );


            var session_duration = 24*60*60;
            if (trust_device) {
                session_duration = 24*60*60*30;
            }

            return apiClient.login(login_info_enc['text'], login_info_enc['nonce'], session_keys.public_key, session_duration)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#saml_initiate_login
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Ajax POST request to the backend to initiate the saml login request
         *
         * @param {object} provider The provider config
         * @param {boolean|undefined} remember Remember the username and server
         * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
         * @param {object} server The server object to send the login request to
         * @param {object} server_info Some info about the server including its public key
         * @param {object} verify_key The signature of the server
         *
         * @returns {promise} Returns a promise with the login status
         */
        var saml_initiate_login = function(provider, remember, trust_device, server, server_info, verify_key) {

            managerBase.delete_local_data();

            if (remember) {
                storage.upsert('persistent', {key: 'server', value: server});
            } else {
                if (storage.key_exists('persistent', 'username')) {
                    storage.remove('persistent', storage.find_key('persistent', 'username'));
                }
                if (storage.key_exists('persistent', 'server')) {
                    storage.remove('persistent', storage.find_key('persistent', 'server'));
                }
                storage.save();
            }
            storage.upsert('persistent', {key: 'trust_device', value: trust_device});

            if (!server_info.hasOwnProperty('allowed_second_factors')) {
                server_info['allowed_second_factors'] = ['yubikey_otp', 'google_authenticator', 'duo'];
            }

            if (!server_info.hasOwnProperty('allow_user_search_by_email')) {
                server_info['allow_user_search_by_email'] = false;
            }

            storage.upsert('config', {key: 'server_info', value: server_info});
            storage.upsert('config', {key: 'server_verify_key', value: verify_key});
            // TODO
            //storage.upsert('config', {key: 'user_username', value: username});
            storage.upsert('config', {key: 'server', value: server});
            storage.save();

            var onError = function(response){

                // in case of any error we remove the items we already added to our storage
                // maybe we adjust this behaviour at some time
                storage.remove('config', storage.find_key('config', 'server'));
                storage.save();

                return $q.reject({
                    response:"error",
                    error_data: response.data
                });
            };

            var onSuccess = function (response) {
                return browserClient.launch_web_auth_flow(response.data.saml_redirect_url);
            };

            var return_to_url = browserClient.get_saml_return_to_url();

            return apiClient.saml_initiate_login(provider['provider_id'], return_to_url)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#saml_login
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * The second step in the login process of the SAML login after the initialization and all the redirect juju
         * of SAML
         *
         * @param {string} saml_token_id The id of the saml token
         *
         * @returns {promise} Returns a promise with the login status
         */
        var saml_login = function(saml_token_id) {

            var login_info = {
                'saml_token_id': saml_token_id,
                'device_time': new Date().toISOString(),
                'device_fingerprint': device.get_device_fingerprint(),
                'device_description': device.get_device_description()
            };

            var server_info = storage.find_key('config', 'server_info').value;

            login_info = JSON.stringify(login_info);

            session_keys = cryptoLibrary.generate_public_private_keypair();

            // encrypt the login infos
            var login_info_enc = cryptoLibrary.encrypt_data_public_key(
                login_info,
                server_info['public_key'],
                session_keys.private_key
            );

            var onError = function(response){
                return $q.reject(response.data);
            };

            var onSuccess = function (response) {
                var login_info_decrypted_json = cryptoLibrary.decrypt_data_public_key(response.data['login_info'], response.data['login_info_nonce'], server_info['public_key'], session_keys.private_key);
                var login_info_decrypted = JSON.parse(login_info_decrypted_json);
                var login_data_decrypted_json = cryptoLibrary.decrypt_data_public_key(login_info_decrypted['data'], login_info_decrypted['data_nonce'], login_info_decrypted['server_session_public_key'], session_keys.private_key);
                var login_data_decrypted = JSON.parse(login_data_decrypted_json);

                storage.upsert('config', {key: 'user_username', value: login_data_decrypted.user.username});
                storage.upsert('config', {key: 'user_has_two_factor', value: login_data_decrypted['required_multifactors'].length > 0});
                token = login_data_decrypted.token;
                session_secret_key = login_data_decrypted.session_secret_key;
                user_sauce = login_data_decrypted.user.user_sauce;
                user_public_key = login_data_decrypted.user.public_key;
                session_password = login_data_decrypted.password;

                // decrypt user private key
                user_private_key = cryptoLibrary.decrypt_secret(
                    login_data_decrypted.user.private_key,
                    login_data_decrypted.user.private_key_nonce,
                    login_data_decrypted.password,
                    user_sauce
                );

                // decrypt the user_validator
                var user_validator = cryptoLibrary.decrypt_data_public_key(
                    login_data_decrypted.user_validator,
                    login_data_decrypted.user_validator_nonce,
                    login_info_decrypted['server_session_public_key'],
                    user_private_key
                );

                // encrypt the validator as verification
                verification = cryptoLibrary.encrypt_data(
                    user_validator,
                    session_secret_key
                );

                required_multifactors = login_data_decrypted['required_multifactors'];

                return required_multifactors;
            };

            var session_duration = 24*60*60;

            return apiClient.saml_login(login_info_enc['text'], login_info_enc['nonce'], session_keys.public_key, session_duration)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#logout
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Ajax POST request to destroy the token and logout the user
         *
         * @returns {promise} Returns a promise with the logout status
         */
        var logout = function () {

            Raven.setUserContext();

            var onSuccess = function () {

                managerBase.delete_local_data();
                browserClient.emit("logout", null);

                return {
                    response:"success"
                };
            };

            var onError = function(){
                //session expired, so lets delete the data anyway

                managerBase.delete_local_data();
                browserClient.emit("logout", null);

                return {
                    response:"success"
                };
            };

            if (managerBase.get_token() === null) {
                return $q(function(resolve) {
                    return resolve(onSuccess());
                });
            }

            return apiClient.logout(managerBase.get_token(), managerBase.get_session_secret_key())
                .then(onSuccess, onError);
        };

        $rootScope.$on('force_logout', function() {
            managerBase.delete_local_data();
            browserClient.emit("logout", null);
        });

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#update_user
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Update user base settings
         *
         * @param {email} email The email of the user
         * @param {string} authkey The new authkey of the user
         * @param {string} authkey_old The old authkey of the user
         * @param {string} private_key The encrypted private key of the user (hex format)
         * @param {string} private_key_nonce The nonce of the private key (hex format)
         * @param {string} secret_key The encrypted secret key of the user (hex format)
         * @param {string} secret_key_nonce The nonce of the secret key (hex format)
         *
         * @returns {promise} Returns a promise with the update status
         */
        var update_user = function(email, authkey, authkey_old, private_key, private_key_nonce, secret_key,
                                  secret_key_nonce) {
            return apiClient.update_user(managerBase.get_token(), managerBase.get_session_secret_key(), email, authkey,
                authkey_old, private_key, private_key_nonce, secret_key, secret_key_nonce);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#recovery_generate_information
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Encrypts the recovery data and sends it to the server.
         *
         * @returns {promise} Returns a promise with the username, recovery_code_id and private_key to decrypt the saved data
         */
        var recovery_generate_information = function() {



            var recovery_password = cryptoLibrary.generate_recovery_code();
            var recovery_authkey = cryptoLibrary.generate_authkey(managerBase.find_key_nolimit('config', 'user_username'), recovery_password['base58']);
            var recovery_sauce = cryptoLibrary.generate_user_sauce();

            var recovery_data_dec = {
                'user_private_key': managerBase.find_key_nolimit('config', 'user_private_key'),
                'user_secret_key': managerBase.find_key_nolimit('config', 'user_secret_key')
            };

            var recovery_data = cryptoLibrary.encrypt_secret(JSON.stringify(recovery_data_dec), recovery_password['base58'], recovery_sauce);

            var onSuccess = function(data) {
                return {
                    'username': managerBase.find_key('config', 'user_username'),
                    'recovery_password': helper.split_string_in_chunks(recovery_password['base58_checksums'], 13).join('-'),
                    'recovery_words': recovery_password['words'].join(' ')
                };
            };

            return apiClient.write_recoverycode(managerBase.get_token(), managerBase.get_session_secret_key(),
                recovery_authkey, recovery_data.text, recovery_data.nonce, recovery_sauce)
                .then(onSuccess);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#recovery_enable
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Ajax POST request to destroy the token and recovery_enable the user
         *
         * @param {string} username The username of the user
         * @param {string} recovery_code The recovery code in base58 format
         * @param {string} server The server to send the recovery code to
         *
         * @returns {promise} Returns a promise with the recovery_enable status
         */
        var recovery_enable = function (username, recovery_code, server) {

            storage.upsert('config', {key: 'user_username', value: username});
            storage.upsert('config', {key: 'server', value: server});

            var onSuccess = function (data) {

                var recovery_data = JSON.parse(cryptoLibrary.decrypt_secret(data.data.recovery_data, data.data.recovery_data_nonce, recovery_code, data.data.recovery_sauce));

                return {
                    'user_private_key': recovery_data.user_private_key,
                    'user_secret_key': recovery_data.user_secret_key,
                    'user_sauce': data.data.user_sauce,
                    'verifier_public_key': data.data.verifier_public_key,
                    'verifier_time_valid': data.data.verifier_time_valid
                }
            };
            var recovery_authkey = cryptoLibrary.generate_authkey(username, recovery_code);

            return apiClient.enable_recoverycode(username, recovery_authkey)
                .then(onSuccess);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#arm_emergency_code
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Ajax POST request to activate the emergency code
         *
         * @param {string} username The username of the user
         * @param {string} emergency_code The emergency code in base58 format
         * @param {string} server The server to send the recovery code to
         * @param {object} server_info Some info about the server including its public key
         * @param {object} verify_key The signature of the server
         *
         * @returns {promise} Returns a promise with the emergency code activation status
         */
        var arm_emergency_code = function (username, emergency_code, server, server_info, verify_key) {

            storage.upsert('config', {key: 'user_username', value: username});
            storage.upsert('config', {key: 'server', value: server});

            var emergency_authkey = cryptoLibrary.generate_authkey(username, emergency_code);

            var onSuccess = function (data) {

                if (data.data.status === 'started' || data.data.status === 'waiting') {
                    return data.data
                }

                var emergency_data = JSON.parse(cryptoLibrary.decrypt_secret(data.data.emergency_data, data.data.emergency_data_nonce, emergency_code, data.data.emergency_sauce));

                storage.upsert('config', {key: 'user_private_key', value: emergency_data.user_private_key});
                storage.upsert('config', {key: 'user_secret_key', value: emergency_data.user_secret_key});
                storage.upsert('config', {key: 'user_sauce', value: data.data.user_sauce});

                var session_key = cryptoLibrary.generate_public_private_keypair();

                var login_info = JSON.stringify({
                    'device_time': new Date().toISOString(),
                    'device_fingerprint': device.get_device_fingerprint(),
                    'device_description': device.get_device_description(),
                    'session_public_key': session_key.public_key

                });

                var update_request_enc = cryptoLibrary.encrypt_data_public_key(login_info, data.data.verifier_public_key, emergency_data.user_private_key);

                var onSuccess = function (data) {

                    var login_info = JSON.parse(cryptoLibrary.decrypt_data_public_key(data.data.login_info, data.data.login_info_nonce, server_info['public_key'], session_key.private_key));

                    storage.upsert('config', {key: 'server_info', value: server_info});
                    storage.upsert('config', {key: 'server_verify_key', value: verify_key});
                    storage.upsert('config', {key: 'user_id', value: login_info.user_id});
                    storage.upsert('config', {key: 'user_token', value: login_info.token});
                    storage.upsert('config', {key: 'user_email', value: login_info.user_email});
                    storage.upsert('config', {key: 'session_secret_key', value: login_info.session_secret_key});
                    storage.upsert('config', {key: 'user_public_key', value: login_info.user_public_key});

                    storage.save();

                    return {
                        'status': 'active'
                    };
                };

                var onError = function(data){
                    return $q.reject(data);
                };

                return apiClient.activate_emergency_code(username, emergency_authkey, update_request_enc.text, update_request_enc.nonce)
                    .then(onSuccess, onError);
            };

            return apiClient.arm_emergency_code(username, emergency_authkey)
                .then(onSuccess);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#set_password
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Encrypts the recovered data with the new password and initiates the save of this data
         *
         * @param {string} username the account's username e.g dummy@example.com
         * @param {string} recovery_code The recovery code in base58 format
         * @param {string} password The new password
         * @param {string} user_private_key The user's private key
         * @param {string} user_secret_key The user's secret key
         * @param {string} user_sauce The user's user_sauce
         * @param {string} verifier_public_key The "verifier" one needs, that the server accepts this new password
         *
         * @returns {promise} Returns a promise with the set_password status
         */
        var set_password = function (username, recovery_code, password, user_private_key, user_secret_key, user_sauce, verifier_public_key) {

            var priv_key_enc = cryptoLibrary.encrypt_secret(user_private_key, password, user_sauce);
            var secret_key_enc = cryptoLibrary
                .encrypt_secret(user_secret_key, password, user_sauce);

            var update_request = JSON.stringify({
                authkey: cryptoLibrary.generate_authkey(username, password),
                private_key: priv_key_enc.text,
                private_key_nonce: priv_key_enc.nonce,
                secret_key: secret_key_enc.text,
                secret_key_nonce: secret_key_enc.nonce
            });

            var update_request_enc = cryptoLibrary.encrypt_data_public_key(update_request, verifier_public_key, user_private_key);

            var onSuccess = function (data) {
                return data;
            };

            var onError = function(data){
                return data;
            };

            var recovery_authkey = cryptoLibrary.generate_authkey(username, recovery_code);

            return apiClient.set_password(username, recovery_authkey, update_request_enc.text, update_request_enc.nonce)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastorePassword#update_paths
         * @methodOf psonocli.managerDatastorePassword
         *
         * @description
         * Sets the "path" attribute for all folders and items
         *
         * @param datastore
         * @param parent_path
         */
        var update_paths_recursive = function(datastore, parent_path) {
            return managerDatastore.update_paths_recursive(datastore, parent_path);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#get_user_datastore
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Returns the user datastore. In addition this function triggers the generation of the local datastore
         * storage to
         *
         * @returns {promise} Returns a promise with the user datastore
         */
        var get_user_datastore = function() {
            var type = "user";
            var description = "default";

            var onSuccess = function (datastore) {
                /*
                 _fill_storage('datastore-user-leafs', result, [
                 ['key', 'secret_id'],
                 ['value', 'secret_key'],
                 ['name', 'name'],
                 ['filter', 'filter']
                 ]);
                 */
                managerDatastore.update_share_rights_of_folders_and_items(datastore, {
                    'read': true,
                    'write': true,
                    'grant': true,
                    'delete': true
                });
                update_paths_recursive(datastore, []);

                return datastore
            };
            var onError = function () {
                // pass
            };

            return managerDatastore.get_datastore(type)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#search_user_datastore
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * searches the user datastore for a user, based on the id or email
         *
         * @param {uuid|undefined} [user_id] (optional) user_id to search for
         * @param {email|undefined} [email] (optional) email to search for
         * @returns {promise} Returns a promise with the user
         */
        var search_user_datastore = function(user_id, email) {

            var onSuccess = function (user_data_store) {

                var users = [];
                var id_match = null;
                var email_match = null;

                helper.create_list(user_data_store, users);

                for (var i = users.length - 1; i >= 0; i--) {

                    if (users[i].data.user_id === user_id) {
                        id_match = users[i];
                    }
                    if (users[i].data.user_email === email) {
                        email_match = users[i];
                    }
                }

                if (id_match === null && email_match === null) {
                    // no match found
                    return null;
                } else if (id_match !== null && email_match !== null && id_match.id === email_match.id) {
                    // id match and email match is the same user
                    return id_match;
                } else if (id_match !== null) {
                    // only id_match is set
                    return id_match
                } else if (email_match !== null) {
                    // only email_match is set
                    return email_match;
                } else {
                    // no match found, or id and email match are different
                    return null
                }

            };
            var onError = function () {
                // pass
            };

            return get_user_datastore()
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#save_datastore_content
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Saves the user datastore with given content
         *
         * @param {TreeObject} content The real object you want to encrypt in the datastore
         * @param {Array} paths The list of paths to the changed elements
         * @returns {promise} Promise with the status of the save
         */
        var save_datastore_content = function (content, paths) {
            var type = "user";
            var description = "default";

            content = managerBase.filter_datastore_content(content);

            return managerDatastore.save_datastore_content(type, description, content)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#search_user
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * searches a user in the database according to his username
         *
         * @param {string} username (optional) The username to search
         * @param {string} email (optional) The email to search
         * @returns {promise} Returns a promise with the user information
         */
        var search_user = function(username, email) {

            return apiClient.search_user(managerBase.get_token(), managerBase.get_session_secret_key(), undefined, username, email);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#create_ga
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * creates a google authenticator
         *
         * @param {string} title The title of the Google Authenticator
         *
         * @returns {promise} Returns a promise with the user information
         */
        var create_ga = function(title) {

            var onSuccess = function (request) {

                var server = storage.find_key('config', 'server');
                var backend = server['value']['url'];
                var parsed_url = helper.parse_url(backend);

                return {
                    'id': request.data['id'],
                    'uri': 'otpauth://totp/' + parsed_url['top_domain'] + ':' + managerBase.find_key_nolimit('config', 'user_username')+'?secret=' + request.data['secret']
                };

            };
            var onError = function () {
                // pass
            };
            return apiClient.create_ga(managerBase.get_token(), managerBase.get_session_secret_key(), title)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#read_ga
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Gets a list of all active google authenticators
         *
         * @returns {promise} Returns a promise with a list of all google authenticators
         */
        var read_ga = function() {


            var onSuccess = function (request) {

                return request.data['google_authenticators'];

            };
            var onError = function () {
                // pass
            };
            return apiClient.read_ga(managerBase.get_token(), managerBase.get_session_secret_key())
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#activate_ga
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Activates a given Google authenticator
         *
         * @param {uuid} google_authenticator_id The google authenticator ID
         * @param {string} google_authenticator_token One google authenticator code
         *
         * @returns {promise} Returns a promise with true or false
         */
        var activate_ga = function(google_authenticator_id, google_authenticator_token) {
            var onSuccess = function () {
                storage.upsert('config', {key: 'user_has_two_factor', value: true});
                emit('two_fa_activate', true);
                return true;
            };
            var onError = function () {
                return false;
            };
            return apiClient.activate_ga(managerBase.get_token(), managerBase.get_session_secret_key(), google_authenticator_id, google_authenticator_token)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#delete_ga
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Deletes a given Google authenticator
         *
         * @param {string} ga_id The google authenticator ID
         *
         * @returns {promise} Returns a promise with true or false
         */
        var delete_ga = function(ga_id) {
            var onSuccess = function () {
                return true;
            };
            var onError = function (data) {
                return $q.reject(data.data)
            };
            return apiClient.delete_ga(managerBase.get_token(), managerBase.get_session_secret_key(), ga_id)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#create_duo
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * creates a duo
         *
         * @param {boolean} use_system_wide_duo Wether to use the system wide duo or not
         * @param {string} title The title of the duo
         * @param {string} integration_key The integration_key of the duo
         * @param {string} secret_key The secret_key of the duo
         * @param {string} host The host of the duo
         *
         * @returns {promise} Returns a promise with the user information
         */
        var create_duo = function(use_system_wide_duo, title, integration_key, secret_key, host) {

            var onSuccess = function (request) {

                return {
                    'id': request.data['id'],
                    'uri': request.data['activation_code']
                };

            };
            var onError = function (request) {
                return $q.reject(request.data);
            };

            return apiClient.create_duo(managerBase.get_token(), managerBase.get_session_secret_key(), use_system_wide_duo, title, integration_key, secret_key, host)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#read_duo
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Gets a list of all active duos
         *
         * @returns {promise} Returns a promise with a list of all duos
         */
        var read_duo = function() {


            var onSuccess = function (request) {

                return request.data['duos'];

            };
            var onError = function () {
                // pass
            };
            return apiClient.read_duo(managerBase.get_token(), managerBase.get_session_secret_key())
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#activate_duo
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Activates a given Google authenticator
         *
         * @param {uuid} duo_id The duo ID
         * @param {string} [duo_token] (optional) One Duo token
         *
         * @returns {promise} Returns a promise with true or false
         */
        var activate_duo = function(duo_id, duo_token) {
            var onSuccess = function () {
                storage.upsert('config', {key: 'user_has_two_factor', value: true});
                emit('two_fa_activate', true);
                return true;
            };
            var onError = function () {
                return false;
            };
            return apiClient.activate_duo(managerBase.get_token(), managerBase.get_session_secret_key(), duo_id, duo_token)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#delete_duo
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Deletes a given Google authenticator
         *
         * @param {string} duo_id The duo ID
         *
         * @returns {promise} Returns a promise with true or false
         */
        var delete_duo = function(duo_id) {
            var onSuccess = function () {
                return true;
            };
            var onError = function (data) {
                return $q.reject(data.data)
            };
            return apiClient.delete_duo(managerBase.get_token(), managerBase.get_session_secret_key(), duo_id)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#create_yubikey_otp
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * creates a yubikey otp
         *
         * @param {string} title The title of the YubiKey OTP
         * @param {string} otp One YubikeKey OTP Code
         *
         * @returns {promise} Returns a promise with the user information
         */
        var create_yubikey_otp = function(title, otp) {

            var onSuccess = function (request) {
                storage.upsert('config', {key: 'user_has_two_factor', value: true});
                storage.save();
                emit('two_fa_activate', true);
                return {
                    'id': request.data['id']
                };

            };
            var onError = function () {
                // pass
            };
            return apiClient.create_yubikey_otp(managerBase.get_token(), managerBase.get_session_secret_key(), title, otp)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#read_yubikey_otp
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Gets a list of all active yubikey otps
         *
         * @returns {promise} Returns a promise with a list of all yubikey otps
         */
        var read_yubikey_otp = function() {

            var onSuccess = function (request) {

                return request.data['yubikey_otps'];

            };
            var onError = function () {
                // pass
            };
            return apiClient.read_yubikey_otp(managerBase.get_token(), managerBase.get_session_secret_key())
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#activate_yubikey_otp
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Activates a given YubiKey OTP
         *
         * @param {uuid} yubikey_id Yubikey ID
         * @param {string} yubikey_otp One YubiKey COde
         *
         * @returns {promise} Returns a promise with true or false
         */
        var activate_yubikey_otp = function(yubikey_id, yubikey_otp) {
            var onSuccess = function () {
                storage.upsert('config', {key: 'user_has_two_factor', value: true});
                emit('two_fa_activate', true);
                return true;
            };
            var onError = function () {
                return false;
            };
            return apiClient.activate_yubikey_otp(managerBase.get_token(), managerBase.get_session_secret_key(), yubikey_id, yubikey_otp)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#delete_yubikey_otp
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Deletes a given YubiKey OTP
         *
         * @param {string} yubikey_otp_id Yubikey OTP ID
         *
         * @returns {promise} Returns a promise with true or false
         */
        var delete_yubikey_otp = function(yubikey_otp_id) {
            var onSuccess = function () {
                return true;
            };
            var onError = function (data) {
                return $q.reject(data.data)
            };
            return apiClient.delete_yubikey_otp(managerBase.get_token(), managerBase.get_session_secret_key(), yubikey_otp_id)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#get_sessions
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * loads the sessions
         *
         * @returns {promise} Returns a promise with the sessions
         */
        var get_sessions = function() {

            var onSuccess = function (request) {
                return request.data['sessions'];

            };
            var onError = function () {
                // pass
            };
            return apiClient.get_sessions(managerBase.get_token(), managerBase.get_session_secret_key())
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#read_emergency_codes
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Returns a list of configured emergency codes
         *
         * @returns {promise} Returns a promise with the emergency codes
         */
        var read_emergency_codes = function() {

            var onSuccess = function (request) {
                return request.data['emegency_codes'];

            };
            var onError = function () {
                // pass
            };
            return apiClient.read_emergency_codes(managerBase.get_token(), managerBase.get_session_secret_key())
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#create_emergency_code
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Creates the emergency code. Will
         *
         * @param {string} title The title of the emergency code
         * @param {string} lead_time The lead time till someone can activate this code in seconds
         *
         * @returns {promise} Returns a promise with the emergency code
         */
        var create_emergency_code = function(title, lead_time) {

            var emergency_password = cryptoLibrary.generate_recovery_code();
            var emergency_authkey = cryptoLibrary.generate_authkey(managerBase.find_key_nolimit('config', 'user_username'), emergency_password['base58']);
            var emergency_sauce = cryptoLibrary.generate_user_sauce();

            var emergency_data_dec = {
                'user_private_key': managerBase.find_key_nolimit('config', 'user_private_key'),
                'user_secret_key': managerBase.find_key_nolimit('config', 'user_secret_key')
            };

            var emergency_data = cryptoLibrary.encrypt_secret(JSON.stringify(emergency_data_dec), emergency_password['base58'], emergency_sauce);

            var onSuccess = function (request) {
                return {
                    'username': managerBase.find_key('config', 'user_username'),
                    'emergency_password': helper.split_string_in_chunks(emergency_password['base58_checksums'], 13).join('-'),
                    'emergency_words': emergency_password['words'].join(' ')
                };

            };
            var onError = function (request) {
                return $q.reject(request.data);
            };
            return apiClient.create_emergency_code(managerBase.get_token(), managerBase.get_session_secret_key(), title,
                lead_time, emergency_authkey, emergency_data.text, emergency_data.nonce, emergency_sauce)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#delete_emergency_code
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Deletes an emergency code
         *
         * @param {string} emergency_code_id The id of the emergency code to delete
         *
         * @returns {promise} Returns a promise with true or false
         */
        var delete_emergency_code = function(emergency_code_id) {

            var onSuccess = function (request) {
                // pass
            };
            var onError = function () {
                // pass
            };
            return apiClient.delete_emergency_code(managerBase.get_token(), managerBase.get_session_secret_key(), emergency_code_id)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#get_email
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Returns the user email address
         *
         * @returns {string|null} Returns the users email address or null
         */
        var get_email = function() {
            return storage.find_key('config', 'user_email').value;
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#delete_session
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Deletes an sessions
         *
         * @param {string} session_id The id of the session to delete
         *
         * @returns {promise} Returns a promise with true or false
         */
        var delete_session = function(session_id) {

            var onSuccess = function (request) {
                // pass
            };
            var onError = function () {
                // pass
            };
            return apiClient.logout(managerBase.get_token(), managerBase.get_session_secret_key(), session_id)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#delete_other_sessions
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Deletes all sessions besides the current one
         *
         * @returns {promise} Returns a promise with the sessions
         */
        var delete_other_sessions = function() {

            var onSuccess = function (request) {

                var sessions = request.data['sessions'];

                for (var i = 0; i < sessions.length; i++) {
                    var session = sessions[i];
                    if (session.current_session) {
                        continue;
                    }
                    delete_session(session.id);
                }

            };
            var onError = function () {
                // pass
            };
            return apiClient.get_sessions(managerBase.get_token(), managerBase.get_session_secret_key())
                .then(onSuccess, onError)
        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#save_new_email
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Saves a new email
         *
         * @param {string} new_email The new email
         * @param {string} verification_password The password for verification
         *
         * @returns {promise} Returns a promise with the result
         */
        var save_new_email = function(new_email, verification_password) {

            if (verification_password === null || verification_password.length === 0) {
                return $q.reject({errors: ['OLD_PASSWORD_REQUIRED']})
            }

            var authkey_old = cryptoLibrary.generate_authkey(storage.find_key('config', 'user_username').value, verification_password);

            var onSuccess = function(data) {

                storage.upsert('config', {key: 'user_email', value: new_email});
                storage.save();
                return {msgs: ['SAVE_SUCCESS']}
            };
            var onError = function() {
                return $q.reject({errors: ['OLD_PASSWORD_INCORRECT']})
            };
            return update_user(new_email, null, authkey_old)
                .then(onSuccess, onError);

        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#save_new_password
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Saves a new password
         *
         * @param {string} new_password The new password
         * @param {string} new_password_repeat The new password (repeated)
         * @param {string} old_password The old password
         *
         * @returns {promise} Returns a promise with the result
         */
        var save_new_password = function(new_password, new_password_repeat, old_password) {

            var authkey_old, new_authkey, user_private_key, user_secret_key, user_sauce, priv_key_enc, secret_key_enc, onSuccess, onError;

            var test_error = helper.is_valid_password(new_password, new_password_repeat);
            if (test_error) {
                return $q.reject({errors: [test_error]})
            }

            if (old_password === null || old_password.length === 0) {
                return $q.reject({errors: ['OLD_PASSWORD_REQUIRED']})
            }

            authkey_old = cryptoLibrary.generate_authkey(storage.find_key('config', 'user_username').value, old_password);

            new_authkey = cryptoLibrary.generate_authkey(storage.find_key('config', 'user_username').value, new_password);
            user_private_key = storage.find_key('config', 'user_private_key');
            user_secret_key = storage.find_key('config', 'user_secret_key');
            user_sauce = storage.find_key('config', 'user_sauce').value;

            priv_key_enc = cryptoLibrary.encrypt_secret(user_private_key.value, new_password, user_sauce);
            secret_key_enc = cryptoLibrary.encrypt_secret(user_secret_key.value, new_password, user_sauce);

            onSuccess = function(data) {
                return {msgs: ['SAVE_SUCCESS']}
            };
            onError = function() {
                return $q.reject({errors: ['OLD_PASSWORD_INCORRECT']})
            };

            return update_user(null, new_authkey, authkey_old, priv_key_enc.text, priv_key_enc.nonce, secret_key_enc.text, secret_key_enc.nonce)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#delete_account
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Deletes an account
         *
         * @param {string} password The old password
         *
         * @returns {promise} Returns a promise with the result
         */
        var delete_account = function(password) {

            var authkey = cryptoLibrary.generate_authkey(storage.find_key('config', 'user_username').value, password);

            var onSuccess = function () {
                logout();
            };

            var onError = function(data){
                return $q.reject(data.data);
            };


            return apiClient.delete_account(managerBase.get_token(), managerBase.get_session_secret_key(), authkey).then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#select_users
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Allows the to select a known user (and add a new user to the trusted user list)
         *
         * @returns {promise} Returns a promise with the selected user
         */
        var select_users = function() {

            var deferred = $q.defer();

            var modalInstance = $uibModal.open({
                templateUrl: 'view/modal/select-user.html',
                controller: 'ModalSelectUserCtrl',
                size: 'lg',
                backdrop: 'static',
                resolve: {
                }
            });

            modalInstance.result.then(function (data) {
                // Someone selected a user
                deferred.resolve(data);
            }, function () {
                // cancel triggered
                deferred.resolve();
            });

            return deferred.promise;
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#system_wide_duo_exists
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Returns weather a system wide duo exists or not
         *
         * @returns Returns weather a system wide duo exists or not
         */
        var system_wide_duo_exists = function() {

            var system_wide_duo_exists = false;
            if (storage.find_key('config', 'server_info').value.hasOwnProperty('system_wide_duo_exists')) {
                system_wide_duo_exists = storage.find_key('config', 'server_info').value['system_wide_duo_exists'];
            }

            return system_wide_duo_exists;
        };

        shareBlueprint.register('search_user', search_user);

        return {
            on: on,
            register: register,
            activate_code: activate_code,
            get_default: get_default,
            login: login,
            saml_initiate_login: saml_initiate_login,
            saml_login: saml_login,
            ga_verify: ga_verify,
            duo_verify: duo_verify,
            yubikey_otp_verify: yubikey_otp_verify,
            activate_token: activate_token,
            logout: logout,
            recovery_enable: recovery_enable,
            arm_emergency_code: arm_emergency_code,
            set_password: set_password,
            is_logged_in: is_logged_in,
            require_two_fa_setup: require_two_fa_setup,
            update_user: update_user,
            recovery_generate_information: recovery_generate_information,
            get_user_datastore: get_user_datastore,
            search_user_datastore: search_user_datastore,
            save_datastore_content: save_datastore_content,
            search_user: search_user,
            create_ga: create_ga,
            read_ga: read_ga,
            activate_ga: activate_ga,
            delete_ga: delete_ga,
            create_duo: create_duo,
            read_duo: read_duo,
            activate_duo: activate_duo,
            delete_duo: delete_duo,
            create_yubikey_otp: create_yubikey_otp,
            read_yubikey_otp: read_yubikey_otp,
            activate_yubikey_otp: activate_yubikey_otp,
            delete_yubikey_otp: delete_yubikey_otp,
            get_sessions: get_sessions,
            read_emergency_codes : read_emergency_codes,
            create_emergency_code : create_emergency_code,
            delete_emergency_code : delete_emergency_code,
            get_email: get_email,
            delete_session: delete_session,
            delete_other_sessions: delete_other_sessions,
            save_new_email: save_new_email,
            save_new_password: save_new_password,
            delete_account: delete_account,
            select_users: select_users,
            system_wide_duo_exists: system_wide_duo_exists,
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerDatastoreUser", ['$q', '$rootScope', '$uibModal', '$location', '$window', 'apiClient',
        'browserClient', 'storage', 'helper', 'device', 'managerBase', 'managerDatastore', 'shareBlueprint',
        'itemBlueprint', 'cryptoLibrary', managerDatastoreUser]);

}(angular, Raven));