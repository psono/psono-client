(function(angular) {
    'use strict';

    var managerDatastoreUser = function($q, $rootScope, apiClient, browserClient, storage,
                                        helper, managerBase, managerDatastore, shareBlueprint,
                                        itemBlueprint, cryptoLibrary) {

        /**
         * Checks if the user is logged in.
         * Returns either true or false
         *
         * @return {boolean} is the user logged in
         */
        var is_logged_in = function () {
            var token = managerBase.get_token();
            return token !== null && token !== "";
        };

        /**
         * Ajax POST request to the backend with email and authkey for registration
         *
         * @param email
         * @param username
         * @param password
         * @param server server object
         *
         * @returns {promise} promise
         */
        var register = function(email, username, password, server) {

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
                browserClient.getBaseUrl())
                .then(onSuccess, onError);
        };

        /**
         * Activates a user account with the provided activation code
         *
         * @param activate_code
         * @param server
         *
         * @returns {promise}
         */
        var activate = function(activate_code, server) {

            storage.insert('config', {key: 'server', value: server});

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

            return apiClient.verify_email(activate_code)
                .then(onSuccess, onError);
        };

        /**
         * Ajax POST request to the backend with username and authkey for login, saves a token together with user_id
         * and all the different keys of a user in the apidata storage
         *
         * @param username
         * @param password
         * @param server server object
         *
         * @returns {promise} promise
         */
        var login = function(username, password, server) {

            managerBase.delete_local_data();

            var authkey = cryptoLibrary.generate_authkey(username, password);

            storage.insert('config', {key: 'user_username', value: username});
            storage.insert('config', {key: 'server', value: server});

            var session_keys = cryptoLibrary.generate_public_private_keypair();

            var onError = function(response){

                // in case of any error we remove the items we already added to our storage
                // maybe we adjust this behaviour at some time
                storage.remove('config', storage.find_one('config', {'key': 'user_username'}));
                storage.remove('config', storage.find_one('config', {'key': 'server'}));
                storage.save();

                return {
                    response:"error",
                    error_data: response.data
                };
            };

            var onSuccess = function (response) {

                // decrypt the session key
                var session_secret_key = cryptoLibrary.decrypt_data_public_key(
                    response.data.session_secret_key,
                    response.data.session_secret_key_nonce,
                    response.data.session_public_key,
                    session_keys.private_key
                );
                // no need anymore for the public / private session keys
                session_keys = null;

                // decrypt user private key
                var user_private_key = cryptoLibrary.decrypt_secret(
                    response.data.user.private_key,
                    response.data.user.private_key_nonce,
                    password,
                    response.data.user.user_sauce
                );

                // decrypt the user_validator
                var user_validator = cryptoLibrary.decrypt_data_public_key(
                    response.data.user_validator,
                    response.data.user_validator_nonce,
                    response.data.session_public_key,
                    user_private_key
                );

                // encrypt the validator as verification
                var verification = cryptoLibrary.encrypt_data(
                    user_validator,
                    session_secret_key
                );

                var onSuccess = function (activation_data) {

                    // decrypt user secret key
                    var user_secret_key = cryptoLibrary.decrypt_secret(
                        activation_data.data.user.secret_key,
                        activation_data.data.user.secret_key_nonce,
                        password,
                        response.data.user.user_sauce
                    );

                    storage.insert('config', {key: 'user_id', value: activation_data.data.user.id});
                    storage.insert('config', {key: 'user_token', value: response.data.token});
                    storage.insert('config', {key: 'user_email', value: activation_data.data.user.email});
                    storage.insert('config', {key: 'session_secret_key', value: session_secret_key});
                    storage.insert('config', {key: 'user_public_key', value: response.data.user.public_key});
                    storage.insert('config', {key: 'user_private_key', value: user_private_key});
                    storage.insert('config', {key: 'user_secret_key', value: user_secret_key});
                    storage.insert('config', {key: 'user_sauce', value: response.data.user.user_sauce});

                    storage.save();

                    return {
                        response:"success"
                    };

                };

                return apiClient.activate_token(response.data.token, verification.text, verification.nonce)
                    .then(onSuccess, onError);
            };

            return apiClient.login(username, authkey, session_keys.public_key)
                .then(onSuccess, onError);
        };

        /**
         * Ajax POST request to destroy the token and logout the user
         *
         * @returns {promise}
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
         * Update user base settings
         *
         * @param email
         * @param authkey
         * @param authkey_old
         * @param private_key
         * @param private_key_nonce
         * @param secret_key
         * @param secret_key_nonce
         * @param user_sauce
         *
         * @returns {promise}
         */
        var update_user = function(email, authkey, authkey_old, private_key, private_key_nonce, secret_key,
                                  secret_key_nonce, user_sauce) {
            return apiClient.update_user(managerBase.get_token(), managerBase.get_session_secret_key(), email, authkey,
                authkey_old, private_key, private_key_nonce, secret_key, secret_key_nonce, user_sauce);
        };

        /**
         * Returns the user datastore. In addition this function triggers the generation of the local datastore
         * storage to
         *
         * @returns {promise}
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
         * searches the user datastore for a user, based on the id or email
         *
         * @param [user_id] (optional) user_id to search for
         * @param [email] (optional) email to search for
         * @returns {promise}
         */
        var search_user_datastore = function(user_id, email) {


            var onSuccess = function (user_data_store) {

                var users = [];
                var id_match = null;
                var email_match = null;

                helper.create_list(user_data_store, users);

                for (var i = users.length - 1; i >= 0; i--) {

                    if (users[i].data.user_id == user_id) {
                        id_match = users[i];
                    }
                    if (users[i].data.user_email == email) {
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
         * Saves the user datastore with given content
         *
         * @param content The real object you want to encrypt in the datastore
         * @param paths The list of paths to the changed elements
         * @returns {promise}
         */
        var save_datastore = function (content, paths) {
            var type = "user";
            var description = "default";

            content = managerDatastore.filter_datastore_content(content);

            return managerDatastore.save_datastore(type, description, content)
        };

        /**
         * searches a user in the database according to his username
         *
         * @param username
         * @returns {promise}
         */
        var search_user = function(username) {

            return apiClient.get_users_public_key(managerBase.get_token(), managerBase.get_session_secret_key(), undefined, username);
        };

        shareBlueprint.register('search_user', search_user);
        itemBlueprint.register('get_user_datastore', get_user_datastore);

        return {
            register: register,
            activate: activate,
            login: login,
            logout: logout,
            is_logged_in: is_logged_in,
            update_user: update_user,
            get_user_datastore: get_user_datastore,
            search_user_datastore: search_user_datastore,
            save_datastore: save_datastore,
            search_user: search_user
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("managerDatastoreUser", ['$q', '$rootScope', 'apiClient', 'browserClient', 'storage',
        'helper', 'managerBase', 'managerDatastore', 'shareBlueprint',
        'itemBlueprint', 'cryptoLibrary', managerDatastoreUser]);

}(angular));