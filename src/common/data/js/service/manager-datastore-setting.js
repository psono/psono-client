(function(angular) {
    'use strict';

    var managerDatastoreSetting = function(storage, managerDatastore) {

        /**
         * Returns the settings datastore.
         *
         * @returns {promise}
         */
        var get_settings_datastore = function() {
            var type = "settings";
            var description = "key-value-settings";

            var onSuccess = function (results) {

                for (var i = 0; i < results.length; i++) {
                    var s = storage.find_one('settings', {key: results[i].key});
                    if (s !== null) {
                        s.value = results[i].value;
                        storage.update('settings', s);
                    } else {
                        storage.insert('settings', {key: results[i].key, value: results[i].value});
                    }
                }

                return results
            };
            var onError = function () {
                // pass
            };

            return managerDatastore.get_datastore(type, description)
                .then(onSuccess, onError);
        };

        /**
         *
         * Saves the settings datastore with given content
         *
         * @param content The real object you want to encrypt in the datastore
         * @returns {promise}
         * @private
         */
        var save_settings_datastore = function (content) {
            var type = "settings";
            var description = "key-value-settings";

            return managerDatastore.save_datastore(type, description, content)
        };

        return {
            get_settings_datastore: get_settings_datastore,
            save_settings_datastore: save_settings_datastore
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("managerDatastoreSetting", ['storage', 'managerDatastore', managerDatastoreSetting]);

}(angular));