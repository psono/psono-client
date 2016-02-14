(function(angular, uuid) {
    'use strict';

    var managerDatastorePassword = function($q, manager, managerDatastore, passwordGenerator, itemBlueprint, helper) {


        /**
         * Returns the password datastore. In addition this function triggers the generation of the local datastore
         * storage to
         *
         * @returns {promise}
         */
        var get_password_datastore = function() {
            var type = "password";
            var description = "default";


            var onSuccess = function (result) {

                managerDatastore.fill_storage('datastore-password-leafs', result, [
                    ['key', 'secret_id'],
                    ['secret_id', 'secret_id'],
                    ['value', 'secret_key'],
                    ['name', 'name'],
                    ['urlfilter', 'urlfilter'],
                    ['search', 'urlfilter']

                ]);

                return result
            };
            var onError = function () {
                // pass
            };

            return managerDatastore.get_datastore(type, description)
                .then(onSuccess, onError);
        };

        /**
         * Saves the password datastore with given content
         *
         * @param content The real object you want to encrypt in the datastore
         * @returns {promise}
         */
        var save_password_datastore = function (content) {
            var type = "password";
            var description = "default";

            // datastore has changed, so lets regenerate local lookup
            managerDatastore.fill_storage('datastore-password-leafs', content, [
                ['key', 'secret_id'],
                ['value', 'secret_key'],
                ['name', 'name'],
                ['urlfilter', 'urlfilter']
            ]);


            content = managerDatastore.filter_datastore_content(content);

            return managerDatastore.save_datastore(type, description, content)
        };

        /**
         * Generates a new password for a given url and saves the password in the datastore.
         * Returns a promise with the new password
         *
         * @returns {promise}
         */
        var generatePassword = function(url) {

            var password = passwordGenerator.generate();

            var parsed_url = helper.parse_url(url);

            var secret_object = {
                website_password_title: "Generated for " + parsed_url.authority,
                website_password_url: url,
                website_password_username: "",
                website_password_password: password,
                website_password_notes: "",
                website_password_auto_submit: false,
                website_password_url_filter: parsed_url.authority
            };

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(e) {

                get_password_datastore()
                    .then(function (data) {

                        var datastore_object = {
                            id: uuid.v4(),
                            type: 'website_password',
                            name: "Generated for " + parsed_url.authority,
                            urlfilter: parsed_url.authority,
                            secret_id: e.secret_id,
                            secret_key: e.secret_key
                        };

                        data.items.push(datastore_object);
                        save_password_datastore(data);
                    });
            };

            manager.create_secret(secret_object)
                .then(onSuccess, onError);

            // we return a promise. So far its
            // , but we do not yet have a proper error handling and returning
            // a promise might make it easier later to wait for the errors
            return $q(function (resolve) {
                resolve(password);
            });
        };

        /**
         * Generates a password for the active tab
         *
         * @returns {promise}
         */
        var generatePasswordActiveTab = function() {

            var onError = function() {
                alert("could not find out the url of the active tab");
            };

            var onSuccess = function(url) {


                var onError = function(result) {
                    //pass
                };
                var onSuccess = function(password) {

                    browserClient.emitSec('fillpassword-active-tab', {password: password});

                    return password;
                };

                return generatePassword(url)
                    .then(onSuccess, onError);

            };

            return browserClient.getActiveTabUrl()
                .then(onSuccess, onError);

        };

        itemBlueprint.register('generate', passwordGenerator.generate);

        return {
            get_password_datastore: get_password_datastore,
            save_password_datastore: save_password_datastore,
            generatePassword: generatePassword,
            generatePasswordActiveTab: generatePasswordActiveTab
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("managerDatastorePassword", ['$q', 'manager', 'managerDatastore', 'passwordGenerator', 'itemBlueprint', 'helper', managerDatastorePassword]);

}(angular, uuid));