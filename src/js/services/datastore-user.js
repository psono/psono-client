/**
 * Service to manage the user datastore and user related functions
 */

import datastoreService from "./datastore";
import helper from "./helper";
import store from "./store";
import apiClient from "./api-client";
import datastorePassword from "./datastore-password";
import datastorePasswordService from "./datastore-password";

// let required_multifactors = [];
// let session_keys;
// let session_secret_key;
// let token;
// let user_sauce;
// let user_public_key;
// let user_private_key;
// let session_password;
// let verification;
// const registrations = {};
//
//
// /**
//  * Checks if the user is logged in.
//  *
//  * @return {boolean} Returns either if the user is logged in
//  */
// function is_logged_in() {
//     const token = managerBase.get_token();
//     return token !== null && token !== "";
// };
//
//

//
// /**
//  * used to register functions for specific events
//  *
//  * @param {string} event The event to subscribe to
//  * @param {function} func The callback function to subscribe
//  */
// function on(event, func) {
//     if (!registrations.hasOwnProperty(event)){
//         registrations[event] = [];
//     }
//
//     registrations[event].push(func);
// };
//
// /**
//  * emits an event and calls all registered functions for this event.
//  *
//  * @param {string} event The event to trigger
//  * @param {*} data The payload data to send to the subscribed callback functions
//  */
// function emit(event, data) {
//
//     if (!registrations.hasOwnProperty(event)){
//         return;
//     }
//     for (let i = registrations[event].length - 1; i >= 0; i--) {
//         registrations[event][i](data);
//     }
// };
//
//
// /**
//  * Activates a user account with the provided activation code after registration
//  *
//  * @param {string} activation_code The activation code sent via mail
//  * @param {string} server The server to send the activation code to
//  *
//  * @returns {Promise} Returns a promise with the activation status
//  */
// function activateCode(activation_code, server) {
//
//     storage.upsert('config', {key: 'server', value: server});
//
//     const onSuccess = function () {
//
//         storage.save();
//
//         return {
//             response:"success"
//         };
//     };
//
//     const onError = function(response){
//
//         storage.remove('config', storage.find_key('config', 'server'));
//         storage.save();
//
//         return {
//             response:"error",
//             error_data: response.data
//         };
//     };
//
//     return apiClient.verify_email(activation_code)
//         .then(onSuccess, onError);
// };
//
// /**
//  * Handles the validation of the token with the server by solving the cryptographic puzzle
//  *
//  * @returns {Promise} Returns a promise with the the final activate token was successful or not
//  */
// function activate_token() {
//
//     const onError = function(response){
//
//         // in case of any error we remove the items we already added to our storage
//         // maybe we adjust this behaviour at some time
//         storage.remove('config', storage.find_key('config', 'user_username'));
//         storage.remove('config', storage.find_key('config', 'server'));
//
//         storage.save();
//
//         // no need anymore for the public / private session keys
//         session_keys = null;
//         session_secret_key = null;
//         token = null;
//         user_sauce = null;
//         user_public_key = null;
//         user_private_key = null;
//         session_password = null;
//         verification = null;
//
//         return Promise.reject({
//             response:"error",
//             error_data: response.data
//         });
//     };
//
//     const onSuccess = function (activation_data) {
//         // decrypt user secret key
//         const user_secret_key = cryptoLibrary.decrypt_secret(
//             activation_data.data.user.secret_key,
//             activation_data.data.user.secret_key_nonce,
//             session_password,
//             user_sauce
//         );
//
//         Raven.setUserContext({
//             username: managerBase.find_key('config', 'user_username')
//         });
//
//         let authentication = 'AUTHKEY'
//         if (typeof(activation_data.data.user.authentication) !== 'undefined'){
//             // we check if authentication exists in  activation_data.data.user due to backward compatibiltiy
//             // as the server provides this since Feb 13th 2020
//             authentication = activation_data.data.user.authentication
//         }
//
//         storage.insert('config', {key: 'user_id', value: activation_data.data.user.id});
//         storage.insert('config', {key: 'user_token', value: token});
//         storage.insert('config', {key: 'user_email', value: activation_data.data.user.email});
//         storage.insert('config', {key: 'user_authentication', value: authentication});
//         storage.insert('config', {key: 'session_secret_key', value: session_secret_key});
//         storage.insert('config', {key: 'user_public_key', value: user_public_key});
//         storage.insert('config', {key: 'user_private_key', value: user_private_key});
//         storage.insert('config', {key: 'user_secret_key', value: user_secret_key});
//         storage.insert('config', {key: 'user_sauce', value: user_sauce});
//
//         storage.save();
//         emit("storage-reload", null);
//
//         // no need anymore for the public / private session keys
//         session_keys = null;
//         session_secret_key = null;
//         token = null;
//         user_sauce = null;
//         user_public_key = null;
//         user_private_key = null;
//         session_password = null;
//         verification = null;
//
//
//         $timeout(function() {
//             // make sure that the storage has been saved and synced with other tabs
//             browserClient.emit("login", null);
//         }, 1000);
//
//         return {
//             response:"success"
//         };
//
//     };
//
//     return apiClient.activate_token(token, verification.text, verification.nonce, session_secret_key)
//         .then(onSuccess, onError);
// };
//
// /**
//  * Ajax POST request to the backend with the token
//  *
//  * @param {string} ga_token The GA Token
//  *
//  * @returns {Promise} Returns a promise with the login status
//  */
// function ga_verify(ga_token) {
//
//
//     const onError = function(response){
//         return Promise.reject({
//             response:"error",
//             error_data: response.data
//         });
//     };
//
//     const onSuccess = function () {
//         helper.remove_from_array(required_multifactors, 'google_authenticator_2fa');
//         return required_multifactors;
//     };
//
//     return apiClient.ga_verify(token, ga_token, session_secret_key)
//         .then(onSuccess, onError);
// };
//
// /**
//  * Ajax POST request to the backend with the token
//  *
//  * @param {string} [duo_token] (optional) The Duo Token
//  *
//  * @returns {Promise} Returns a promise with the login status
//  */
// function duo_verify(duo_token) {
//
//
//     const onError = function(response){
//         return Promise.reject({
//             response:"error",
//             error_data: response.data
//         });
//     };
//
//     const onSuccess = function () {
//         helper.remove_from_array(required_multifactors, 'duo_2fa');
//         return required_multifactors;
//     };
//
//     return apiClient.duo_verify(token, duo_token, session_secret_key)
//         .then(onSuccess, onError);
// };
//
// /**
//  * Ajax POST request to the backend with the token
//  *
//  * @param {string} yubikey_otp The YubiKey OTP token
//  *
//  * @returns {Promise} Returns a promise with the login status
//  */
// function yubikey_otp_verify(yubikey_otp) {
//
//
//     const onError = function(response){
//         return Promise.reject({
//             response:"error",
//             error_data: response.data
//         });
//     };
//
//     const onSuccess = function () {
//         helper.remove_from_array(required_multifactors, 'yubikey_otp_2fa');
//         return required_multifactors;
//     };
//
//     return apiClient.yubikey_otp_verify(token, yubikey_otp, session_secret_key)
//         .then(onSuccess, onError);
// };
//
// /**
//  * Returns the default value for the specified item (username or server)
//  *
//  * @param {string} item The saved item to return
//  *
//  * @returns {Promise} Returns the saved default value
//  */
// function getDefault(item) {
//     if (item === 'username') {
//         return managerBase.find_key('persistent', 'username');
//     } else if (item === 'server') {
//         return managerBase.find_key('persistent', 'server');
//     } else if (item === 'trust_device') {
//         return managerBase.find_key('persistent', 'trust_device');
//     }
// };
//
// /**
//  * handles the response of the login with all the necessary cryptography and returns the required multifactors
//  *
//  * @param {object} response The login response
//  * @param {string} password The password
//  * @param {object} session_keys The session keys
//  * @param {string} server_public_key The server's public key
//  *
//  * @returns {Array} The list of required multifactor challenges to solve
//  */
// function handle_login_response(response, password, session_keys, server_public_key) {
//
//     response.data = JSON.parse(cryptoLibrary.decrypt_data_public_key(
//         response.data.login_info,
//         response.data.login_info_nonce,
//         server_public_key,
//         session_keys.private_key
//     ));
//     if (response.data.user.username) {
//         storage.upsert('config', {key: 'user_username', value: response.data.user.username});
//         storage.upsert('config', {key: 'user_has_two_factor', value: response.data['required_multifactors'].length > 0});
//     }
//
//     token = response.data.token;
//     user_sauce = response.data.user.user_sauce;
//     user_public_key = response.data.user.public_key;
//     session_password = password;
//
//     // decrypt the session key
//     session_secret_key = cryptoLibrary.decrypt_data_public_key(
//         response.data.session_secret_key,
//         response.data.session_secret_key_nonce,
//         response.data.session_public_key,
//         session_keys.private_key
//     );
//
//     // decrypt user private key
//     user_private_key = cryptoLibrary.decrypt_secret(
//         response.data.user.private_key,
//         response.data.user.private_key_nonce,
//         password,
//         user_sauce
//     );
//
//     // decrypt the user_validator
//     const user_validator = cryptoLibrary.decrypt_data_public_key(
//         response.data.user_validator,
//         response.data.user_validator_nonce,
//         response.data.session_public_key,
//         user_private_key
//     );
//
//     // encrypt the validator as verification
//     verification = cryptoLibrary.encrypt_data(
//         user_validator,
//         session_secret_key
//     );
//
//     required_multifactors = response.data['required_multifactors'];
//
//     return required_multifactors;
// };
//
// /**
//  * Ajax POST request to the backend with username and authkey for login, saves a token together with user_id
//  * and all the different keys of a user in the api data storage.
//  * Also handles the validation of the token with the server by solving the cryptographic puzzle
//  *
//  * @param {string} username The username to login with
//  * @param {string} domain The domain which we append if necessary to the username
//  * @param {string} password The password to login with
//  * @param {boolean|undefined} remember Remember the username and server
//  * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
//  * @param {object} server The server object to send the login request to
//  * @param {object} server_info Some info about the server including its public key
//  * @param {object} verify_key The signature of the server
//  * @param {boolean} send_plain Indicates to send the password in the login info in plaintext. Necessary for e.g. LDAP
//  *
//  * @returns {Promise} Returns a promise with the login status
//  */
// function login(username, domain, password, remember, trust_device, server, server_info, verify_key, send_plain) {
//
//     username = helper.form_full_username(username, domain);
//
//     managerBase.delete_local_data();
//
//     const authkey = cryptoLibrary.generate_authkey(username, password);
//
//     if (remember) {
//         storage.upsert('persistent', {key: 'username', value: username});
//         storage.upsert('persistent', {key: 'server', value: server});
//     } else {
//         if (storage.key_exists('persistent', 'username')) {
//             storage.remove('persistent', storage.find_key('persistent', 'username'));
//         }
//         if (storage.key_exists('persistent', 'server')) {
//             storage.remove('persistent', storage.find_key('persistent', 'server'));
//         }
//         storage.save();
//     }
//     storage.upsert('persistent', {key: 'trust_device', value: trust_device});
//
//     if (!server_info.hasOwnProperty('allowed_second_factors')) {
//         server_info['allowed_second_factors'] = ['yubikey_otp', 'google_authenticator', 'duo'];
//     }
//
//     if (!server_info.hasOwnProperty('allow_user_search_by_email')) {
//         server_info['allow_user_search_by_email'] = false;
//     }
//
//     storage.upsert('config', {key: 'server_info', value: server_info});
//     storage.upsert('config', {key: 'server_verify_key', value: verify_key});
//     storage.upsert('config', {key: 'user_username', value: username});
//     storage.upsert('config', {key: 'server', value: server});
//
//     session_keys = cryptoLibrary.generate_public_private_keypair();
//
//     const onError = function(response){
//
//         // in case of any error we remove the items we already added to our storage
//         // maybe we adjust this behaviour at some time
//         storage.remove('config', storage.find_key('config', 'user_username'));
//         storage.remove('config', storage.find_key('config', 'server'));
//         storage.save();
//
//         return Promise.reject({
//             response:"error",
//             error_data: response.data
//         });
//     };
//
//     const onSuccess = function (response) {
//         return handle_login_response(response, password, session_keys, server_info['public_key']);
//     };
//
//     const login_info = {
//         'username': username,
//         'authkey': authkey,
//         'device_time': new Date().toISOString(),
//         'device_fingerprint': device.get_device_fingerprint(),
//         'device_description': device.get_device_description()
//     };
//
//     if (send_plain) {
//         login_info['password'] = password;
//     }
//
//     login_info = JSON.stringify(login_info);
//
//     // encrypt the login infos
//     const login_info_enc = cryptoLibrary.encrypt_data_public_key(
//         login_info,
//         server_info['public_key'],
//         session_keys.private_key
//     );
//
//
//     let session_duration = 24*60*60;
//     if (trust_device) {
//         session_duration = 24*60*60*30;
//     }
//
//     return apiClient.login(login_info_enc['text'], login_info_enc['nonce'], session_keys.public_key, session_duration)
//         .then(onSuccess, onError);
// };
//
// /**
//  * Ajax POST request to the backend to initiate the saml login request
//  *
//  * @param {object} provider The provider config
//  * @param {boolean|undefined} remember Remember the username and server
//  * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
//  * @param {object} server The server object to send the login request to
//  * @param {object} server_info Some info about the server including its public key
//  * @param {object} verify_key The signature of the server
//  *
//  * @returns {Promise} Returns a promise with the login status
//  */
// function samlInitiateLogin(provider, remember, trust_device, server, server_info, verify_key) {
//
//     managerBase.delete_local_data();
//
//     if (remember) {
//         storage.upsert('persistent', {key: 'server', value: server});
//     } else {
//         if (storage.key_exists('persistent', 'username')) {
//             storage.remove('persistent', storage.find_key('persistent', 'username'));
//         }
//         if (storage.key_exists('persistent', 'server')) {
//             storage.remove('persistent', storage.find_key('persistent', 'server'));
//         }
//         storage.save();
//     }
//     storage.upsert('persistent', {key: 'trust_device', value: trust_device});
//
//     if (!server_info.hasOwnProperty('allowed_second_factors')) {
//         server_info['allowed_second_factors'] = ['yubikey_otp', 'google_authenticator', 'duo'];
//     }
//
//     if (!server_info.hasOwnProperty('allow_user_search_by_email')) {
//         server_info['allow_user_search_by_email'] = false;
//     }
//
//     storage.upsert('config', {key: 'server_info', value: server_info});
//     storage.upsert('config', {key: 'server_verify_key', value: verify_key});
//     // TODO
//     //storage.upsert('config', {key: 'user_username', value: username});
//     storage.upsert('config', {key: 'server', value: server});
//     storage.save();
//
//     const onError = function(response){
//
//         // in case of any error we remove the items we already added to our storage
//         // maybe we adjust this behaviour at some time
//         storage.remove('config', storage.find_key('config', 'server'));
//         storage.save();
//
//         return Promise.reject({
//             response:"error",
//             error_data: response.data
//         });
//     };
//
//     const onSuccess = function (response) {
//         return browserClient.launch_web_auth_flow(response.data.saml_redirect_url);
//     };
//
//     const return_to_url = browserClient.get_saml_return_to_url();
//
//     return apiClient.saml_initiate_login(provider['provider_id'], return_to_url)
//         .then(onSuccess, onError);
// };
//
// /**
//  * Ajax POST request to the backend to initiate the oidc login request
//  *
//  * @param {object} provider The provider config
//  * @param {boolean|undefined} remember Remember the username and server
//  * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
//  * @param {object} server The server object to send the login request to
//  * @param {object} server_info Some info about the server including its public key
//  * @param {object} verify_key The signature of the server
//  *
//  * @returns {Promise} Returns a promise with the login status
//  */
// function oidc_initiate_login(provider, remember, trust_device, server, server_info, verify_key) {
//
//     managerBase.delete_local_data();
//
//     if (remember) {
//         storage.upsert('persistent', {key: 'server', value: server});
//     } else {
//         if (storage.key_exists('persistent', 'username')) {
//             storage.remove('persistent', storage.find_key('persistent', 'username'));
//         }
//         if (storage.key_exists('persistent', 'server')) {
//             storage.remove('persistent', storage.find_key('persistent', 'server'));
//         }
//         storage.save();
//     }
//     storage.upsert('persistent', {key: 'trust_device', value: trust_device});
//
//     if (!server_info.hasOwnProperty('allowed_second_factors')) {
//         server_info['allowed_second_factors'] = ['yubikey_otp', 'google_authenticator', 'duo'];
//     }
//
//     if (!server_info.hasOwnProperty('allow_user_search_by_email')) {
//         server_info['allow_user_search_by_email'] = false;
//     }
//
//     storage.upsert('config', {key: 'server_info', value: server_info});
//     storage.upsert('config', {key: 'server_verify_key', value: verify_key});
//     // TODO
//     //storage.upsert('config', {key: 'user_username', value: username});
//     storage.upsert('config', {key: 'server', value: server});
//     storage.save();
//
//     const onError = function(response){
//
//         // in case of any error we remove the items we already added to our storage
//         // maybe we adjust this behaviour at some time
//         storage.remove('config', storage.find_key('config', 'server'));
//         storage.save();
//
//         return Promise.reject({
//             response:"error",
//             error_data: response.data
//         });
//     };
//
//     const onSuccess = function (response) {
//         return browserClient.launch_web_auth_flow(response.data.oidc_redirect_url);
//     };
//
//     const return_to_url = browserClient.get_oidc_return_to_url();
//
//     return apiClient.oidc_initiate_login(provider['provider_id'], return_to_url)
//         .then(onSuccess, onError);
// };
//
// /**
//  * The second step in the login process of the SAML login after the initialization and all the redirect juju
//  * of SAML
//  *
//  * @param {string} saml_token_id The id of the saml token
//  *
//  * @returns {Promise} Returns a promise with the login status
//  */
// function saml_login(saml_token_id) {
//
//     const login_info_obj = {
//         'saml_token_id': saml_token_id,
//         'device_time': new Date().toISOString(),
//         'device_fingerprint': device.get_device_fingerprint(),
//         'device_description': device.get_device_description()
//     };
//
//     const server_info = storage.find_key('config', 'server_info').value;
//
//     const login_info = JSON.stringify(login_info_obj);
//
//     session_keys = cryptoLibrary.generate_public_private_keypair();
//
//     // encrypt the login infos
//     const login_info_enc = cryptoLibrary.encrypt_data_public_key(
//         login_info,
//         server_info['public_key'],
//         session_keys.private_key
//     );
//
//     const onError = function(response){
//         return Promise.reject(response.data);
//     };
//
//     const onSuccess = function (response) {
//         const login_info_decrypted_json = cryptoLibrary.decrypt_data_public_key(response.data['login_info'], response.data['login_info_nonce'], server_info['public_key'], session_keys.private_key);
//         const login_info_decrypted = JSON.parse(login_info_decrypted_json);
//         const login_data_decrypted_json = cryptoLibrary.decrypt_data_public_key(login_info_decrypted['data'], login_info_decrypted['data_nonce'], login_info_decrypted['server_session_public_key'], session_keys.private_key);
//         const login_data_decrypted = JSON.parse(login_data_decrypted_json);
//
//         storage.upsert('config', {key: 'user_username', value: login_data_decrypted.user.username});
//         storage.upsert('config', {key: 'user_has_two_factor', value: login_data_decrypted['required_multifactors'].length > 0});
//         token = login_data_decrypted.token;
//         session_secret_key = login_data_decrypted.session_secret_key;
//         user_sauce = login_data_decrypted.user.user_sauce;
//         user_public_key = login_data_decrypted.user.public_key;
//         session_password = login_data_decrypted.password;
//
//         // decrypt user private key
//         user_private_key = cryptoLibrary.decrypt_secret(
//             login_data_decrypted.user.private_key,
//             login_data_decrypted.user.private_key_nonce,
//             login_data_decrypted.password,
//             user_sauce
//         );
//
//         // decrypt the user_validator
//         const user_validator = cryptoLibrary.decrypt_data_public_key(
//             login_data_decrypted.user_validator,
//             login_data_decrypted.user_validator_nonce,
//             login_info_decrypted['server_session_public_key'],
//             user_private_key
//         );
//
//         // encrypt the validator as verification
//         verification = cryptoLibrary.encrypt_data(
//             user_validator,
//             session_secret_key
//         );
//
//         required_multifactors = login_data_decrypted['required_multifactors'];
//
//         return required_multifactors;
//     };
//
//     const session_duration = 24*60*60;
//
//     return apiClient.saml_login(login_info_enc['text'], login_info_enc['nonce'], session_keys.public_key, session_duration)
//         .then(onSuccess, onError);
// };
//
// /**
//  * The second step in the login process of the OIDC login after the initialization and all the redirect juju
//  * of OIDC
//  *
//  * @param {string} oidc_token_id The id of the oidc token
//  *
//  * @returns {Promise} Returns a promise with the login status
//  */
// function oidc_login(oidc_token_id) {
//
//     const login_info_obj = {
//         'oidc_token_id': oidc_token_id,
//         'device_time': new Date().toISOString(),
//         'device_fingerprint': device.get_device_fingerprint(),
//         'device_description': device.get_device_description()
//     };
//
//     const server_info = storage.find_key('config', 'server_info').value;
//
//     const login_info = JSON.stringify(login_info_obj);
//
//     session_keys = cryptoLibrary.generate_public_private_keypair();
//
//     // encrypt the login infos
//     const login_info_enc = cryptoLibrary.encrypt_data_public_key(
//         login_info,
//         server_info['public_key'],
//         session_keys.private_key
//     );
//
//     const onError = function(response){
//         return Promise.reject(response.data);
//     };
//
//     const onSuccess = function (response) {
//         const login_info_decrypted_json = cryptoLibrary.decrypt_data_public_key(response.data['login_info'], response.data['login_info_nonce'], server_info['public_key'], session_keys.private_key);
//         const login_info_decrypted = JSON.parse(login_info_decrypted_json);
//         const login_data_decrypted_json = cryptoLibrary.decrypt_data_public_key(login_info_decrypted['data'], login_info_decrypted['data_nonce'], login_info_decrypted['server_session_public_key'], session_keys.private_key);
//         const login_data_decrypted = JSON.parse(login_data_decrypted_json);
//
//         storage.upsert('config', {key: 'user_username', value: login_data_decrypted.user.username});
//         storage.upsert('config', {key: 'user_has_two_factor', value: login_data_decrypted['required_multifactors'].length > 0});
//         token = login_data_decrypted.token;
//         session_secret_key = login_data_decrypted.session_secret_key;
//         user_sauce = login_data_decrypted.user.user_sauce;
//         user_public_key = login_data_decrypted.user.public_key;
//         session_password = login_data_decrypted.password;
//
//         // decrypt user private key
//         user_private_key = cryptoLibrary.decrypt_secret(
//             login_data_decrypted.user.private_key,
//             login_data_decrypted.user.private_key_nonce,
//             login_data_decrypted.password,
//             user_sauce
//         );
//
//         // decrypt the user_validator
//         const user_validator = cryptoLibrary.decrypt_data_public_key(
//             login_data_decrypted.user_validator,
//             login_data_decrypted.user_validator_nonce,
//             login_info_decrypted['server_session_public_key'],
//             user_private_key
//         );
//
//         // encrypt the validator as verification
//         verification = cryptoLibrary.encrypt_data(
//             user_validator,
//             session_secret_key
//         );
//
//         required_multifactors = login_data_decrypted['required_multifactors'];
//
//         return required_multifactors;
//     };
//
//     const session_duration = 24*60*60;
//
//     return apiClient.oidc_login(login_info_enc['text'], login_info_enc['nonce'], session_keys.public_key, session_duration)
//         .then(onSuccess, onError);
// };
//
// /**
//  * Ajax POST request to destroy the token and logout the user
//  *
//  * @returns {Promise} Returns a promise with the logout status
//  */
// function () logout{
//
//     Raven.setUserContext();
//
//     const onSuccess = function () {
//
//         managerBase.delete_local_data();
//         browserClient.emit("logout", null);
//
//         return {
//             response:"success"
//         };
//     };
//
//     const onError = function(){
//         //session expired, so lets delete the data anyway
//
//         managerBase.delete_local_data();
//         browserClient.emit("logout", null);
//
//         return {
//             response:"success"
//         };
//     };
//
//     if (managerBase.get_token() === null) {
//         return new Promise(function(resolve) {
//             return resolve(onSuccess());
//         });
//     }
//
//     return apiClient.logout(managerBase.get_token(), managerBase.get_session_secret_key())
//         .then(onSuccess, onError);
// };
//
// $rootScope.$on('force_logout', function() {
//     managerBase.delete_local_data();
//     browserClient.emit("logout", null);
// });
//
// /**
//  * Update user base settings
//  *
//  * @param {email} email The email of the user
//  * @param {string} authkey The new authkey of the user
//  * @param {string} authkey_old The old authkey of the user
//  * @param {string} private_key The encrypted private key of the user (hex format)
//  * @param {string} private_key_nonce The nonce of the private key (hex format)
//  * @param {string} secret_key The encrypted secret key of the user (hex format)
//  * @param {string} secret_key_nonce The nonce of the secret key (hex format)
//  *
//  * @returns {Promise} Returns a promise with the update status
//  */
// function update_user(email, authkey, authkey_old, private_key, private_key_nonce, secret_key,
//                           secret_key_nonce) {
//     return apiClient.update_user(managerBase.get_token(), managerBase.get_session_secret_key(), email, authkey,
//         authkey_old, private_key, private_key_nonce, secret_key, secret_key_nonce);
// };
//
// /**
//  * Encrypts the recovery data and sends it to the server.
//  *
//  * @returns {Promise} Returns a promise with the username, recovery_code_id and private_key to decrypt the saved data
//  */
// function recovery_generate_information() {
//
//
//
//     const recovery_password = cryptoLibrary.generate_recovery_code();
//     const recovery_authkey = cryptoLibrary.generate_authkey(managerBase.find_key_nolimit('config', 'user_username'), recovery_password['base58']);
//     const recovery_sauce = cryptoLibrary.generate_user_sauce();
//
//     const recovery_data_dec = {
//         'user_private_key': managerBase.find_key_nolimit('config', 'user_private_key'),
//         'user_secret_key': managerBase.find_key_nolimit('config', 'user_secret_key')
//     };
//
//     const recovery_data = cryptoLibrary.encrypt_secret(JSON.stringify(recovery_data_dec), recovery_password['base58'], recovery_sauce);
//
//     const onSuccess = function(data) {
//         return {
//             'username': managerBase.find_key('config', 'user_username'),
//             'recovery_password': helper.split_string_in_chunks(recovery_password['base58_checksums'], 13).join('-'),
//             'recovery_words': recovery_password['words'].join(' ')
//         };
//     };
//
//     return apiClient.write_recoverycode(managerBase.get_token(), managerBase.get_session_secret_key(),
//         recovery_authkey, recovery_data.text, recovery_data.nonce, recovery_sauce)
//         .then(onSuccess);
// };
//
// /**
//  * Ajax POST request to destroy the token and recovery_enable the user
//  *
//  * @param {string} username The username of the user
//  * @param {string} recovery_code The recovery code in base58 format
//  * @param {string} server The server to send the recovery code to
//  *
//  * @returns {Promise} Returns a promise with the recovery_enable status
//  */
// function recovery_enable(username, recovery_code, server) {
//
//     storage.upsert('config', {key: 'user_username', value: username});
//     storage.upsert('config', {key: 'server', value: server});
//
//     const onSuccess = function (data) {
//
//         const recovery_data = JSON.parse(cryptoLibrary.decrypt_secret(data.data.recovery_data, data.data.recovery_data_nonce, recovery_code, data.data.recovery_sauce));
//
//         return {
//             'user_private_key': recovery_data.user_private_key,
//             'user_secret_key': recovery_data.user_secret_key,
//             'user_sauce': data.data.user_sauce,
//             'verifier_public_key': data.data.verifier_public_key,
//             'verifier_time_valid': data.data.verifier_time_valid
//         }
//     };
//     const recovery_authkey = cryptoLibrary.generate_authkey(username, recovery_code);
//
//     return apiClient.enable_recoverycode(username, recovery_authkey)
//         .then(onSuccess);
// };
//
// /**
//  * Ajax POST request to activate the emergency code
//  *
//  * @param {string} username The username of the user
//  * @param {string} emergency_code The emergency code in base58 format
//  * @param {string} server The server to send the recovery code to
//  * @param {object} server_info Some info about the server including its public key
//  * @param {object} verify_key The signature of the server
//  *
//  * @returns {Promise} Returns a promise with the emergency code activation status
//  */
// function arm_emergency_code(username, emergency_code, server, server_info, verify_key) {
//
//     storage.upsert('config', {key: 'user_username', value: username});
//     storage.upsert('config', {key: 'server', value: server});
//
//     const emergency_authkey = cryptoLibrary.generate_authkey(username, emergency_code);
//
//     const onSuccess = function (data) {
//
//         if (data.data.status === 'started' || data.data.status === 'waiting') {
//             return data.data
//         }
//
//         const emergency_data = JSON.parse(cryptoLibrary.decrypt_secret(data.data.emergency_data, data.data.emergency_data_nonce, emergency_code, data.data.emergency_sauce));
//
//         storage.upsert('config', {key: 'user_private_key', value: emergency_data.user_private_key});
//         storage.upsert('config', {key: 'user_secret_key', value: emergency_data.user_secret_key});
//         storage.upsert('config', {key: 'user_sauce', value: data.data.user_sauce});
//
//         const session_key = cryptoLibrary.generate_public_private_keypair();
//
//         const login_info = JSON.stringify({
//             'device_time': new Date().toISOString(),
//             'device_fingerprint': device.get_device_fingerprint(),
//             'device_description': device.get_device_description(),
//             'session_public_key': session_key.public_key
//
//         });
//
//         const update_request_enc = cryptoLibrary.encrypt_data_public_key(login_info, data.data.verifier_public_key, emergency_data.user_private_key);
//
//         const onSuccess = function (data) {
//
//             const login_info = JSON.parse(cryptoLibrary.decrypt_data_public_key(data.data.login_info, data.data.login_info_nonce, server_info['public_key'], session_key.private_key));
//
//             storage.upsert('config', {key: 'server_info', value: server_info});
//             storage.upsert('config', {key: 'server_verify_key', value: verify_key});
//             storage.upsert('config', {key: 'user_id', value: login_info.user_id});
//             storage.upsert('config', {key: 'user_token', value: login_info.token});
//             storage.upsert('config', {key: 'user_email', value: login_info.user_email});
//             storage.upsert('config', {key: 'session_secret_key', value: login_info.session_secret_key});
//             storage.upsert('config', {key: 'user_public_key', value: login_info.user_public_key});
//
//             storage.save();
//
//             return {
//                 'status': 'active'
//             };
//         };
//
//         const onError = function(data){
//             return Promise.reject(data);
//         };
//
//         return apiClient.activate_emergency_code(username, emergency_authkey, update_request_enc.text, update_request_enc.nonce)
//             .then(onSuccess, onError);
//     };
//
//     return apiClient.arm_emergency_code(username, emergency_authkey)
//         .then(onSuccess);
// };
//
// /**
//  * Encrypts the recovered data with the new password and initiates the save of this data
//  *
//  * @param {string} username the account's username e.g dummy@example.com
//  * @param {string} recovery_code The recovery code in base58 format
//  * @param {string} password The new password
//  * @param {string} user_private_key The user's private key
//  * @param {string} user_secret_key The user's secret key
//  * @param {string} user_sauce The user's user_sauce
//  * @param {string} verifier_public_key The "verifier" one needs, that the server accepts this new password
//  *
//  * @returns {Promise} Returns a promise with the set_password status
//  */
// function set_password(username, recovery_code, password, user_private_key, user_secret_key, user_sauce, verifier_public_key) {
//
//     const priv_key_enc = cryptoLibrary.encrypt_secret(user_private_key, password, user_sauce);
//     const secret_key_enc = cryptoLibrary
//         .encrypt_secret(user_secret_key, password, user_sauce);
//
//     const update_request = JSON.stringify({
//         authkey: cryptoLibrary.generate_authkey(username, password),
//         private_key: priv_key_enc.text,
//         private_key_nonce: priv_key_enc.nonce,
//         secret_key: secret_key_enc.text,
//         secret_key_nonce: secret_key_enc.nonce
//     });
//
//     const update_request_enc = cryptoLibrary.encrypt_data_public_key(update_request, verifier_public_key, user_private_key);
//
//     const onSuccess = function (data) {
//         return data;
//     };
//
//     const onError = function(data){
//         return data;
//     };
//
//     const recovery_authkey = cryptoLibrary.generate_authkey(username, recovery_code);
//
//     return apiClient.set_password(username, recovery_authkey, update_request_enc.text, update_request_enc.nonce)
//         .then(onSuccess, onError);
// };

