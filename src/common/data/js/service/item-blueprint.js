(function(angular) {
    'use strict';


    var itemBlueprint = function() {

        var _default = "website_password";

        var _blueprints = {
            website_password: {
                id: "website_password",
                name: "Password",
                search: "website-password-title",
                columns: [
                    { name: "website-password-title", field: "input", type: "text", title: "Title", placeholder: "Title", required: true},
                    { name: "website-password-url", field: "input", type: "url", title: "URL", placeholder: "URL", required: true},
                    { name: "website-password-username", field: "input", type: "text", title: "Username", placeholder: "Username"},
                    { name: "website-password-password", field: "input", type: "password", title: "Password", placeholder: "Password"},
                    { name: "website-password-notes", field: "textarea", title: "Notes", placeholder: "Notes", required: false}
                ]
            },
            note: {
                id: "note",
                name: "Note",
                search: "note-title",
                columns: [
                    { name: "note-title", field: "input", type: "text", title: "Title", placeholder: "Name", required: true},
                    { name: "note-notes", field: "textarea", title: "Notes", placeholder: "Notes", required: false}
                ]
            }
        };
        /**
         * returns an overview of all available blueprints with name and id
         *
         * @returns {Array} The list of all blueprints
         */
        var get_blueprints = function () {

            var result = [];

            for (var property in _blueprints) {
                if (_blueprints.hasOwnProperty(property)) {
                    result.push(_blueprints[property])
                }
            }
            return result;
        };
        /**
         * returns the blueprint for a specific key
         *
         * @param key The key of the blueprint
         *
         * @returns {object} The blueprint or false
         */
        var get_blueprint = function (key) {
            if (_blueprints.hasOwnProperty(key)){
                return angular.copy(_blueprints[key]);
            } else {
                return false;
            }
        };

        /**
         * returns the key for the default blueprint
         *
         * @returns {string}
         */
        var get_default_blueprint_key = function () {
            return _default;
        };

        /**
         * returns the default blueprint
         *
         * @returns {Object}
         */
        var get_default_blueprint = function () {
            return get_blueprint(get_default_blueprint_key());
        };

        return {
            get_blueprint: get_blueprint,
            get_blueprints: get_blueprints,
            get_default_blueprint_key: get_default_blueprint_key,
            get_default_blueprint: get_default_blueprint
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("itemBlueprint", ['$http', 'storage', itemBlueprint]);

}(angular));
