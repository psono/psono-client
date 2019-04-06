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
     * @requires psonocli.device
     * @requires psonocli.offlineCache
     *
     * @description
     * Service to talk to the psono REST api
     */

    var apiClient = function($http, $q, $rootScope, storage, cryptoLibrary, device, offlineCache) {

        var decrypt_data = function(session_secret_key, data, req) {
            if (session_secret_key && data !== null
                && data.hasOwnProperty('data')
                && data.data.hasOwnProperty('text')
                && data.data.hasOwnProperty('nonce')) {
                data.data = JSON.parse(cryptoLibrary.decrypt_data(data.data.text, data.data.nonce, session_secret_key));
            }
            offlineCache.set(req, data);
            return data;
        };

        var call = function(connection_type, endpoint, data, headers, session_secret_key, synchronous) {

            var server = storage.find_key('config', 'server');

            if (server === null) {
                return $q(function(resolve, reject) {
                    return reject({
                        status: -1
                    })
                });
            }

            var backend = server['value']['url'];

            if (session_secret_key && data !== null) {
                // TODO remove later once all servers have the new REPLAY PROTECTION mechanism
                data['request_time'] = new Date().toISOString();

                data = cryptoLibrary.encrypt_data(JSON.stringify(data), session_secret_key);
            }

            if (session_secret_key && headers && headers.hasOwnProperty("Authorization")) {
                var validator = {
                    'request_time': new Date().toISOString(),
                    'request_device_fingerprint': device.get_device_fingerprint()
                };
                headers['Authorization-Validator'] = JSON.stringify(cryptoLibrary.encrypt_data(JSON.stringify(validator), session_secret_key));
            }

            var req = {
                method: connection_type,
                url: backend + endpoint,
                data: data
            };

            req.headers = headers;

            var cached = offlineCache.get(req);

            if (cached !== null) {
                if (synchronous) {
                    return cached;
                } else {
                    return $q.resolve(cached);
                }
            }

            if (synchronous) {
                /**
                 * Necessary evil... used to copy data to the clipboard which can only happen on user interaction,
                 * which means that we need a user event for it, which means that we have to block the thread with a
                 * synchronous wait... If someone has a better idea let me know!
                 */
                data = jQuery.ajax({
                    type: connection_type,
                    url: backend + endpoint,
                    async: false,
                    data: data, // No data required for get
                    dataType: 'text', // will be json but for the demo purposes we insist on text
                    beforeSend: function (xhr) {
                        for (var header in headers) {
                            if (!headers.hasOwnProperty(header)) {
                                continue;
                            }
                            xhr.setRequestHeader(header, headers[header]);
                        }
                    }
                });

                return decrypt_data(session_secret_key, {data: JSON.parse(data.responseText)}, req);

            } else {
                return $q(function(resolve, reject) {

                    var onSuccess = function(data) {
                        return resolve(decrypt_data(session_secret_key, data, req));
                    };

                    var onError = function(data) {

                        if (data.status === 401) {
                            $rootScope.$broadcast('force_logout', '');
                        }
                        if (data.status === 502) {
                            $rootScope.$broadcast('force_logout', '');
                        }
                        if (data.status === 503) {
                            $rootScope.$broadcast('force_logout', '');
                        }
                        return reject(decrypt_data(session_secret_key, data, req));
                    };

                    $http(req)
                        .then(onSuccess, onError);

                });
            }
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#info
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request to get the server info
         *
         * @returns {promise} promise
         */
        var info = function () {

            var endpoint = '/info/';
            var connection_type = "GET";
            var data = null;
            var headers = null;

            return call(connection_type, endpoint, data, headers);
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
         * @param {string} login_info The encrypted login info (username, authkey, device fingerprint, device description)
         * @param {string} login_info_nonce The nonce of the login info
         * @param {string} public_key The session public key
         * @param {int} session_duration The time the session should be valid for in seconds
         *
         * @returns {promise} Returns a promise with the login status
         */
        var login = function(login_info, login_info_nonce, public_key, session_duration) {

            var endpoint = '/authentication/login/';
            var connection_type = "POST";
            var data = {
                login_info: login_info,
                login_info_nonce: login_info_nonce,
                public_key: public_key,
                session_duration: session_duration
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
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} Returns a promise with the verification status
         */
        var ga_verify = function(token, ga_token, session_secret_key) {

            var endpoint = '/authentication/ga-verify/';
            var connection_type = "POST";
            var data = {
                ga_token: ga_token
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#duo_verify
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to the backend with the Duo Token
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} [duo_token] (optional) The Duo token
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} Returns a promise with the verification status
         */
        var duo_verify = function(token, duo_token, session_secret_key) {

            var endpoint = '/authentication/duo-verify/';
            var connection_type = "POST";
            var data = {
                duo_token: duo_token
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
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
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} Returns a promise with the verification status
         */
        var yubikey_otp_verify = function(token, yubikey_otp, session_secret_key) {

            var endpoint = '/authentication/yubikey-otp-verify/';
            var connection_type = "POST";
            var data = {
                yubikey_otp: yubikey_otp
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
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
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} promise
         */
        var activate_token = function(token, verification, verification_nonce, session_secret_key) {

            var endpoint = '/authentication/activate-token/';
            var connection_type = "POST";
            var data = {
                verification: verification,
                verification_nonce: verification_nonce
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#get_sessions
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request get all sessions
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} promise
         */
        var get_sessions = function(token, session_secret_key) {

            var endpoint = '/authentication/sessions/';
            var connection_type = "GET";
            var data = null;

            var headers = {
                "Authorization": "Token " + token
            };


            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#read_emergency_codes
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request get all emergency codes
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} promise
         */
        var read_emergency_codes = function(token, session_secret_key) {

            var endpoint = '/emergencycode/';
            var connection_type = "GET";
            var data = null;

            var headers = {
                "Authorization": "Token " + token
            };


            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_emergency_code
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to create a datatore with the token as authentication and optional already some data,
         * together with the encrypted secret key and nonce
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @param {string} description The description of the emergency code
         * @param {string} activation_delay The delay till someone can activate this code in seconds
         * @param {string} emergency_authkey The emergency_authkey (derivative of the emergency_password)
         * @param {string} emergency_data The Recovery Data, an encrypted json object
         * @param {string} emergency_data_nonce The nonce used for the encryption of the data
         * @param {string} emergency_sauce The random sauce used as salt
         *
         * @returns {promise} promise
         */
        var create_emergency_code = function (token, session_secret_key, description, activation_delay, emergency_authkey, emergency_data, emergency_data_nonce, emergency_sauce) {
            var endpoint = '/emergencycode/';
            var connection_type = "POST";
            var data = {
                description: description,
                activation_delay: activation_delay,
                emergency_authkey: emergency_authkey,
                emergency_data: emergency_data,
                emergency_data_nonce: emergency_data_nonce,
                emergency_sauce: emergency_sauce
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_emergency_code
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request to delete a given emergency code
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} emergency_code_id The emergency code id to delete
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var delete_emergency_code = function (token, session_secret_key, emergency_code_id) {
            var endpoint = '/emergencycode/';
            var connection_type = "DELETE";
            var data = {
                emergency_code_id: emergency_code_id
            };

            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token " + token
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
         * @param {string|undefined} [session_id] An optional session ID to logout
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
                "Authorization": "Token " + token
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
         * @param {string} private_key The (encrypted) private key
         * @param {string} private_key_nonce The nonce for the private key
         * @param {string} secret_key The (encrypted) secret key
         * @param {string} secret_key_nonce The nonce for the secret key
         *
         * @returns {promise} Returns a promise with the update status
         */
        var update_user = function(token, session_secret_key, email, authkey, authkey_old, private_key, private_key_nonce, secret_key, secret_key_nonce) {
            var endpoint = '/user/update/';
            var connection_type = "PUT";
            var data = {
                email: email,
                authkey: authkey,
                authkey_old: authkey_old,
                private_key: private_key,
                private_key_nonce: private_key_nonce,
                secret_key: secret_key,
                secret_key_nonce: secret_key_nonce
            };
            var headers = {
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
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
         * @name psonocli.apiClient#arm_emergency_code
         * @methodOf psonocli.apiClient
         *
         * @description
         * AJAX POST request to the backend with the emergency_code_authkey to initiate the activation of the emergency code
         *
         * @param {string} username the account's username e.g dummy@example.com
         * @param {string} emergency_authkey The emergency_code (derivative of the recovery_password)
         *
         * @returns {promise} Returns a promise with the recovery_data
         */
        var arm_emergency_code = function(username, emergency_authkey) {
            var endpoint = '/emergency-login/';
            var connection_type = "POST";
            var data = {
                username: username,
                emergency_authkey: emergency_authkey
            };
            var headers = null;

            return call(connection_type, endpoint, data, headers);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#activate_emergency_code
         * @methodOf psonocli.apiClient
         *
         * @description
         * AJAX POST request to the backend to actually actually activate the emergency code and get an active session back
         *
         * @param {string} username the account's username e.g dummy@example.com
         * @param {string} emergency_authkey The emergency_authkey (derivative of the recovery_password)
         * @param {string} update_data The private and secret key object encrypted with the verifier
         * @param {string} update_data_nonce The nonce of the encrypted private and secret key object
         *
         * @returns {promise} Returns a promise with the recovery_data
         */
        var activate_emergency_code = function(username, emergency_authkey, update_data, update_data_nonce) {
            var endpoint = '/emergency-login/';
            var connection_type = "PUT";
            var data = {
                username: username,
                emergency_authkey: emergency_authkey,
                update_data: update_data,
                update_data_nonce: update_data_nonce
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
         * @param {uuid|undefined} [datastore_id=null] (optional) the datastore ID
         *
         * @returns {promise} promise
         */
        var read_datastore = function (token, session_secret_key, datastore_id) {
            var endpoint = '/datastore/' + ( !datastore_id ? '' : datastore_id + '/');
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_secret_history
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to read the history for a secret as a list
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} secret_id the secret ID
         *
         * @returns {promise} promise
         */
        var read_secret_history = function (token, session_secret_key, secret_id) {
            var endpoint = '/secret/history/' + secret_id + '/';
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_history
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get the details of a history entry
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} secret_history_id the secret ID
         *
         * @returns {promise} promise
         */
        var read_history = function (token, session_secret_key, secret_history_id) {
            var endpoint = '/history/' + secret_history_id + '/';
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token " + token
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
         * @param {string|undefined} [encrypted_data] (optional) data for the new datastore
         * @param {string|undefined} [encrypted_data_nonce] (optional) nonce for data, necessary if data is provided
         * @param {string|undefined} [is_default] (optional) Is the new default datastore of this type
         * @param {string} encrypted_data_secret_key encrypted secret key
         * @param {string} encrypted_data_secret_key_nonce nonce for secret key
         *
         * @returns {promise} promise
         */
        var create_datastore = function (token, session_secret_key, type, description, encrypted_data,
                                         encrypted_data_nonce, is_default, encrypted_data_secret_key,
                                         encrypted_data_secret_key_nonce) {
            var endpoint = '/datastore/';
            var connection_type = "PUT";
            var data = {
                type: type,
                description: description,
                data: encrypted_data,
                data_nonce: encrypted_data_nonce,
                is_default: is_default,
                secret_key: encrypted_data_secret_key,
                secret_key_nonce: encrypted_data_secret_key_nonce
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_datastore
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request with the token as authentication to delete a datastore
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} datastore_id The datastore id
         * @param {string} authkey The authkey of the user
         *
         * @returns {promise} Returns a promise with the status of the delete operation
         */
        var delete_datastore = function (token, session_secret_key, datastore_id, authkey) {
            var endpoint = '/datastore/';
            var connection_type = "DELETE";
            var data = {
                datastore_id: datastore_id,
                authkey: authkey
            };
            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#write_datastore
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request with the token as authentication and the datastore's new content
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} datastore_id the datastore ID
         * @param {string|undefined} [encrypted_data] (optional) data for the datastore
         * @param {string|undefined} [encrypted_data_nonce] (optional) nonce for data, necessary if data is provided
         * @param {string|undefined} [encrypted_data_secret_key] (optional) encrypted secret key, wont update on the server if not provided
         * @param {string|undefined} [encrypted_data_secret_key_nonce] (optional) nonce for secret key, wont update on the server if not provided
         * @param {string|undefined} [description] (optional) The new description of the datastore
         * @param {boolean|undefined} [is_default] (optional) Is this the new default datastore
         *
         * @returns {promise} promise
         */
        var write_datastore = function (token, session_secret_key, datastore_id, encrypted_data, encrypted_data_nonce,
                                        encrypted_data_secret_key, encrypted_data_secret_key_nonce, description, is_default) {
            var endpoint = '/datastore/';
            var connection_type = "POST";
            var data = {
                datastore_id: datastore_id,
                data: encrypted_data,
                data_nonce: encrypted_data_nonce,
                secret_key: encrypted_data_secret_key,
                secret_key_nonce: encrypted_data_secret_key_nonce,
                description: description,
                is_default: is_default
            };
            var headers = {
                "Authorization": "Token " + token
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
         * @param {uuid} secret_id secret ID
         * @param {boolean|undefined} [synchronous] (optional) Synchronous or Asynchronous
         *
         * @returns {promise} promise
         */
        var read_secret = function (token, session_secret_key, secret_id, synchronous) {
            var endpoint = '/secret/' + secret_id + '/';
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key, synchronous)
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
         * @param {string} encrypted_data data for the new secret
         * @param {string} encrypted_data_nonce nonce for data, necessary if data is provided
         * @param {string} link_id the local id of the share in the datastructure
         * @param {string|undefined} [parent_datastore_id] (optional) id of the parent datastore, may be left empty if the share resides in a share
         * @param {string|undefined} [parent_share_id] (optional) id of the parent share, may be left empty if the share resides in the datastore
         * @param {string} callback_url The callback ULR
         * @param {string} callback_user The callback user
         * @param {string} callback_pass The callback password
         *
         * @returns {promise} Returns a promise with the new secret_id
         */
        var create_secret = function (token, session_secret_key, encrypted_data, encrypted_data_nonce, link_id,
                                      parent_datastore_id, parent_share_id, callback_url, callback_user, callback_pass) {
            var endpoint = '/secret/';
            var connection_type = "PUT";
            var data = {
                data: encrypted_data,
                data_nonce: encrypted_data_nonce,
                link_id: link_id,
                parent_datastore_id: parent_datastore_id,
                parent_share_id: parent_share_id,
                callback_url: callback_url,
                callback_user: callback_user,
                callback_pass: callback_pass
            };
            var headers = {
                "Authorization": "Token " + token
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
         * @param {string|undefined} [encrypted_data] (optional) data for the new secret
         * @param {string|undefined} [encrypted_data_nonce] (optional) nonce for data, necessary if data is provided
         * @param {string} callback_url The callback ULR
         * @param {string} callback_user The callback user
         * @param {string} callback_pass The callback password
         *
         * @returns {promise} promise
         */
        var write_secret = function (token, session_secret_key, secret_id, encrypted_data, encrypted_data_nonce, callback_url, callback_user, callback_pass) {
            var endpoint = '/secret/';
            var connection_type = "POST";
            var data = {
                secret_id: secret_id,
                data: encrypted_data,
                data_nonce: encrypted_data_nonce,
                callback_url: callback_url,
                callback_user: callback_user,
                callback_pass: callback_pass
            };
            var headers = {
                "Authorization": "Token " + token
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
         * @param {uuid|undefined} [new_parent_share_id=null] (optional) new parent share ID, necessary if no new_parent_datastore_id is provided
         * @param {uuid|undefined} [new_parent_datastore_id=null] (optional) new datastore ID, necessary if no new_parent_share_id is provided
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
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#move_file_link
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request with the token as authentication to move a link between a file and a datastore or a share
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} link_id the link id
         * @param {uuid|undefined} [new_parent_share_id=null] (optional) new parent share ID, necessary if no new_parent_datastore_id is provided
         * @param {uuid|undefined} [new_parent_datastore_id=null] (optional) new datastore ID, necessary if no new_parent_share_id is provided
         *
         * @returns {promise} Returns promise with the status of the move
         */
        var move_file_link = function (token, session_secret_key, link_id, new_parent_share_id, new_parent_datastore_id) {
            var endpoint = '/file/link/';
            var connection_type = "POST";
            var data = {
                link_id: link_id,
                new_parent_share_id: new_parent_share_id,
                new_parent_datastore_id: new_parent_datastore_id
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_file_link
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request with the token as authentication to delete the file link
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} link_id The link id
         *
         * @returns {promise} Returns a promise with the status of the delete operation
         */
        var delete_file_link = function (token, session_secret_key, link_id) {
            var endpoint = '/file/link/';
            var connection_type = "DELETE";
            var data = {
                link_id: link_id
            };
            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
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
         * @param {string|undefined} [encrypted_data] (optional) The data for the new share
         * @param {string|undefined} [encrypted_data_nonce] (optional) The nonce for data, necessary if data is provided
         * @param {string} key encrypted key used by the encryption
         * @param {string} key_nonce nonce for key, necessary if a key is provided
         * @param {string|undefined} [parent_share_id] (optional) The id of the parent share, may be left empty if the share resides in the datastore
         * @param {string|undefined} [parent_datastore_id] (optional) The id of the parent datastore, may be left empty if the share resides in a share
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
                "Authorization": "Token " + token
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
         * @param {string|undefined} [encrypted_data] (optional) data for the new share
         * @param {string|undefined} [encrypted_data_nonce] (optional) nonce for data, necessary if data is provided
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
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
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
         * @param {string} encrypted_title The title shown to the user before he accepts
         * @param {string} encrypted_title_nonce The corresponding title nonce
         * @param {string} encrypted_type The type of the share
         * @param {string} encrypted_type_nonce The corresponding type nonce
         * @param {uuid} share_id The share ID
         * @param {uuid} [user_id] (optional) The target user's user ID
         * @param {uuid} [group_id] (optional) The target group's group ID
         * @param {string} key The encrypted share secret, encrypted with the public key of the target user
         * @param {string} key_nonce The unique nonce for decryption
         * @param {bool} read read permission
         * @param {bool} write write permission
         * @param {bool} grant grant permission
         *
         * @returns {promise} promise
         */
        var create_share_right = function (token, session_secret_key, encrypted_title, encrypted_title_nonce,
                                           encrypted_type, encrypted_type_nonce, share_id, user_id, group_id, key,
                                           key_nonce, read, write, grant) {
            var endpoint = '/share/right/';
            var connection_type = "PUT";
            var data = {
                title: encrypted_title,
                title_nonce: encrypted_title_nonce,
                type: encrypted_type,
                type_nonce: encrypted_type_nonce,
                share_id: share_id,
                user_id: user_id,
                group_id: group_id,
                key: key,
                key_nonce: key_nonce,
                read: read,
                write: write,
                grant: grant
            };
            var headers = {
                "Authorization": "Token " + token
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
         * @param {uuid} group_id the target user's user ID
         * @param {bool} read read right
         * @param {bool} write write right
         * @param {bool} grant grant right
         *
         * @returns {promise} promise
         */
        var update_share_right = function (token, session_secret_key, share_id,
                                           user_id, group_id, read, write, grant) {
            var endpoint = '/share/right/';
            var connection_type = "POST";
            var data = {
                share_id: share_id,
                user_id: user_id,
                group_id: group_id,
                read: read,
                write: write,
                grant: grant
            };
            var headers = {
                "Authorization": "Token " + token
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
         * @param {uuid} user_share_right_id the user share right ID
         * @param {uuid} group_share_right_id the group share right ID
         *
         * @returns {promise} promise
         */
        var delete_share_right = function (token, session_secret_key, user_share_right_id, group_share_right_id) {
            var endpoint = '/share/right/';
            var connection_type = "DELETE";
            var data = {
                user_share_right_id: user_share_right_id,
                group_share_right_id: group_share_right_id
            };
            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
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
         * @param {string} key_type The type of the key (default: symmetric)
         *
         * @returns {promise} promise
         */
        var accept_share_right = function (token, session_secret_key, share_right_id, key, key_nonce, key_type) {
            var endpoint = '/share/right/accept/';
            var connection_type = "POST";
            var data = {
                share_right_id: share_right_id,
                key: key,
                key_nonce: key_nonce,
                key_type: key_type
            };
            var headers = {
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#search_user
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request with the token as authentication to get the public key of a user by user_id or user_email
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid|undefined} [user_id] (optional) the user ID
         * @param {str|undefined} [user_username] (optional) the username
         * @param {email|undefined} [user_email] (optional) the email
         *
         * @returns {promise} Returns a promise with the user information
         */
        var search_user = function (token, session_secret_key, user_id, user_username, user_email) {
            var endpoint = '/user/search/';
            var connection_type = "POST";
            var data = {
                user_id: user_id,
                user_username: user_username,
                user_email: user_email,
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_status
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request to query the server for the status
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} Returns a promise with the user information
         */
        var read_status = function (token, session_secret_key) {
            var endpoint = '/user/status/';
            var connection_type = "GET";
            var data = null;

            var headers = {
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_duo
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to activate registered Google Authenticator
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} google_authenticator_id The Google Authenticator id to activate
         * @param {string} google_authenticator_token One Google Authenticator Code
         *
         * @returns {promise} Returns weather it was successful or not
         */
        var activate_ga = function (token, session_secret_key, google_authenticator_id, google_authenticator_token) {
            var endpoint = '/user/ga/';
            var connection_type = "POST";
            var data = {
                google_authenticator_id: google_authenticator_id,
                google_authenticator_token: google_authenticator_token
            };

            var headers = {
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#create_duo
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request with the token as authentication to generate a duo
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} title The title of the duo
         * @param {string} integration_key The integration_key of the duo
         * @param {string} secret_key The secret_key of the duo
         * @param {string} host The host of the duo
         *
         * @returns {promise} Returns a promise with the secret
         */
        var create_duo = function (token, session_secret_key, title, integration_key, secret_key, host) {
            var endpoint = '/user/duo/';
            var connection_type = "PUT";
            var data = {
                title: title,
                integration_key: integration_key,
                secret_key: secret_key,
                host: host
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_duo
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request to get a list of all registered duo
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} Returns a promise with a list of all duo
         */
        var read_duo = function (token, session_secret_key) {
            var endpoint = '/user/duo/';
            var connection_type = "GET";
            var data = null;

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_duo
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to activate registered duo
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} duo_id The duo id to activate
         * @param {string} [duo_token] (optional) The duo id to activate
         *
         * @returns {promise} Returns weather it was successful or not
         */
        var activate_duo = function (token, session_secret_key, duo_id, duo_token) {
            var endpoint = '/user/duo/';
            var connection_type = "POST";
            var data = {
                duo_id: duo_id,
                duo_token: duo_token
            };

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_duo
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request to delete a given Google authenticator
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} duo_id The duo id to delete
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var delete_duo = function (token, session_secret_key, duo_id) {
            var endpoint = '/user/duo/';
            var connection_type = "DELETE";
            var data = {
                duo_id: duo_id
            };

            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#create_yubikey_otp
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request with the token as authentication to create / set a new YubiKey OTP token
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} title The title of the new Yubikey OTP token
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
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_yubikey_otp
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request to get a list of all registered Yubikey OTP token
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} Returns a promise with a list of all Yubikey OTP token
         */
        var read_yubikey_otp = function (token, session_secret_key) {
            var endpoint = '/user/yubikey-otp/';
            var connection_type = "GET";
            var data = null;

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_duo
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to activate registered YubiKey
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} yubikey_id The Yubikey id to activate
         * @param {string} yubikey_otp The Yubikey OTP
         *
         * @returns {promise} Returns weather it was successful or not
         */
        var activate_yubikey_otp = function (token, session_secret_key, yubikey_id, yubikey_otp) {
            var endpoint = '/user/yubikey-otp/';
            var connection_type = "POST";
            var data = {
                yubikey_id: yubikey_id,
                yubikey_otp: yubikey_otp
            };

            var headers = {
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
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
         * @param {uuid|undefined} [parent_share_id=null] (optional) parent share ID, necessary if no parent_datastore_id is provided
         * @param {uuid|undefined} [parent_datastore_id=null] (optional) parent datastore ID, necessary if no parent_share_id is provided
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
                "Authorization": "Token " + token
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
         * @param {uuid|undefined} [new_parent_share_id=null] (optional) new parent share ID, necessary if no new_parent_datastore_id is provided
         * @param {uuid|undefined} [new_parent_datastore_id=null] (optional) new datastore ID, necessary if no new_parent_share_id is provided
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
                "Authorization": "Token " + token
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
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_api_key
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get the current user's api keys
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid|undefined} [api_key_id=null] (optional) api key id
         *
         * @returns {promise} promise
         */
        var read_api_key = function (token, session_secret_key, api_key_id) {
            var endpoint = '/api-key/' + ( !api_key_id ? '' : api_key_id + '/');
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_api_key_secrets
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to read all the secrets of a specific api key
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} api_key_id The ID of the api key
         *
         * @returns {promise} promise
         */
        var read_api_key_secrets = function (token, session_secret_key, api_key_id) {
            var endpoint = '/api-key/secret/' + api_key_id + '/';
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_api_key
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to create a api_key with the token as authentication and together with the name of the api_key
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} title title of the new api_key
         * @param {string} public_key The public key of the api key
         * @param {string} private_key encrypted private key of the api_key
         * @param {string} private_key_nonce nonce for private key
         * @param {string} secret_key encrypted secret key of the api_key
         * @param {string} secret_key_nonce nonce for secret key
         * @param {string} user_private_key encrypted private key of the user
         * @param {string} user_private_key_nonce nonce for private key
         * @param {string} user_secret_key encrypted secret key of the user
         * @param {string} user_secret_key_nonce nonce for secret key
         * @param {bool} restrict_to_secrets Restrict to secrets
         * @param {bool} allow_insecure_access Allow insecure access
         * @param {string} verify_key The verify key as a derivat of the private key
         *
         * @returns {promise} promise
         */
        var create_api_key = function (token, session_secret_key, title, public_key, private_key ,private_key_nonce, secret_key,
                                       secret_key_nonce, user_private_key, user_private_key_nonce, user_secret_key, user_secret_key_nonce,
                                       restrict_to_secrets, allow_insecure_access, verify_key) {

            var endpoint = '/api-key/';
            var connection_type = "PUT";
            var data = {
                title: title,
                public_key: public_key,
                private_key: private_key,
                private_key_nonce: private_key_nonce,
                secret_key: secret_key,
                secret_key_nonce: secret_key_nonce,
                user_private_key: user_private_key,
                user_private_key_nonce: user_private_key_nonce,
                user_secret_key: user_secret_key,
                user_secret_key_nonce: user_secret_key_nonce,
                restrict_to_secrets: restrict_to_secrets,
                allow_insecure_access: allow_insecure_access,
                verify_key: verify_key
            };

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#add_secret_to_api_key
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to add a secret to an api key
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} api_key_id The id of the api key
         * @param {uuid} secret_id The id of the secret
         * @param {string} title encrypted title of the api_key
         * @param {string} title_nonce nonce for title
         * @param {string} secret_key encrypted secret key of the api_key
         * @param {string} secret_key_nonce nonce for secret key
         *
         * @returns {promise} promise
         */
        var add_secret_to_api_key = function (token, session_secret_key, api_key_id, secret_id, title, title_nonce, secret_key, secret_key_nonce) {

            var endpoint = '/api-key/secret/';
            var connection_type = "PUT";
            var data = {
                api_key_id: api_key_id,
                secret_id: secret_id,
                title: title,
                title_nonce: title_nonce,
                secret_key: secret_key,
                secret_key_nonce: secret_key_nonce
            };

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#update_api_key
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to update a given api key
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} api_key_id The api_key id to update
         * @param {string} name The new name of the api_key
         * @param {bool} restrict_to_secrets Restrict to secrets
         * @param {bool} allow_insecure_access Allow insecure access
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var update_api_key = function (token, session_secret_key, api_key_id, name, restrict_to_secrets, allow_insecure_access) {
            var endpoint = '/api-key/';
            var connection_type = "POST";
            var data = {
                api_key_id: api_key_id,
                name: name,
                restrict_to_secrets: restrict_to_secrets,
                allow_insecure_access: allow_insecure_access
            };

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_api_key
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request to delete an api key
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} api_key_id The api_key id to delete
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var delete_api_key = function (token, session_secret_key, api_key_id) {
            var endpoint = '/api-key/';
            var connection_type = "DELETE";
            var data = {
                api_key_id: api_key_id
            };

            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_api_key_secret
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request to delete a given secret access right from an api key
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} api_key_secret_id The api_key_secret_id to delete
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var delete_api_key_secret = function (token, session_secret_key, api_key_secret_id) {
            var endpoint = '/api-key/secret/';
            var connection_type = "DELETE";
            var data = {
                api_key_secret_id: api_key_secret_id
            };

            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_file_repository
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get the current user's api keys
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid|undefined} [file_repository_id=null] (optional) api key id
         *
         * @returns {promise} promise
         */
        var read_file_repository = function (token, session_secret_key, file_repository_id) {
            var endpoint = '/file-repository/' + ( !file_repository_id ? '' : file_repository_id + '/');
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_file_repository
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to create a file_repository with the token as authentication and together with the name of the file_repository
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} title title of the new file repository
         * @param {string} type The type of the new file repository
         * @param {string} [gcp_cloud_storage_bucket] (optional) The gcp cloud storage bucket
         * @param {string} [gcp_cloud_storage_json_key] (optional) The gcp cloud storage json key
         * @param {string} [aws_s3_bucket] (optional) The s3 bucket
         * @param {string} [aws_s3_region] (optional) The s3 region
         * @param {string} [aws_s3_access_key_id] (optional) The s3 access key
         * @param {string} [aws_s3_secret_access_key] (optional) The s3 secret key
         *
         * @returns {promise} promise
         */
        var create_file_repository = function (token, session_secret_key, title, type, gcp_cloud_storage_bucket, gcp_cloud_storage_json_key, aws_s3_bucket, aws_s3_region, aws_s3_access_key_id, aws_s3_secret_access_key) {

            var endpoint = '/file-repository/';
            var connection_type = "PUT";
            var data = {
                title: title,
                type: type,
                gcp_cloud_storage_bucket: gcp_cloud_storage_bucket,
                gcp_cloud_storage_json_key: gcp_cloud_storage_json_key,
                aws_s3_bucket: aws_s3_bucket,
                aws_s3_region: aws_s3_region,
                aws_s3_access_key_id: aws_s3_access_key_id,
                aws_s3_secret_access_key: aws_s3_secret_access_key
            };

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#update_file_repository
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to update a given file repository
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} file_repository_id The file_repository id to update
         * @param {string} title title of the new file repository
         * @param {string} type The type of the new file repository
         * @param {string} [gcp_cloud_storage_bucket] (optional) The gcp cloud storage bucket
         * @param {string} [gcp_cloud_storage_json_key] (optional) The gcp cloud storage json key
         * @param {string} [aws_s3_bucket] (optional) The s3 bucket
         * @param {string} [aws_s3_region] (optional) The s3 region
         * @param {string} [aws_s3_access_key_id] (optional) The s3 access key
         * @param {string} [aws_s3_secret_access_key] (optional) The s3 secret key
         * @param {bool} active Active or not
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var update_file_repository = function (token, session_secret_key, file_repository_id, title, type, gcp_cloud_storage_bucket, gcp_cloud_storage_json_key, active, aws_s3_bucket, aws_s3_region, aws_s3_access_key_id, aws_s3_secret_access_key) {
            var endpoint = '/file-repository/';
            var connection_type = "POST";
            var data = {
                file_repository_id: file_repository_id,
                title: title,
                type: type,
                gcp_cloud_storage_bucket: gcp_cloud_storage_bucket,
                gcp_cloud_storage_json_key: gcp_cloud_storage_json_key,
                active: active,
                aws_s3_bucket: aws_s3_bucket,
                aws_s3_region: aws_s3_region,
                aws_s3_access_key_id: aws_s3_access_key_id,
                aws_s3_secret_access_key: aws_s3_secret_access_key
            };

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_file_repository
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request to delete a file repository
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} file_repository_id The file_repository id to delete
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var delete_file_repository = function (token, session_secret_key, file_repository_id) {
            var endpoint = '/file-repository/';
            var connection_type = "DELETE";
            var data = {
                file_repository_id: file_repository_id
            };

            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_file_repository_right
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to create a file repository right for another user for a file repository with the token as authentication
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} file_repository_id ID of the file_repository
         * @param {uuid} user_id ID of the user
         * @param {boolean} read Weather the users should have read rights to read the details
         * @param {boolean} write Weather the users should have read rights to write / update details
         * @param {boolean} grant Weather the users should have read rights to modify other users read and write priviliges
         *
         * @returns {promise} promise
         */
        var create_file_repository_right = function (token, session_secret_key, file_repository_id, user_id, read, write,
                                                     grant) {
            var endpoint = '/file-repository-right/';
            var connection_type = "PUT";
            var data = {
                file_repository_id: file_repository_id,
                user_id: user_id,
                read: read,
                write: write,
                grant: grant
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#update_file_repository_right
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to update a file repository right with the token as authentication
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} file_repository_right_id The file_repository_right id to update
         * @param {boolean} read Weather the users should have read rights to read the details
         * @param {boolean} write Weather the users should have read rights to write / update details
         * @param {boolean} grant Weather the users should have read rights to modify other users read and write priviliges
         *
         * @returns {promise} promise
         */
        var update_file_repository_right = function (token, session_secret_key, file_repository_right_id, read, write, grant) {
            var endpoint = '/file-repository-right/';
            var connection_type = "POST";
            var data = {
                file_repository_right_id: file_repository_right_id,
                read: read,
                write: write,
                grant: grant
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_file_repository_right
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request to delete a given file repository right
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} file_repository_right_id The file repository right id to delete
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var delete_file_repository_right = function (token, session_secret_key, file_repository_right_id) {
            var endpoint = '/file-repository-right/';
            var connection_type = "DELETE";
            var data = {
                file_repository_right_id: file_repository_right_id
            };

            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#accept_file_repository_right
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to accept a file repository share
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} file_repository_right_id The file_repository user id to accept
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var accept_file_repository_right = function (token, session_secret_key, file_repository_right_id) {
            var endpoint = '/file-repository-right/accept/';
            var connection_type = "POST";
            var data = {
                file_repository_right_id: file_repository_right_id
            };

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#decline_file_repository_right
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to decline a file repository share
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} file_repository_right_id The file_repository user id to decline
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var decline_file_repository_right = function (token, session_secret_key, file_repository_right_id) {
            var endpoint = '/file-repository-right/decline/';
            var connection_type = "POST";
            var data = {
                file_repository_right_id: file_repository_right_id
            };

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#file_repository_upload
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to upload a file to an file repository with the token as authentication
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} file_transfer_id The id of the file transfer
         * @param {int} chunk_size The size of the complete chunk in bytes
         * @param {int} chunk_position The sequence number of the chunk to determine the order
         * @param {string} hash_checksum The sha512 hash
         *
         * @returns {promise} promise
         */
        var file_repository_upload = function (token, session_secret_key, file_transfer_id, chunk_size, chunk_position, hash_checksum) {

            var endpoint = '/file-repository/upload/';
            var connection_type = "PUT";
            var data = {
                file_transfer_id: file_transfer_id,
                chunk_size: chunk_size,
                chunk_position: chunk_position,
                hash_checksum: hash_checksum
            };

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#file_repository_download
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to upload a file to an file repository with the token as authentication
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} file_transfer_id The id of the file transfer
         * @param {string} hash_checksum The sha512 hash
         *
         * @returns {promise} promise
         */
        var file_repository_download = function (token, session_secret_key, file_transfer_id, hash_checksum) {

            var endpoint = '/file-repository/download/';
            var connection_type = "PUT";
            var data = {
                file_transfer_id: file_transfer_id,
                hash_checksum: hash_checksum
            };

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_group
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get the current user's groups
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid|undefined} [group_id=null] (optional) group ID
         *
         * @returns {promise} promise
         */
        var read_group = function (token, session_secret_key, group_id) {
            var endpoint = '/group/' + ( !group_id ? '' : group_id + '/');
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_group
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to create a group with the token as authentication and together with the name of the group
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} name name of the new group
         * @param {string} secret_key encrypted secret key of the group
         * @param {string} secret_key_nonce nonce for secret key
         * @param {string} private_key encrypted private key of the group
         * @param {string} private_key_nonce nonce for private key
         * @param {string} public_key the public_key of the group
         *
         * @returns {promise} promise
         */
        var create_group = function (token, session_secret_key, name, secret_key, secret_key_nonce, private_key,
                                     private_key_nonce, public_key) {
            var endpoint = '/group/';
            var connection_type = "PUT";
            var data = {
                name: name,
                secret_key: secret_key,
                secret_key_nonce: secret_key_nonce,
                private_key: private_key,
                private_key_nonce: private_key_nonce,
                public_key: public_key
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#update_group
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to update a given Group
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} group_id The group id to update
         * @param {string} name The new name of the group
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var update_group = function (token, session_secret_key, group_id, name) {
            var endpoint = '/group/';
            var connection_type = "POST";
            var data = {
                group_id: group_id,
                name: name
            };

            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_group
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request to delete a given Group
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} group_id The group id to delete
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var delete_group = function (token, session_secret_key, group_id) {
            var endpoint = '/group/';
            var connection_type = "DELETE";
            var data = {
                group_id: group_id
            };

            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_group_rights
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get all the group rights accessible by a user
         * or for a specific group
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid|undefined} [group_id=null] (optional) group ID
         *
         * @returns {promise} promise
         */
        var read_group_rights = function (token, session_secret_key, group_id) {
            var endpoint = '/group/rights/' + ( !group_id ? '' : group_id + '/');
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_membership
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to create a group membership for another user for a group with the token as authentication
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} group_id ID of the group
         * @param {uuid} user_id ID of the user
         * @param {string} secret_key encrypted secret key of the group
         * @param {string} secret_key_nonce nonce for secret key
         * @param {string} secret_key_type type of the secret key
         * @param {string} private_key encrypted private key of the group
         * @param {string} private_key_nonce nonce for private key
         * @param {string} private_key_type type of the private key
         * @param {boolean} group_admin Weather the users should have group admin rights or not
         * @param {boolean} share_admin Weather the users should have share admin rights or not
         *
         * @returns {promise} promise
         */
        var create_membership = function (token, session_secret_key, group_id, user_id, secret_key, secret_key_nonce,
                                          secret_key_type, private_key,
                                          private_key_nonce, private_key_type, group_admin, share_admin) {
            var endpoint = '/membership/';
            var connection_type = "PUT";
            var data = {
                group_id: group_id,
                user_id: user_id,
                secret_key: secret_key,
                secret_key_nonce: secret_key_nonce,
                secret_key_type: secret_key_type,
                private_key: private_key,
                private_key_nonce: private_key_nonce,
                private_key_type: private_key_type,
                group_admin: group_admin,
                share_admin: share_admin
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#update_membership
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request to update a group membership with the token as authentication
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} membership_id The membership id to update
         * @param {boolean} group_admin Weather the users should have group admin rights or not
         * @param {boolean} share_admin Weather the users should have share admin rights or not
         *
         * @returns {promise} promise
         */
        var update_membership = function (token, session_secret_key, membership_id, group_admin, share_admin) {
            var endpoint = '/membership/';
            var connection_type = "POST";
            var data = {
                membership_id: membership_id,
                group_admin: group_admin,
                share_admin: share_admin
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_membership
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request to delete a given group membership
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} membership_id The membership id to delete
         *
         * @returns {promise} Returns a promise which can succeed or fail
         */
        var delete_membership = function (token, session_secret_key, membership_id) {
            var endpoint = '/membership/';
            var connection_type = "DELETE";
            var data = {
                membership_id: membership_id
            };

            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#accept_membership
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request with the token as authentication to accept a membership and in the same run updates it
         * with the re-encrypted key
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} membership_id The share right id
         *
         * @returns {promise} promise
         */
        var accept_membership = function (token, session_secret_key, membership_id) {
            var endpoint = '/membership/accept/';
            var connection_type = "POST";
            var data = {
                membership_id: membership_id
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#decline_membership
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax POST request with the token as authentication to decline a membership
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} membership_id The share right id
         *
         * @returns {promise} promise
         */
        var decline_membership = function (token, session_secret_key, membership_id) {
            var endpoint = '/membership/decline/';
            var connection_type = "POST";
            var data = {
                membership_id: membership_id
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_file
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request to read a file with the token as authentication
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string} file_id The id of the file
         *
         * @returns {promise} Returns a promise with the new file_id and file_transfer_id
         */
        var read_file = function (token, session_secret_key, file_id) {
            var endpoint = '/file/' + file_id + '/';
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };


        /**
         * @ngdoc
         * @name psonocli.apiClient#create_file
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax PUT request to create a file with the token as authentication
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {string|undefined} shard_id (optional) The id of the target shard
         * @param {string|undefined} file_repository_id (optional) The id of the target file repository
         * @param {int} size The size of the complete file in bytes
         * @param {int} chunk_count The amount of chunks that this file is split into
         * @param {string} link_id the local id of the file in the datastructure
         * @param {string|undefined} [parent_datastore_id] (optional) id of the parent datastore, may be left empty if the share resides in a share
         * @param {string|undefined} [parent_share_id] (optional) id of the parent share, may be left empty if the share resides in the datastore
         *
         * @returns {promise} Returns a promise with the new file_id and file_transfer_id
         */
        var create_file = function (token, session_secret_key, shard_id, file_repository_id, size, chunk_count, link_id, parent_datastore_id, parent_share_id) {
            var endpoint = '/file/';
            var connection_type = "PUT";
            var data = {
                shard_id: shard_id,
                file_repository_id: file_repository_id,
                size: size,
                chunk_count: chunk_count,
                link_id: link_id,
                parent_datastore_id: parent_datastore_id,
                parent_share_id: parent_share_id
            };
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#delete_account
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax DELETE request with the token as authentication to delete a user account
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         * @param {uuid} authkey The authkey of the user
         *
         * @returns {promise} promise
         */
        var delete_account = function (token, session_secret_key, authkey) {
            var endpoint = '/user/delete/';
            var connection_type = "DELETE";
            var data = {
                authkey: authkey
            };
            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        /**
         * @ngdoc
         * @name psonocli.apiClient#read_shards
         * @methodOf psonocli.apiClient
         *
         * @description
         * Ajax GET request with the token as authentication to get the available shards and fileservers
         *
         * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
         * @param {string} session_secret_key The session secret key
         *
         * @returns {promise} promise
         */
        var read_shards = function (token, session_secret_key) {

            var endpoint = '/shard/';
            var connection_type = "GET";
            var data = null;
            var headers = {
                "Authorization": "Token " + token
            };

            return call(connection_type, endpoint, data, headers, session_secret_key);
        };

        return {
            info: info,
            login: login,
            ga_verify: ga_verify,
            duo_verify: duo_verify,
            yubikey_otp_verify: yubikey_otp_verify,
            activate_token: activate_token,
            get_sessions: get_sessions,
            read_emergency_codes: read_emergency_codes,
            create_emergency_code: create_emergency_code,
            delete_emergency_code: delete_emergency_code,
            logout: logout,
            register: register,
            verify_email: verify_email,
            update_user: update_user,
            write_recoverycode: write_recoverycode,
            enable_recoverycode: enable_recoverycode,
            arm_emergency_code: arm_emergency_code,
            activate_emergency_code: activate_emergency_code,
            set_password: set_password,
            read_secret_history: read_secret_history,
            read_history : read_history,
            read_datastore: read_datastore,
            write_datastore: write_datastore,
            create_datastore: create_datastore,
            delete_datastore: delete_datastore,
            read_secret: read_secret,
            write_secret: write_secret,
            create_secret: create_secret,
            move_secret_link: move_secret_link,
            delete_secret_link: delete_secret_link,
            move_file_link: move_file_link,
            delete_file_link: delete_file_link,
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
            search_user: search_user,
            read_ga: read_ga,
            activate_ga: activate_ga,
            delete_ga: delete_ga,
            read_status: read_status,
            create_ga: create_ga,
            read_duo: read_duo,
            activate_duo: activate_duo,
            delete_duo: delete_duo,
            create_duo: create_duo,
            read_yubikey_otp: read_yubikey_otp,
            activate_yubikey_otp: activate_yubikey_otp,
            delete_yubikey_otp: delete_yubikey_otp,
            create_yubikey_otp: create_yubikey_otp,
            create_share_link: create_share_link,
            move_share_link: move_share_link,
            delete_share_link: delete_share_link,
            read_api_key: read_api_key,
            read_api_key_secrets: read_api_key_secrets,
            create_api_key: create_api_key,
            add_secret_to_api_key: add_secret_to_api_key,
            update_api_key: update_api_key,
            delete_api_key: delete_api_key,
            delete_api_key_secret: delete_api_key_secret,
            read_file_repository: read_file_repository,
            create_file_repository: create_file_repository,
            update_file_repository: update_file_repository,
            delete_file_repository: delete_file_repository,
            create_file_repository_right: create_file_repository_right,
            update_file_repository_right: update_file_repository_right,
            delete_file_repository_right: delete_file_repository_right,
            accept_file_repository_right: accept_file_repository_right,
            decline_file_repository_right: decline_file_repository_right,
            file_repository_upload: file_repository_upload,
            file_repository_download: file_repository_download,
            read_group: read_group,
            create_group: create_group,
            update_group: update_group,
            delete_group: delete_group,
            read_group_rights: read_group_rights,
            create_membership: create_membership,
            update_membership: update_membership,
            delete_membership: delete_membership,
            accept_membership: accept_membership,
            decline_membership: decline_membership,
            read_file: read_file,
            create_file: create_file,
            delete_account: delete_account,
            read_shards: read_shards
        };
    };

    var app = angular.module('psonocli');
    app.factory("apiClient", ['$http', '$q', '$rootScope', 'storage', 'cryptoLibrary', 'device', 'offlineCache', apiClient]);

}(angular));