/**
 * Sets the "path" attribute for all folders and items
 *
 * @param datastore
 * @param parent_path
 */
function updatePathsRecursive(datastore, parent_path) {
    return datastoreService.updatePathsRecursive(datastore, parent_path);
}

/**
 * Returns the user datastore. In addition this function triggers the generation of the local datastore
 * storage to
 *
 * @returns {Promise} Returns a promise with the user datastore
 */
function getUserDatastore() {
    const type = "user";
    const description = "default";

    const onSuccess = function (datastore) {
        datastoreService.updateShareRightsOfFoldersAndItems(datastore, {
            read: true,
            write: true,
            grant: true,
            delete: true,
        });
        updatePathsRecursive(datastore, []);

        return datastore;
    };
    const onError = function () {
        // pass
    };

    return datastoreService.getDatastore(type).then(onSuccess, onError);
}

/**
 * Alias for get_password_datastore
 *
 * @param {uuid} id The id of the datastore
 *
 * @returns {Promise} Returns a promise with the datastore
 */
function getDatastoreWithId(id) {
    return getUserDatastore();
}

/**
 * searches the user datastore for a user, based on the id or email
 *
 * @param {uuid|undefined} [userId] (optional) userId to search for
 * @param {email|undefined} [email] (optional) email to search for
 * @returns {Promise} Returns a promise with the user
 */
