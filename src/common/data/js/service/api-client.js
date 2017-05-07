(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.apiClient
     * @requires $http
     * @requires $q
     * @requires $rootScope
     * @requires psonocli.storage
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Service to talk to the psono REST api
     */

    var apiClient = function($http, $q, $rootScope, storage, cryptoLibrary) {

        var call = function(type, endpoint, data, headers, session_secret_key) {

            var server = storage.find_one('config', {'key': 'server'});

            if (server === null) {
                return $q(function(resolve, reject) {
                    return reject({
                        status: -1
                    })
                });
            }

            var backend = server['value']['url'];

            if (session_secret_key && data !== null) {
                // TODO remove the // before putting in production
                // data = cryptoLibrary.encrypt_data(JSON.stringify(data), session_secret_key);
            }

            var req = {
                method: type,
                url: backend + endpoint,
                data: data
            };

            req.headers = headers;

            return $q(function(resolve, reject) {

                var decrypt_data = function(data) {

                    if (session_secret_key && data !== null
                        && data.hasOwnProperty('data')
                        && data.data.hasOwnProperty('text')
                        && data.data.hasOwnProperty('nonce')) {
                        data.data = JSON.parse(cryptoLibrary.decrypt_data(data.data.text, data.data.nonce, session_secret_key));
                    }

                    //console.log(data);
                    return data;
                };

                var onSuccess = function(data) {
                    return resolve(decrypt_data(data));
                };

                var onError = function(data) {
                    if (data.status === 401) {
                        $rootScope.$broadcast('force_logout', '');
                    }
                    if (data.status === 503) {
                        $rootScope.$broadcast('force_logout', '');
                    }
                    return reject(decrypt_data(data));
                };

                $http(req)
                    .then(onSuccess, onError);

            });
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#login
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to the backend with email and authkey for login, saves a token together with user_id
         * and all the different keys of a user in the apidata storage
         *
         * @param {string} username the username e.g dummy@example.com
         * @param {string} authkey the authkey as scrypt(password + username + sauce)
         * @param {string} public_key session public key
         * @param {string} device_fingerprint The fingerprint of the device
         * @param {string} device_description The device description
         *
         * @returns {promise} Returns a promise with the login status
         */
        var login = function(username, authkey, public_key, device_fingerprint, device_description) {

            var endpoint = '/authentication/login/';
            var connection_type = "POST";
            var data = {
                username: username,
                authkey: authkey,
                public_key: public_key,
                device_fingerprint: device_fingerprint,
                device_description: device_description
            };
            var headers = null;

            return call(connection_type, endpoint, data, headers);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#ga_verify
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to the backend with the OATH-TOTP Token
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} ga_token The OATH-TOTP Token
         *
         * @returns {promise} Returns a promise with the verification status
         */
        var ga_verify = function(token, ga_token) {

            var endpoint = '/authentication/ga-verify/';
            var connection_type = "POST";
            var data = {
                token: token,
                ga_token: ga_token
            };
            var headers = null;

            return call(connection_type, endpoint, data, headers);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#yubikey_otp_verify
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to the backend with the YubiKey OTP Token
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} yubikey_otp The YubiKey OTP
         *
         * @returns {promise} Returns a promise with the verification status
         */
        var yubikey_otp_verify = function(token, yubikey_otp) {

            var endpoint = '/authentication/yubikey-otp-verify/';
            var connection_type = "POST";
            var data = {
                token: token,
                yubikey_otp: yubikey_otp
            };
            var headers = null;

            return call(connection_type, endpoint, data, headers);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#activate_token
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to activate the token
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} verification hex of first decrypted user_validator (from login) the re-encrypted with session key
         * @param {string} verification_nonce hex of the nonce of the verification
         *
         * @returns {promise} promise
         */
        var activate_token = function(token, verification, verification_nonce) {

            var endpoint = '/authentication/activate-token/';
            var connection_type = "POST";
            var data = {
                token: token,
                verification: verification,
                verification_nonce: verification_nonce
            };
            var headers = null;

            return call(connection_type, endpoint, data, headers);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#get_sessions
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request get all open sessions
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} promise
         */
        var get_open_sessions = function(token, session_secret_key) {

            var endpoint = '/authentication/sessions/';
            var connection_type = "GET";
            var data = null;

            var headers = {
                "Authorization": "Token "+ token
            };


            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#logout
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to destroy the token and logout the user
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} [session_id] An optional session ID to logout
         *
         * @returns {promise} Returns a promise with the logout status
         */
        var logout = function (token, session_secret_key, session_id) {
            var endpoint = '/authentication/logout/';
            var connection_type = "POST";
            var data = {
                'session_id': session_id
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#register
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to the backend with the email and authkey, returns nothing but an email is sent to the user
         * with an activation_code for the email
         *
         * @param {string} email email address of the user
         * @param {string} username username of the user (in email format)
         * @param {string} authkey authkey gets generated by generate_authkey(email, password)
         * @param {string} public_key public_key of the public/private key pair for asymmetric encryption (sharing)
         * @param {string} private_key private_key of the public/private key pair, encrypted with encrypt_secret
         * @param {string} private_key_nonce the nonce for decrypting the encrypted private_key
         * @param {string} secret_key secret_key for symmetric encryption, encrypted with encrypt_secret
         * @param {string} secret_key_nonce the nonce for decrypting the encrypted secret_key
         * @param {string} user_sauce the random user sauce used
         * @param {string} base_url the base url for the activation link creation
         *
         * @returns {promise} promise
         */
        var register = function (email, username, authkey, public_key, private_key, private_key_nonce, secret_key, secret_key_nonce, user_sauce, base_url) {
            var endpoint = '/authentication/register/';
            var connection_type = "POST";
            var data = {
                email: email,
                username: username,
                authkey: authkey,
                public_key: public_key,
                private_key: private_key,
                private_key_nonce: private_key_nonce,
                secret_key: secret_key,
                secret_key_nonce: secret_key_nonce,
                user_sauce: user_sauce,
                base_url: base_url
            };
            var headers = null;

            return call(connection_type, endpoint, data, headers);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#verify_email
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to the backend with the activation_code for the email, returns nothing. If successful the user
         * can login afterwards
         *
         * @param {string} activation_code The activation code that has been sent via email
         *
         * @returns {promise} Returns a promise with the activation status
         */
        var verify_email = function (activation_code) {
            var endpoint = '/authentication/verify-email/';
            var connection_type = "POST";
            var data = {
                activation_code: activation_code
            };
            var headers = null;

            return call(connection_type, endpoint, data, headers);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#update_user
         * @methodOf psonocli.apiClient
         *
         * @description
         * AJAX PUT request to the backend with new user informations like for example a new password (means new
         * authkey) or new public key
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} email New email address
         * @param {string} authkey The new authkey
         * @param {string} authkey_old The old authkey
         * @param {string} private_key The private key
         * @param {string} private_key_nonce The nonce for the private key
         * @param {string} secret_key The secret key
         * @param {string} secret_key_nonce The nonce for the secret key
         * @param {string} user_sauce The user's sauce
         *
         * @returns {promise} Returns a promise with the update status
         */
        var update_user = function(token, session_secret_key, email, authkey, authkey_old, private_key, private_key_nonce, secret_key, secret_key_nonce, user_sauce) {
            var endpoint = '/user/update/';
            var connection_type = "PUT";
            var data = {
                email: email,
                authkey: authkey,
                authkey_old: authkey_old,
                private_key: private_key,
                private_key_nonce: private_key_nonce,
                secret_key: secret_key,
                secret_key_nonce: secret_key_nonce,
                user_sauce: user_sauce
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#write_recoverycode
         * @methodOf psonocli.apiClient
         *
         * @description
         * AJAX PUT request to the backend with the encrypted data (private_key, and secret_key) for recovery purposes
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} recovery_authkey The recovery_authkey (derivative of the recovery_password)
         * @param {string} recovery_data The Recovery Data, an encrypted json object
         * @param {string} recovery_data_nonce The nonce used for the encryption of the data
         * @param {string} recovery_sauce The random sauce used as salt
         *
         * @returns {promise} Returns a promise with the recovery_data_id
         */
        var write_recoverycode = function(token, session_secret_key, recovery_authkey, recovery_data, recovery_data_nonce, recovery_sauce) {
            var endpoint = '/recoverycode/';
            var connection_type = "POST";
            var data = {
                recovery_authkey: recovery_authkey,
                recovery_data: recovery_data,
                recovery_data_nonce: recovery_data_nonce,
                recovery_sauce: recovery_sauce
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#enable_recoverycode
         * @methodOf psonocli.apiClient
         *
         * @description
         * AJAX POST request to the backend with the recovery_authkey to initiate the reset of the password
         *
         * @param {string} username the account's username e.g dummy@example.com
         * @param {string} recovery_authkey The recovery_authkey (derivative of the recovery_password)
         *
         * @returns {promise} Returns a promise with the recovery_data
         */
        var enable_recoverycode = function(username, recovery_authkey) {
            var endpoint = '/password/';
            var connection_type = "POST";
            var data = {
                username: username,
                recovery_authkey: recovery_authkey
            };
            var headers = null;

            return call(connection_type, endpoint, data, headers);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#set_password
         * @methodOf psonocli.apiClient
         *
         * @description
         * AJAX POST request to the backend to actually set the new encrypted private and secret key
         *
         * @param {string} username the account's username e.g dummy@example.com
         * @param {string} recovery_authkey The recovery_authkey (derivative of the recovery_password)
         * @param {string} update_data The private and secret key object encrypted with the verifier
         * @param {string} update_data_nonce The nonce of the encrypted private and secret key object
         *
         * @returns {promise} Returns a promise with the recovery_data
         */
        var set_password = function(username, recovery_authkey, update_data, update_data_nonce) {
            var endpoint = '/password/';
            var connection_type = "PUT";
            var data = {
                username: username,
                recovery_authkey: recovery_authkey,
                update_data: update_data,
                update_data_nonce: update_data_nonce
            };
            var headers = null;

            return call(connection_type, endpoint, data, headers);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_datastore
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get the current user's datastore
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} [datastore_id=null] (optional) the datastore ID
         *
         * @returns {promise} promise
         */
        var read_datastore = function (token, session_secret_key, datastore_id) {

            //optional parameter datastore_id
            if (datastore_id === undefined) { datastore_id = null; }

            var endpoint = '/datastore/' + (datastore_id === null ? '' : datastore_id + '/');
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_datastore
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to create a datatore with the token as authentication and optional already some data,
         * together with the encrypted secret key and nonce
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} type the type of the datastore
         * @param {string} description the description of the datastore
         * @param {string} [encrypted_data] (optional) data for the new datastore
         * @param {string} [encrypted_data_nonce] (optional) nonce for data, necessary if data is provided
         * @param {string} encrypted_data_secret_key encrypted secret key
         * @param {string} encrypted_data_secret_key_nonce nonce for secret key
         *
         * @returns {promise} promise
         */
        var create_datastore = function (token, session_secret_key, type, description, encrypted_data, encrypted_data_nonce, encrypted_data_secret_key, encrypted_data_secret_key_nonce) {
            var endpoint = '/datastore/';
            var connection_type = "PUT";
            var data = {
                type: type,
                description: description,
                data: encrypted_data,
                data_nonce: encrypted_data_nonce,
                secret_key: encrypted_data_secret_key,
                secret_key_nonce: encrypted_data_secret_key_nonce
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#write_datastore
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request with the token as authentication and the new datastore content
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} datastore_id the datastore ID
         * @param {string} [encrypted_data] (optional) data for the new datastore
         * @param {string} [encrypted_data_nonce] (optional) nonce for data, necessary if data is provided
         * @param {string} [encrypted_data_secret_key] (optional) encrypted secret key, wont update on the server if not provided
         * @param {string} [encrypted_data_secret_key_nonce] (optional) nonce for secret key, wont update on the server if not provided
         *
         * @returns {promise} promise
         */
        var write_datastore = function (token, session_secret_key, datastore_id, encrypted_data, encrypted_data_nonce,
                                        encrypted_data_secret_key, encrypted_data_secret_key_nonce) {
            var endpoint = '/datastore/';
            var connection_type = "POST";
            var data = {
                datastore_id: datastore_id,
                data: encrypted_data,
                data_nonce: encrypted_data_nonce,
                secret_key: encrypted_data_secret_key,
                secret_key_nonce: encrypted_data_secret_key_nonce
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_secret
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get the current user's secret
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} [secret_id=null] (optional) secret ID
         *
         * @returns {promise} promise
         */
        var read_secret = function (token, session_secret_key, secret_id) {

            //optional parameter secret_id
            if (secret_id === undefined) { secret_id = null; }

            var endpoint = '/secret/' + (secret_id === null ? '' : secret_id + '/');
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_secret
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to create a datatore with the token as authentication and optional already some data,
         * together with the encrypted secret key and nonce
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} [encrypted_data] (optional) data for the new secret
         * @param {string} [encrypted_data_nonce] (optional) nonce for data, necessary if data is provided
         * @param {string} link_id the local id of the share in the datastructure
         * @param {string} [parent_datastore_id] (optional) id of the parent datastore, may be left empty if the share resides in a share
         * @param {string} [parent_share_id] (optional) id of the parent share, may be left empty if the share resides in the datastore
         *
         * @returns {promise} Returns a promise with the new secret_id
         */
        var create_secret = function (token, session_secret_key, encrypted_data, encrypted_data_nonce, link_id, parent_datastore_id, parent_share_id) {
            var endpoint = '/secret/';
            var connection_type = "PUT";
            var data = {
                data: encrypted_data,
                data_nonce: encrypted_data_nonce,
                link_id: link_id,
                parent_datastore_id: parent_datastore_id,
                parent_share_id: parent_share_id
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#write_secret
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request with the token as authentication and the new secret content
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} secret_id the secret ID
         * @param {string} [encrypted_data] (optional) data for the new secret
         * @param {string} [encrypted_data_nonce] (optional) nonce for data, necessary if data is provided
         *
         * @returns {promise} promise
         */
        var write_secret = function (token, session_secret_key, secret_id, encrypted_data, encrypted_data_nonce) {
            var endpoint = '/secret/';
            var connection_type = "POST";
            var data = {
                secret_id: secret_id,
                data: encrypted_data,
                data_nonce: encrypted_data_nonce
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#move_secret_link
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request with the token as authentication to move a link between a secret and a datastore or a share
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} link_id the link id
         * @param {uuid} [new_parent_share_id=null] (optional) new parent share ID, necessary if no new_parent_datastore_id is provided
         * @param {uuid} [new_parent_datastore_id=null] (optional) new datastore ID, necessary if no new_parent_share_id is provided
         *
         * @returns {promise} Returns promise with the status of the move
         */
        var move_secret_link = function (token, session_secret_key, link_id, new_parent_share_id, new_parent_datastore_id) {
            var endpoint = '/secret/link/';
            var connection_type = "POST";
            var data = {
                link_id: link_id,
                new_parent_share_id: new_parent_share_id,
                new_parent_datastore_id: new_parent_datastore_id
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_secret_link
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request with the token as authentication to delete the secret link
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} link_id The link id
         *
         * @returns {promise} Returns a promise with the status of the delete operation
         */
        var delete_secret_link = function (token, session_secret_key, link_id) {
            var endpoint = '/secret/link/';
            var connection_type = "DELETE";
            var data = {
                link_id: link_id
            };
            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_share
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get the content for a single share
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} share_id the share ID
         *
         * @returns {promise} promise
         */
        var read_share = function (token, session_secret_key, share_id) {

            var endpoint = '/share/' + share_id + '/';
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_shares
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get the current user's shares
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} promise
         */
        var read_shares = function (token, session_secret_key) {

            var endpoint = '/share/';
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_share
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to create a datastore with the token as authentication and optional already some data,
         * together with the encrypted secret key and nonce
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} [encrypted_data] (optional) The data for the new share
         * @param {string} [encrypted_data_nonce] (optional) The nonce for data, necessary if data is provided
         * @param {string} key encrypted key used by the encryption
         * @param {string} key_nonce nonce for key, necessary if a key is provided
         * @param {string} [parent_share_id] (optional) The id of the parent share, may be left empty if the share resides in the datastore
         * @param {string} [parent_datastore_id] (optional) The id of the parent datastore, may be left empty if the share resides in a share
         * @param {string} link_id the local id of the share in the datastructure
         *
         * @returns {promise} Returns a promise with the status and the new share id
         */
        var create_share = function (token, session_secret_key, encrypted_data, encrypted_data_nonce, key, key_nonce, parent_share_id,
                                     parent_datastore_id, link_id) {
            var endpoint = '/share/';
            var connection_type = "POST";
            var data = {
                data: encrypted_data,
                data_nonce: encrypted_data_nonce,
                key: key,
                key_nonce: key_nonce,
                key_type: "symmetric",
                parent_share_id: parent_share_id,
                parent_datastore_id: parent_datastore_id,
                link_id: link_id
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#write_share
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request with the token as authentication and the new share content
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} share_id the share ID
         * @param {string} [encrypted_data] (optional) data for the new share
         * @param {string} [encrypted_data_nonce] (optional) nonce for data, necessary if data is provided
         *
         * @returns {promise} Returns a promise with the status of the update
         */
        var write_share = function (token, session_secret_key, share_id, encrypted_data, encrypted_data_nonce) {
            var endpoint = '/share/';
            var connection_type = "PUT";
            var data = {
                share_id: share_id,
                data: encrypted_data,
                data_nonce: encrypted_data_nonce
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_share_rights
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get the users and groups rights of the share
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} share_id the share ID
         *
         * @returns {promise} promise
         */
        var read_share_rights = function (token, session_secret_key, share_id) {
            var endpoint = '/share/rights/' + share_id + '/';
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_share_rights_overview
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get all the users share rights
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} promise
         */
        var read_share_rights_overview = function (token, session_secret_key) {
            var endpoint = '/share/right/';
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_share_right
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request with the token as authentication to create share rights for a user
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} encrypted_title the title shown to the user before he accepts
         * @param {string} encrypted_title_nonce the corresponding title nonce
         * @param {string} encrypted_type the type of the share
         * @param {string} encrypted_type_nonce the corresponding type nonce
         * @param {uuid} share_id the share ID
         * @param {uuid} user_id the target user's user ID
         * @param {string} key the encrypted share secret, encrypted with the public key of the target user
         * @param {string} key_nonce the unique nonce for decryption
         * @param {bool} read read right
         * @param {bool} write write right
         * @param {bool} grant grant right
         *
         * @returns {promise} promise
         */
        var create_share_right = function (token, session_secret_key, encrypted_title, encrypted_title_nonce, encrypted_type, encrypted_type_nonce, share_id,
                                           user_id, key, key_nonce, read, write, grant) {
            var endpoint = '/share/right/';
            var connection_type = "PUT";
            var data = {
                title: encrypted_title,
                title_nonce: encrypted_title_nonce,
                type: encrypted_type,
                type_nonce: encrypted_type_nonce,
                share_id: share_id,
                user_id: user_id,
                key: key,
                key_nonce: key_nonce,
                read: read,
                write: write,
                grant: grant
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#update_share_right
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request with the token as authentication to update the share rights for a user
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} share_id the share ID
         * @param {uuid} user_id the target user's user ID
         * @param {bool} read read right
         * @param {bool} write write right
         * @param {bool} grant grant right
         *
         * @returns {promise} promise
         */
        var update_share_right = function (token, session_secret_key, share_id,
                                           user_id, read, write, grant) {
            var endpoint = '/share/right/';
            var connection_type = "POST";
            var data = {
                share_id: share_id,
                user_id: user_id,
                read: read,
                write: write,
                grant: grant
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_share_right
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request with the token as authentication to delete the user / group share right
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} share_right_id the share right ID
         *
         * @returns {promise} promise
         */
        var delete_share_right = function (token, session_secret_key, share_right_id) {
            var endpoint = '/share/right/';
            var connection_type = "DELETE";
            var data = {
                share_right_id: share_right_id
            };
            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_share_rights_inherit_overview
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get all the users inherited share rights
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} promise
         */
        var read_share_rights_inherit_overview = function (token, session_secret_key) {
            var endpoint = '/share/right/inherit/';
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#accept_share_right
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request with the token as authentication to accept a share right and in the same run updates it
         * with the re-encrypted key
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} share_right_id The share right id
         * @param {string} key The encrypted key of the share
         * @param {string} key_nonce The nonce of the key
         * @param {uuid} link_id The link id
         * @param {uuid} parent_share_id The parent share id
         * @param {uuid} parent_datastore_id The parent datastore id
         *
         * @returns {promise} promise
         */
        var accept_share_right = function (token, session_secret_key, share_right_id, key, key_nonce, link_id, parent_share_id, parent_datastore_id) {
            var endpoint = '/share/right/accept/';
            var connection_type = "POST";
            var data = {
                share_right_id: share_right_id,
                key: key,
                key_nonce: key_nonce,
                link_id: link_id,
                parent_share_id: parent_share_id,
                parent_datastore_id: parent_datastore_id
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#decline_share_right
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request with the token as authentication to decline a share right
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} share_right_id The share right id
         *
         * @returns {promise} promise
         */
        var decline_share_right = function (token, session_secret_key, share_right_id) {
            var endpoint = '/share/right/decline/';
            var connection_type = "POST";
            var data = {
                share_right_id: share_right_id
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#get_users_public_key
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request with the token as authentication to get the public key of a user by user_id or user_email
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} [user_id] (optional) the user ID
         * @param {email} [user_username] (optional) the username
         *
         * @returns {promise} Returns a promise with the user information
         */
        var get_users_public_key = function (token, session_secret_key, user_id, user_username) {
            var endpoint = '/user/search/';
            var connection_type = "POST";
            var data = {
                user_id: user_id,
                user_username: user_username
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#create_ga
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request with the token as authentication to generate a google authenticator
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} title The title of the new GA
         *
         * @returns {promise} Returns a promise with the secret
         */
        var create_ga = function (token, session_secret_key, title) {
            var endpoint = '/user/ga/';
            var connection_type = "PUT";
            var data = {
                title: title
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_ga
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request to get a list of all registered google authenticators
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} Returns a promise with a list of all google authenticators
         */
        var read_ga = function (token, session_secret_key) {
            var endpoint = '/user/ga/';
            var connection_type = "GET";
            var data = null;

            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_ga
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request to delete a given Google authenticator
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} google_authenticator_id The google authenticator id to delete
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var delete_ga = function (token, session_secret_key, google_authenticator_id) {
            var endpoint = '/user/ga/';
            var connection_type = "DELETE";
            var data = {
                google_authenticator_id: google_authenticator_id
            };

            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#create_yubikey_otp
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request with the token as authentication to generate a google authenticator
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} title The title of the new GA
         * @param {string} yubikey_otp One YubiKey OTP Code
         *
         * @returns {promise} Returns a promise with the secret
         */
        var create_yubikey_otp = function (token, session_secret_key, title, yubikey_otp) {
            var endpoint = '/user/yubikey-otp/';
            var connection_type = "PUT";
            var data = {
                title: title,
                yubikey_otp: yubikey_otp
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_yubikey_otp
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request to get a list of all registered google authenticators
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} Returns a promise with a list of all google authenticators
         */
        var read_yubikey_otp = function (token, session_secret_key) {
            var endpoint = '/user/yubikey-otp/';
            var connection_type = "GET";
            var data = null;

            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_yubikey_otp
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request to delete a given Yubikey for OTP
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} yubikey_otp_id The Yubikey id to delete
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var delete_yubikey_otp = function (token, session_secret_key, yubikey_otp_id) {
            var endpoint = '/user/yubikey-otp/';
            var connection_type = "DELETE";
            var data = {
                yubikey_otp_id: yubikey_otp_id
            };

            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_share_link
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request with the token as authentication to create a link between a share and a datastore or another
         * (parent-)share
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} link_id the link id
         * @param {uuid} share_id the share ID
         * @param {uuid} [parent_share_id=null] (optional) parent share ID, necessary if no parent_datastore_id is provided
         * @param {uuid} [parent_datastore_id=null] (optional) parent datastore ID, necessary if no parent_share_id is provided
         *
         * @returns {promise} promise
         */
        var create_share_link = function (token, session_secret_key, link_id, share_id, parent_share_id, parent_datastore_id) {
            var endpoint = '/share/link/';
            var connection_type = "PUT";
            var data = {
                link_id: link_id,
                share_id: share_id,
                parent_share_id: parent_share_id,
                parent_datastore_id: parent_datastore_id
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#move_share_link
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request with the token as authentication to move a link between a share and a datastore or another
         * (parent-)share
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} link_id the link id
         * @param {uuid} [new_parent_share_id=null] (optional) new parent share ID, necessary if no new_parent_datastore_id is provided
         * @param {uuid} [new_parent_datastore_id=null] (optional) new datastore ID, necessary if no new_parent_share_id is provided
         *
         * @returns {promise} promise
         */
        var move_share_link = function (token, session_secret_key, link_id, new_parent_share_id, new_parent_datastore_id) {
            var endpoint = '/share/link/';
            var connection_type = "POST";
            var data = {
                link_id: link_id,
                new_parent_share_id: new_parent_share_id,
                new_parent_datastore_id: new_parent_datastore_id
            };
            var headers = {
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_share_link
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request with the token as authentication to delete a link
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} link_id The Link ID
         *
         * @returns {promise} promise
         */
        var delete_share_link = function (token, session_secret_key, link_id) {
            var endpoint = '/share/link/';
            var connection_type = "DELETE";
            var data = {
                link_id: link_id
            };
            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token "+ token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        // /**
        //  * @ngdoc
        //  * @name psonocli.apiClient#read_group
        //  * @methodOf psonocli.apiClient
        //  *
        //  * @description
        //  * Ajax GET request with the token as authentication to get the current user's groups
        //  *
        //  * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
        //  * @param {string} session_secret_key The session secret key
        //  * @param {uuid} [group_id=null] (optional) group ID
        //  * @returns {promise} promise
        //  */
        // var read_group = function (token, session_secret_key, group_id) {
        //
        //     //optional parameter group_id
        //     if (group_id === undefined) { group_id = null; }
        //
        //     var endpoint = '/group/' + (group_id === null ? '' : group_id + '/');
        //     var connection_type = "GET";
        //     var data = null;
        //     var headers = {
        //         "Authorization": "Token "+ token
        //     };
        //
        //     return call(connection_type, endpoint, data, headers, session_secret_key);
        // };
        //
        //
        // /**
        //  * @ngdoc
        //  * @name psonocli.apiClient#create_group
        //  * @methodOf psonocli.apiClient
        //  *
        //  * @description
        //  * Ajax PUT request to create a group with the token as authentication and together with the name of the group
        //  *
        //  * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
        //  * @param {string} session_secret_key The session secret key
        //  * @param {string} name name of the new group
        //  * @param {string} encrypted_data_secret_key encrypted secret key
        //  * @param {string} encrypted_data_secret_key_nonce nonce for secret key
        //  * @returns {promise} promise
        //  */
        // var create_group = function (token, session_secret_key, name, encrypted_data_secret_key, encrypted_data_secret_key_nonce) {
        //     var endpoint = '/group/';
        //     var connection_type = "PUT";
        //     var data = {
        //         name: name,
        //         secret_key: encrypted_data_secret_key,
        //         secret_key_nonce: encrypted_data_secret_key_nonce
        //     };
        //     var headers = {
        //         "Authorization": "Token "+ token
        //     };
        //
        //     return call(connection_type, endpoint, data, headers, session_secret_key);
        // };

        return {
            login: login,
            ga_verify: ga_verify,
            yubikey_otp_verify: yubikey_otp_verify,
            activate_token: activate_token,
            get_open_sessions: get_open_sessions,
            logout: logout,
            register: register,
            verify_email: verify_email,
            update_user: update_user,
            write_recoverycode: write_recoverycode,
            enable_recoverycode: enable_recoverycode,
            set_password: set_password,
            read_datastore: read_datastore,
            write_datastore: write_datastore,
            create_datastore: create_datastore,
            read_secret: read_secret,
            write_secret: write_secret,
            create_secret: create_secret,
            move_secret_link: move_secret_link,
            delete_secret_link: delete_secret_link,
            read_share:read_share,
            read_shares: read_shares,
            write_share: write_share,
            create_share: create_share,
            read_share_rights: read_share_rights,
            read_share_rights_overview: read_share_rights_overview,
            create_share_right: create_share_right,
            update_share_right: update_share_right,
            delete_share_right: delete_share_right,
            read_share_rights_inherit_overview: read_share_rights_inherit_overview,
            accept_share_right: accept_share_right,
            decline_share_right: decline_share_right,
            get_users_public_key: get_users_public_key,
            read_ga: read_ga,
            delete_ga: delete_ga,
            create_ga: create_ga,
            read_yubikey_otp: read_yubikey_otp,
            delete_yubikey_otp: delete_yubikey_otp,
            create_yubikey_otp: create_yubikey_otp,
            create_share_link: create_share_link,
            move_share_link: move_share_link,
            delete_share_link: delete_share_link
            // read_group: read_group,
            // create_group: create_group
        };
    };

    var app = angular.module('psonocli');
    app.factory("apiClient", ['$http', '$q', '$rootScope', 'storage', 'cryptoLibrary', apiClient]);

}(angular));
