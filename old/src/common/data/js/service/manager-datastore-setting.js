(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerDatastoreSetting
     * @requires psonocli.storage
     * @requires psonocli.managerDatastore
     *
     * @description
     * Service to manage the setting datastore
     */

    var managerDatastoreSetting = function(storage, managerDatastore) {

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreSetting#get_settings_datastore
         * @methodOf psonocli.managerDatastoreSetting
         *
         * @description
         * Returns the settings datastore.
         *
         * @returns {promise} Returns the settings datastore
         */
        var get_settings_datastore = function() {
            var type = "settings";
            var description = "key-value-settings";

            var onSuccess = function (results) {
                for (var i = results.length - 1; i >= 0; i--) {
                    var s = storage.find_key('settings', results[i].key);
                    if (s !== null) {
                        s.value = results[i].value;
                        storage.update('settings', s);
                    } else {
                        storage.insert('settings', {key: results[i].key, value: results[i].value});
                    }
                }
                storage.save();

                return results
            };
            var onError = function () {
                // pass
            };
            return managerDatastore.get_datastore(type)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastoreSetting#save_settings_datastore
         * @methodOf psonocli.managerDatastoreSetting
         *
         * @description
         * Saves the settings datastore with given content
         *
         * @param {TreeObject} content The real object you want to encrypt in the datastore
         * @returns {promise} Promise with the status of the save
         */
        var save_settings_datastore = function (content) {
            var type = "settings";
            var description = "key-value-settings";

            return managerDatastore.save_datastore_content(type, description, content)
        };

        return {
            get_settings_datastore: get_settings_datastore,
            save_settings_datastore: save_settings_datastore
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerDatastoreSetting", ['storage', 'managerDatastore', managerDatastoreSetting]);

}(angular));