function searchUserDatastore(userId, email) {
    const onSuccess = function (userDataStore) {
        const users = [];
        let idMatch = null;
        let emailMatch = null;

        helper.createList(userDataStore, users);

        for (let i = users.length - 1; i >= 0; i--) {
            if (users[i].data.user_id === userId) {
                idMatch = users[i];
            }
            if (users[i].data.user_email === email) {
                emailMatch = users[i];
            }
        }

        if (idMatch === null && emailMatch === null) {
            // no match found
            return null;
        } else if (idMatch !== null && emailMatch !== null && idMatch.id === emailMatch.id) {
            // id match and email match is the same user
            return idMatch;
        } else if (idMatch !== null) {
            // only idMatch is set
            return idMatch;
        } else if (emailMatch !== null) {
            // only emailMatch is set
            return emailMatch;
        } else {
            // no match found, or id and email match are different
            return null;
        }
    };
    const onError = function () {
        // pass
    };

    return getUserDatastore().then(onSuccess, onError);
}

/**
 * Updates the local storage and triggers the 'saveDatastoreContent' to reflect the changes
 *
 * @param {TreeObject} datastore The datastore tree
 */
function handleDatastoreContentChanged(datastore) {
    // don't do anything
}

/**
 * Saves the user datastore with given content
 *
 * @param {TreeObject} content The real object you want to encrypt in the datastore
 * @param {Array} paths The list of paths to the changed elements
 * @returns {Promise} Promise with the status of the save
 */
