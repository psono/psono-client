(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerDatastoreUser
     * @requires $q
     * @requires $rootScope
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

    var managerDatastoreUser = function($q, $rootScope, apiClient, browserClient, storage,
                                        helper, managerBase, managerDatastore, shareBlueprint,
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

                storage.insert('config', {key: 'user_email', value: email});
                storage.insert('config', {key: 'user_username', value: username});
                storage.insert('config', {key: 'server', value: server});

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

                    storage.remove('config', storage.find_one('config', {'key': 'user_email'}));
                    storage.remove('config', storage.find_one('config', {'key': 'server'}));
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

                storage.remove('config', storage.find_one('config', {'key': 'server'}));
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
                storage.remove('config', storage.find_one('config', {'key': 'user_username'}));
                storage.remove('config', storage.find_one('config', {'key': 'server'}));

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

                return {
                    response:"success"
                };

            };

            return apiClient.activate_token(token, verification.text, verification.nonce)
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

            return apiClient.ga_verify(token, ga_token)
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
                helper.remove_from_array(required_multifactors, 'google_authenticator_2fa');
                return required_multifactors;
            };

            return apiClient.yubikey_otp_verify(token, yubikey_otp)
                .then(onSuccess, onError);
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
         * @param {string} password The password to login with
         * @param {object} server The server object to send the login request to
         *
         * @returns {promise} Returns a promise with the login status
         */
        var login = function(username, password, server) {

            managerBase.delete_local_data();

            var authkey = cryptoLibrary.generate_authkey(username, password);

            storage.insert('config', {key: 'user_username', value: username});
            storage.insert('config', {key: 'server', value: server});

            session_keys = cryptoLibrary.generate_public_private_keypair();

            var onError = function(response){

                // in case of any error we remove the items we already added to our storage
                // maybe we adjust this behaviour at some time
                storage.remove('config', storage.find_one('config', {'key': 'user_username'}));
                storage.remove('config', storage.find_one('config', {'key': 'server'}));
                storage.save();

                return $q.reject({
                    response:"error",
                    error_data: response.data
                });
            };

            var onSuccess = function (response) {

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

            return apiClient.login(username, authkey, session_keys.public_key, helper.get_device_fingerprint(), helper.get_device_description())
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

            var onSuccess = function () {

                managerBase.delete_local_data();
                browserClient.emit("logout", null);
                browserClient.resize(250);

                return {
                    response:"success"
                };
            };

            var onError = function(){
                //session expired, so lets delete the data anyway

                managerBase.delete_local_data();
                browserClient.emit("logout", null);
                browserClient.resize(250);

                return {
                    response:"success"
                };
            };

            if (managerBase.get_token() === null) {
                return $q(function(resolve) {
                    return resolve(onSuccess());
                });
            }

            return apiClient.logout(managerBase.get_token())
                .then(onSuccess, onError);
        };

        $rootScope.$on('force_logout', function() {
            logout();
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
         * @param {string} user_sauce The user sauce (hex format)
         *
         * @returns {promise} Returns a promise with the update status
         */
        var update_user = function(email, authkey, authkey_old, private_key, private_key_nonce, secret_key,
                                  secret_key_nonce, user_sauce) {
            return apiClient.update_user(managerBase.get_token(), managerBase.get_session_secret_key(), email, authkey,
                authkey_old, private_key, private_key_nonce, secret_key, secret_key_nonce, user_sauce);
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
            var recovery_authkey = cryptoLibrary.generate_authkey(managerBase.find_one_nolimit('config', 'user_username'), recovery_password['base58']);
            var recovery_sauce = cryptoLibrary.generate_user_sauce();

            var recovery_data_dec = {
                'user_private_key': managerBase.find_one_nolimit('config', 'user_private_key'),
                'user_secret_key': managerBase.find_one_nolimit('config', 'user_secret_key')
            };

            var recovery_data = cryptoLibrary.encrypt_secret(JSON.stringify(recovery_data_dec), recovery_password['base58'], recovery_sauce);

            var onSuccess = function(data) {
                return {
                    'username': managerBase.find_one_nolimit('config', 'user_username'),
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


            var onSuccess = function (result) {
                /*
                 _fill_storage('datastore-user-leafs', result, [
                 ['key', 'secret_id'],
                 ['value', 'secret_key'],
                 ['name', 'name'],
                 ['filter', 'filter']
                 ]);
                 */

                return result
            };
            var onError = function () {
                // pass
            };

            return managerDatastore.get_datastore(type, description)
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
         * @param {uuid} [user_id] (optional) user_id to search for
         * @param {email} [email] (optional) email to search for
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
         * @name psonocli.managerDatastoreUser#save_datastore
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Saves the user datastore with given content
         *
         * @param {TreeObject} content The real object you want to encrypt in the datastore
         * @param {Array} paths The list of paths to the changed elements
         * @returns {promise} Promise with the status of the save
         */
        var save_datastore = function (content, paths) {
            var type = "user";
            var description = "default";

            content = managerDatastore.filter_datastore_content(content);

            return managerDatastore.save_datastore(type, description, content)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#search_user
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * searches a user in the database according to his username
         *
         * @param {string} username The username to search
         * @returns {promise} Returns a promise with the user information
         */
        var search_user = function(username) {

            return apiClient.get_users_public_key(managerBase.get_token(), managerBase.get_session_secret_key(), undefined, username);
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

                var server = storage.find_one('config', {'key': 'server'});
                var backend = server['value']['url'];
                var parsed_url = helper.parse_url(backend);

                return {
                    'id': request.data['id'],
                    'uri': 'otpauth://totp/' + parsed_url['top_domain'] + ':' + managerBase.find_one_nolimit('config', 'user_username')+'?secret=' + request.data['secret']
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
         * @name psonocli.managerDatastoreUser#delete_ga
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Deletes a given Google authenticator
         *
         * @returns {promise} Returns a promise with true or false
         */
        var delete_ga = function(ga_id) {
            var onSuccess = function () {
                return true;
            };
            var onError = function () {
                return false;
            };
            return apiClient.delete_ga(managerBase.get_token(), managerBase.get_session_secret_key(), ga_id)
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
            var onError = function () {
                return false;
            };
            return apiClient.delete_yubikey_otp(managerBase.get_token(), managerBase.get_session_secret_key(), yubikey_otp_id)
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#get_open_sessions
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * loads the open sessions
         *
         * @returns {promise} Returns a promise with the open sessions
         */
        var get_open_sessions = function() {

            var onSuccess = function (request) {

                return request.data['sessions'];

            };
            var onError = function () {
                // pass
            };
            return apiClient.get_open_sessions(managerBase.get_token(), managerBase.get_session_secret_key())
                .then(onSuccess, onError)
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreUser#delete_open_session
         * @methodOf psonocli.managerDatastoreUser
         *
         * @description
         * Deletes an open sessions
         *
         * @param {string} session_id The id of the session to delete
         *
         * @returns {promise} Returns a promise with true or false
         */
        var delete_open_session = function(session_id) {

            var onSuccess = function (request) {
                // pass
            };
            var onError = function () {
                // pass
            };
            return apiClient.logout(managerBase.get_token(), managerBase.get_session_secret_key(), session_id)
                .then(onSuccess, onError)
        };

        shareBlueprint.register('search_user', search_user);
        itemBlueprint.register('get_user_datastore', get_user_datastore);

        return {
            register: register,
            activate_code: activate_code,
            login: login,
            ga_verify: ga_verify,
            yubikey_otp_verify: yubikey_otp_verify,
            activate_token: activate_token,
            logout: logout,
            recovery_enable: recovery_enable,
            set_password: set_password,
            is_logged_in: is_logged_in,
            update_user: update_user,
            recovery_generate_information: recovery_generate_information,
            get_user_datastore: get_user_datastore,
            search_user_datastore: search_user_datastore,
            save_datastore: save_datastore,
            search_user: search_user,
            create_ga: create_ga,
            read_ga: read_ga,
            delete_ga: delete_ga,
            create_yubikey_otp: create_yubikey_otp,
            read_yubikey_otp: read_yubikey_otp,
            delete_yubikey_otp: delete_yubikey_otp,
            get_open_sessions: get_open_sessions,
            delete_open_session: delete_open_session
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerDatastoreUser", ['$q', '$rootScope', 'apiClient', 'browserClient', 'storage',
        'helper', 'managerBase', 'managerDatastore', 'shareBlueprint',
        'itemBlueprint', 'cryptoLibrary', managerDatastoreUser]);

}(angular));