function saveDatastoreContent(content, paths) {
    const type = "user";
    const description = "default";

    content = datastoreService.filterDatastoreContent(content);

    return datastoreService.saveDatastoreContent(type, description, content);
}

/**
 * searches a user in the database according to his username
 *
 * @param {string} [username] (optional) The username to search
 * @param {string} [email] (optional) The email to search
 * @returns {Promise} Returns a promise with the user information
 */
function searchUser(username, email) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    return apiClient.searchUser(token, sessionSecretKey, undefined, username, email);
}

/**
 * Adds a new user to the datastore
 *
 * @param {TreeObject} userDatastore The content of the existing user datastore
 * @param {object} userObject The user object
 * @param {TreeObject} [targetParent] (optional) The potential parent to add the user to
 * @returns {Promise} Returns a promise with the user information
 */
function addUserToDatastore(userDatastore, userObject, targetParent) {
    let parent;
    if (targetParent) {
        parent = targetParent;
    } else {
        parent = userDatastore;
    }
    if (typeof parent.items === "undefined") {
        parent.items = [];
    }

    // check if we do not already have the user in our trusted user datastore
    // skip if we already have it
    const existingLocations = datastorePasswordService.searchInDatastore(userObject, userDatastore, function (a, b) {
        if (!a.hasOwnProperty("data")) {
            return false;
        }
        if (!b.hasOwnProperty("data")) {
            return false;
        }
        if (!a["data"].hasOwnProperty("user_public_key")) {
            return false;
        }
        if (!b["data"].hasOwnProperty("user_public_key")) {
            return false;
        }
        return a["data"]["user_public_key"] === b["data"]["user_public_key"];
    });

    if (existingLocations.length < 1) {
        parent.items.push(userObject);
        datastoreService.updateShareRightsOfFoldersAndItems(userDatastore, {
            read: true,
            write: true,
            grant: true,
            delete: true,
        });
        return saveDatastoreContent(userDatastore);
    }
}

// /**
//  * creates a google authenticator
//  *
//  * @param {string} title The title of the TOTP
//  *
//  * @returns {Promise} Returns a promise with the user information
//  */
// function create_ga(title) {
//
//     const onSuccess = function (request) {
//
//         const server = storage.find_key('config', 'server');
//         const backend = server['value']['url'];
//         const parsed_url = helper.parse_url(backend);
//
//         return {
//             'id': request.data['id'],
//             'uri': 'otpauth://totp/' + parsed_url['top_domain'] + ':' + managerBase.find_key_nolimit('config', 'user_username')+'?secret=' + request.data['secret']
//         };
//
//     };
//     const onError = function () {
//         // pass
//     };
//     return apiClient.create_ga(managerBase.get_token(), managerBase.get_session_secret_key(), title)
//         .then(onSuccess, onError)
// };
//
// /**
//  * Gets a list of all active google authenticators
//  *
//  * @returns {Promise} Returns a promise with a list of all google authenticators
//  */
// function read_ga() {
//
//
//     const onSuccess = function (request) {
//
//         return request.data['google_authenticators'];
//
//     };
//     const onError = function () {
//         // pass
//     };
//     return apiClient.read_ga(managerBase.get_token(), managerBase.get_session_secret_key())
//         .then(onSuccess, onError)
// };
//
// /**
//  * Activates a given Google authenticator
//  *
//  * @param {uuid} google_authenticator_id The google authenticator ID
//  * @param {string} google_authenticator_token One google authenticator code
//  *
//  * @returns {Promise} Returns a promise with true or false
//  */
// function activate_ga(google_authenticator_id, google_authenticator_token) {
//     const onSuccess = function () {
//         storage.upsert('config', {key: 'user_has_two_factor', value: true});
//         emit('two_fa_activate', true);
//         return true;
//     };
//     const onError = function () {
//         return false;
//     };
//     return apiClient.activate_ga(managerBase.get_token(), managerBase.get_session_secret_key(), google_authenticator_id, google_authenticator_token)
//         .then(onSuccess, onError)
// };
//
// /**
//  * Deletes a given Google authenticator
//  *
//  * @param {string} ga_id The google authenticator ID
//  *
//  * @returns {Promise} Returns a promise with true or false
//  */
// function delete_ga(ga_id) {
//     const onSuccess = function () {
//         return true;
//     };
//     const onError = function (data) {
//         return Promise.reject(data.data)
//     };
//     return apiClient.delete_ga(managerBase.get_token(), managerBase.get_session_secret_key(), ga_id)
//         .then(onSuccess, onError)
// };
//
// /**
//  * creates a duo
//  *
//  * @param {boolean} use_system_wide_duo Wether to use the system wide duo or not
//  * @param {string} title The title of the duo
//  * @param {string} integration_key The integration_key of the duo
//  * @param {string} secret_key The secret_key of the duo
//  * @param {string} host The host of the duo
//  *
//  * @returns {Promise} Returns a promise with the user information
//  */
// function create_duo(use_system_wide_duo, title, integration_key, secret_key, host) {
//
//     const onSuccess = function (request) {
//
//         return {
//             'id': request.data['id'],
//             'uri': request.data['activation_code']
//         };
//
//     };
//     const onError = function (request) {
//         return Promise.reject(request.data);
//     };
//
//     return apiClient.create_duo(managerBase.get_token(), managerBase.get_session_secret_key(), use_system_wide_duo, title, integration_key, secret_key, host)
//         .then(onSuccess, onError)
// };
//
// /**
//  * Gets a list of all active duos
//  *
//  * @returns {Promise} Returns a promise with a list of all duos
//  */
// function read_duo() {
//
//
//     const onSuccess = function (request) {
//
//         return request.data['duos'];
//
//     };
//     const onError = function () {
//         // pass
//     };
//     return apiClient.read_duo(managerBase.get_token(), managerBase.get_session_secret_key())
//         .then(onSuccess, onError)
// };
//
// /**
//  * Activates a given Google authenticator
//  *
//  * @param {uuid} duo_id The duo ID
//  * @param {string} [duo_token] (optional) One Duo token
//  *
//  * @returns {Promise} Returns a promise with true or false
//  */
// function activate_duo(duo_id, duo_token) {
//     const onSuccess = function () {
//         storage.upsert('config', {key: 'user_has_two_factor', value: true});
//         emit('two_fa_activate', true);
//         return true;
//     };
//     const onError = function () {
//         return false;
//     };
//     return apiClient.activate_duo(managerBase.get_token(), managerBase.get_session_secret_key(), duo_id, duo_token)
//         .then(onSuccess, onError)
// };
//
// /**
//  * Deletes a given Google authenticator
//  *
//  * @param {string} duo_id The duo ID
//  *
//  * @returns {Promise} Returns a promise with true or false
//  */
// function delete_duo(duo_id) {
//     const onSuccess = function () {
//         return true;
//     };
//     const onError = function (data) {
//         return Promise.reject(data.data)
//     };
//     return apiClient.delete_duo(managerBase.get_token(), managerBase.get_session_secret_key(), duo_id)
//         .then(onSuccess, onError)
// };
//
// /**
//  * creates a yubikey otp
//  *
//  * @param {string} title The title of the YubiKey OTP
//  * @param {string} otp One YubikeKey OTP Code
//  *
//  * @returns {Promise} Returns a promise with the user information
//  */
// function create_yubikey_otp(title, otp) {
//
//     const onSuccess = function (request) {
//         storage.upsert('config', {key: 'user_has_two_factor', value: true});
//         storage.save();
//         emit('two_fa_activate', true);
//         return {
//             'id': request.data['id']
//         };
//
//     };
//     const onError = function () {
//         // pass
//     };
//     return apiClient.create_yubikey_otp(managerBase.get_token(), managerBase.get_session_secret_key(), title, otp)
//         .then(onSuccess, onError)
// };
//
// /**
//  * Gets a list of all active yubikey otps
//  *
//  * @returns {Promise} Returns a promise with a list of all yubikey otps
//  */
// function read_yubikey_otp() {
//
//     const onSuccess = function (request) {
//
//         return request.data['yubikey_otps'];
//
//     };
//     const onError = function () {
//         // pass
//     };
//     return apiClient.read_yubikey_otp(managerBase.get_token(), managerBase.get_session_secret_key())
//         .then(onSuccess, onError)
// };
//
// /**
//  * Activates a given YubiKey OTP
//  *
//  * @param {uuid} yubikey_id Yubikey ID
//  * @param {string} yubikey_otp One YubiKey COde
//  *
//  * @returns {Promise} Returns a promise with true or false
//  */
// function activate_yubikey_otp(yubikey_id, yubikey_otp) {
//     const onSuccess = function () {
//         storage.upsert('config', {key: 'user_has_two_factor', value: true});
//         emit('two_fa_activate', true);
//         return true;
//     };
//     const onError = function () {
//         return false;
//     };
//     return apiClient.activate_yubikey_otp(managerBase.get_token(), managerBase.get_session_secret_key(), yubikey_id, yubikey_otp)
//         .then(onSuccess, onError)
// };
//
// /**
//  * Deletes a given YubiKey OTP
//  *
//  * @param {string} yubikey_otp_id Yubikey OTP ID
//  *
//  * @returns {Promise} Returns a promise with true or false
//  */
// function delete_yubikey_otp(yubikey_otp_id) {
//     const onSuccess = function () {
//         return true;
//     };
//     const onError = function (data) {
//         return Promise.reject(data.data)
//     };
//     return apiClient.delete_yubikey_otp(managerBase.get_token(), managerBase.get_session_secret_key(), yubikey_otp_id)
//         .then(onSuccess, onError)
// };
//
// /**
//  * loads the sessions
//  *
//  * @returns {Promise} Returns a promise with the sessions
//  */
// function get_sessions() {
//
//     const onSuccess = function (request) {
//         return request.data['sessions'];
//
//     };
//     const onError = function () {
//         // pass
//     };
//     return apiClient.get_sessions(managerBase.get_token(), managerBase.get_session_secret_key())
//         .then(onSuccess, onError)
// };
//
// /**
//  * Returns a list of configured emergency codes
//  *
//  * @returns {Promise} Returns a promise with the emergency codes
//  */
// function read_emergency_codes() {
//
//     const onSuccess = function (request) {
//         return request.data['emegency_codes'];
//
//     };
//     const onError = function () {
//         // pass
//     };
//     return apiClient.read_emergency_codes(managerBase.get_token(), managerBase.get_session_secret_key())
//         .then(onSuccess, onError)
// };
//
// /**
//  * Creates the emergency code. Will
//  *
//  * @param {string} title The title of the emergency code
//  * @param {string} lead_time The lead time till someone can activate this code in seconds
//  *
//  * @returns {Promise} Returns a promise with the emergency code
//  */
// function create_emergency_code(title, lead_time) {
//
//     const emergency_password = cryptoLibrary.generate_recovery_code();
//     const emergency_authkey = cryptoLibrary.generate_authkey(managerBase.find_key_nolimit('config', 'user_username'), emergency_password['base58']);
//     const emergency_sauce = cryptoLibrary.generate_user_sauce();
//
//     const emergency_data_dec = {
//         'user_private_key': managerBase.find_key_nolimit('config', 'user_private_key'),
//         'user_secret_key': managerBase.find_key_nolimit('config', 'user_secret_key')
//     };
//
//     const emergency_data = cryptoLibrary.encrypt_secret(JSON.stringify(emergency_data_dec), emergency_password['base58'], emergency_sauce);
//
//     const onSuccess = function (request) {
//         return {
//             'username': managerBase.find_key('config', 'user_username'),
//             'emergency_password': helper.split_string_in_chunks(emergency_password['base58_checksums'], 13).join('-'),
//             'emergency_words': emergency_password['words'].join(' ')
//         };
//
//     };
//     const onError = function (request) {
//         return Promise.reject(request.data);
//     };
//     return apiClient.create_emergency_code(managerBase.get_token(), managerBase.get_session_secret_key(), title,
//         lead_time, emergency_authkey, emergency_data.text, emergency_data.nonce, emergency_sauce)
//         .then(onSuccess, onError)
// };
//
// /**
//  * Deletes an emergency code
//  *
//  * @param {string} emergency_code_id The id of the emergency code to delete
//  *
//  * @returns {Promise} Returns a promise with true or false
//  */
// function delete_emergency_code(emergency_code_id) {
//
//     const onSuccess = function (request) {
//         // pass
//     };
//     const onError = function () {
//         // pass
//     };
//     return apiClient.delete_emergency_code(managerBase.get_token(), managerBase.get_session_secret_key(), emergency_code_id)
//         .then(onSuccess, onError)
// };
//
// /**
//  * Returns the user email address
//  *
//  * @returns {string|null} Returns the users email address or null
//  */
// function get_email() {
//     return storage.find_key('config', 'user_email').value;
// };
//
// /**
//  * Returns the user authentication method
//  *
//  * @returns {string} Returns the users authentication method
//  */
// function get_authentication() {
//     const user_authentication = storage.find_key('config', 'user_authentication');
//     if (user_authentication === null) {
//         return 'AUTHKEY';
//     } else {
//         return user_authentication.value;
//     }
// };
//
// /**
//  * Deletes an sessions
//  *
//  * @param {string} session_id The id of the session to delete
//  *
//  * @returns {Promise} Returns a promise with true or false
//  */
// function delete_session(session_id) {
//
//     const onSuccess = function (request) {
//         // pass
//     };
//     const onError = function () {
//         // pass
//     };
//     return apiClient.logout(managerBase.get_token(), managerBase.get_session_secret_key(), session_id)
//         .then(onSuccess, onError)
// };
//
// /**
//  * Deletes all sessions besides the current one
//  *
//  * @returns {Promise} Returns a promise with the sessions
//  */
// function delete_other_sessions() {
//
//     const onSuccess = function (request) {
//
//         const sessions = request.data['sessions'];
//
//         for (let i = 0; i < sessions.length; i++) {
//             const session = sessions[i];
//             if (session.current_session) {
//                 continue;
//             }
//             delete_session(session.id);
//         }
//
//     };
//     const onError = function () {
//         // pass
//     };
//     return apiClient.get_sessions(managerBase.get_token(), managerBase.get_session_secret_key())
//         .then(onSuccess, onError)
// };
//
//
// /**
//  * Saves a new email
//  *
//  * @param {string} new_email The new email
//  * @param {string} verification_password The password for verification
//  *
//  * @returns {Promise} Returns a promise with the result
//  */
// xfunction save_new_email(new_email, verification_password) {
//
//     if (verification_password === null || verification_password.length === 0) {
//         return Promise.reject({errors: ['OLD_PASSWORD_REQUIRED']})
//     }
//
//     const authkey_old = cryptoLibrary.generate_authkey(storage.find_key('config', 'user_username').value, verification_password);
//
//     const onSuccess = function(data) {
//
//         storage.upsert('config', {key: 'user_email', value: new_email});
//         storage.save();
//         return {msgs: ['SAVE_SUCCESS']}
//     };
//     const onError = function() {
//         return Promise.reject({errors: ['OLD_PASSWORD_INCORRECT']})
//     };
//     return update_user(new_email, null, authkey_old)
//         .then(onSuccess, onError);
//
// };
//
// /**
//  * Saves a new password
//  *
//  * @param {string} new_password The new password
//  * @param {string} new_password_repeat The new password (repeated)
//  * @param {string} old_password The old password
//  *
//  * @returns {Promise} Returns a promise with the result
//  */
// function save_new_password(new_password, new_password_repeat, old_password) {
//
//     return managerHost.info()
//         .then(function(info) {
//             const authkey_old, new_authkey, user_private_key, user_secret_key, user_sauce, priv_key_enc, secret_key_enc, onSuccess, onError;
//             const test_error = helper.is_valid_password(new_password, new_password_repeat, info.data['decoded_info']['compliance_min_master_password_length'], info.data['decoded_info']['compliance_min_master_password_complexity']);
//             if (test_error) {
//                 return Promise.reject({errors: [test_error]})
//             }
//
//             if (old_password === null || old_password.length === 0) {
//                 return Promise.reject({errors: ['OLD_PASSWORD_REQUIRED']})
//             }
//
//             authkey_old = cryptoLibrary.generate_authkey(storage.find_key('config', 'user_username').value, old_password);
//
//             new_authkey = cryptoLibrary.generate_authkey(storage.find_key('config', 'user_username').value, new_password);
//             user_private_key = storage.find_key('config', 'user_private_key');
//             user_secret_key = storage.find_key('config', 'user_secret_key');
//             user_sauce = storage.find_key('config', 'user_sauce').value;
//
//             priv_key_enc = cryptoLibrary.encrypt_secret(user_private_key.value, new_password, user_sauce);
//             secret_key_enc = cryptoLibrary.encrypt_secret(user_secret_key.value, new_password, user_sauce);
//
//             onSuccess = function(data) {
//                 return {msgs: ['SAVE_SUCCESS']}
//             };
//             onError = function() {
//                 return Promise.reject({errors: ['OLD_PASSWORD_INCORRECT']})
//             };
//
//             return update_user(null, new_authkey, authkey_old, priv_key_enc.text, priv_key_enc.nonce, secret_key_enc.text, secret_key_enc.nonce)
//                 .then(onSuccess, onError);
//
//         }, function(data) {
//             console.log(data);
//             // handle server is offline
//             return Promise.reject({errors: ['SERVER_OFFLINE']});
//         });
//
// };
//
// /**
//  * Deletes an account
//  *
//  * @param {string} password The old password
//  *
//  * @returns {Promise} Returns a promise with the result
//  */
// function delete_account(password) {
//
//     const authkey = cryptoLibrary.generate_authkey(storage.find_key('config', 'user_username').value, password);
//
//     const onSuccess = function () {
//         logout();
//     };
//
//     const onError = function(data){
//         return Promise.reject(data.data);
//     };
//
//     let pass;
//     if (get_authentication() === 'LDAP') {
//         pass = password
//     }
//
//
//     return apiClient.delete_account(managerBase.get_token(), managerBase.get_session_secret_key(), authkey, pass).then(onSuccess, onError);
// };
//
// /**
//  * Allows the to select a known user (and add a new user to the trusted user list)
//  *
//  * @returns {Promise} Returns a promise with the selected user
//  */
// xfunction select_users() {
//
//     const deferred = $q.defer();
//
//     const modalInstance = $uibModal.open({
//         templateUrl: 'view/modal/select-user.html',
//         controller: 'ModalSelectUserCtrl',
//         size: 'lg',
//         backdrop: 'static',
//         resolve: {
//         }
//     });
//
//     modalInstance.result.then(function (data) {
//         // Someone selected a user
//         deferred.resolve(data);
//     }, function () {
//         // cancel triggered
//         deferred.resolve();
//     });
//
//     return deferred.promise;
// };
//
// /**
//  * Returns weather a system wide duo exists or not
//  *
//  * @returns Returns weather a system wide duo exists or not
//  */
// function() system_wide_duo_exists{
//
//     let system_wide_duo_exists = false;
//     if (storage.find_key('config', 'server_info').value.hasOwnProperty('system_wide_duo_exists')) {
//         system_wide_duo_exists = storage.find_key('config', 'server_info').value['system_wide_duo_exists'];
//     }
//
//     return system_wide_duo_exists;
// };
//
// shareBlueprint.register('search_user', search_user);

const datastoreUserService = {
    // on: on,
    // register: register,
    // activate_code: activateCode,
    // get_default: getDefault,
    // login: login,
    // saml_initiate_login: samlInitiateLogin,
    // oidc_initiate_login: oidc_initiate_login,
    // saml_login: saml_login,
    // oidc_login : oidc_login,
    // ga_verify: ga_verify,
    // duo_verify: duo_verify,
    // yubikey_otp_verify: yubikey_otp_verify,
    // activate_token: activate_token,
    // logout: logout,
    // recovery_enable: recovery_enable,
    // arm_emergency_code: arm_emergency_code,
    // set_password: set_password,
    // is_logged_in: is_logged_in,
    // require_two_fa_setup: require_two_fa_setup,
    // update_user: update_user,
    // recovery_generate_information: recovery_generate_information,
    getUserDatastore: getUserDatastore,
    getDatastoreWithId: getDatastoreWithId,
    searchUserDatastore: searchUserDatastore,
    handleDatastoreContentChanged: handleDatastoreContentChanged,
    saveDatastoreContent: saveDatastoreContent,
    searchUser: searchUser,
    addUserToDatastore: addUserToDatastore,
    // create_ga: create_ga,
    // read_ga: read_ga,
    // activate_ga: activate_ga,
    // delete_ga: delete_ga,
    // create_duo: create_duo,
    // read_duo: read_duo,
    // activate_duo: activate_duo,
    // delete_duo: delete_duo,
    // create_yubikey_otp: create_yubikey_otp,
    // read_yubikey_otp: read_yubikey_otp,
    // activate_yubikey_otp: activate_yubikey_otp,
    // delete_yubikey_otp: delete_yubikey_otp,
    // get_sessions: get_sessions,
    // read_emergency_codes : read_emergency_codes,
    // create_emergency_code : create_emergency_code,
    // delete_emergency_code : delete_emergency_code,
    // get_email: get_email,
    // get_authentication: get_authentication,
    // delete_session: delete_session,
    // delete_other_sessions: delete_other_sessions,
    // save_new_email: save_new_email,
    // save_new_password: save_new_password,
    // delete_account: delete_account,
    // select_users: select_users,
    // system_wide_duo_exists: system_wide_duo_exists,
};
export default datastoreUserService;
