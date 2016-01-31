(function(angular) {
    'use strict';


    var shareBlueprint = function($window, helper) {

        var _default = "user";

        var registrations = {};

        var _blueprints = {
            user: {
                id: "user",
                name: "User",
                title_column: "user_email",
                search: ['user_name', 'user_email'],
                columns: [
                    { name: "user_search_email", field: "input", type: "email", title: "E-Mail", placeholder: "E-Mail", onChange: "onChangeSearchEmail" },
                    { name: "user_search_button", field: "button", type: "button", title: "Search", hidden: true, class: 'btn-primary', onClick:"onClickSearchButton" },
                    { name: "user_name", field: "input", type: "text", title: "Name", placeholder: "Name (optional)", hidden: true},
                    { name: "user_id", field: "input", type: "text", title: "ID", placeholder: "ID", required: true, hidden: true, readonly: true },
                    { name: "user_email", field: "input", type: "text", title: "E-Mail", placeholder: "E-Mail", required: true, hidden: true, readonly: true },
                    { name: "user_public_key", field: "textarea", title: "Public Key", placeholder: "Public Key", required: true, hidden: true, readonly: true }
                ],
                getName: function(columns) {
                    var vals= {};
                    var visible_name = '';
                    for (var i = 0; i < columns.length; i++) {
                        if (columns[i].hasOwnProperty('value')) {
                            vals[columns[i].name] = columns[i].value;
                        }
                    }

                    if (vals.user_name && vals['user_name'].length > 0) {
                        visible_name += vals['user_name'];
                    } else {
                        visible_name += vals['user_email'];
                    }
                    visible_name += ' ('+vals['user_public_key']+')';
                    return visible_name;
                },
                /**
                 * triggered whenever the search email input is changing.
                 * adjusts the visibility of the search button according to the input value
                 *
                 * @param columns
                 */
                onChangeSearchEmail: function(columns){

                    var has_search_email = false;

                    var i;
                    for (i = 0; i < columns.length; i++) {
                        if (columns[i].name === "user_search_email") {
                            if (columns[i].value && columns[i].value.length > 0) {
                                var regexp = /^[_a-zA-Z0-9]+(\.[_a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z]{2,4})$/;
                                if (regexp.test(columns[i].value)) {
                                    has_search_email = true;
                                }
                            }
                            break;
                        }
                    }

                    for (i = 0; i < columns.length; i++) {
                        if (columns[i].name === "user_search_button") {
                            columns[i].hidden = !has_search_email;
                            break;
                        }
                    }
                },
                /**
                 * triggered whenever the search button is clicked.
                 * triggers a search to the backend for a valid user with that email address
                 *
                 * @param columns
                 * @param errors
                 */
                onClickSearchButton: function(columns, errors){

                    var search_email = '';

                    var i;
                    for (i = 0; i < columns.length; i++) {
                        if (columns[i].name === "user_search_email") {
                            search_email = columns[i].value;
                            break;
                        }
                    }

                    var onSuccess = function(data) {
                        data = data.data;

                        for (i = 0; i < columns.length; i++) {
                            if (columns[i].name === "user_name") {
                                columns[i].hidden = false;
                            }
                            if (columns[i].name === "user_id") {
                                columns[i].value = data.id;
                                columns[i].hidden = false;
                            }
                            if (columns[i].name === "user_email") {
                                columns[i].value = data.email;
                                columns[i].hidden = false;
                            }
                            if (columns[i].name === "user_public_key") {
                                columns[i].value = data.public_key;
                                columns[i].hidden = false;
                            }
                        }

                        errors.splice(0,errors.length)
                    };

                    var onError = function(data) {
                        if (data.status = 404) {
                            errors.push("User not found.");
                        } else {
                            alert("Ups, this should not happen. ");
                        }
                    };

                    registrations['searchUser'](search_email).then(onSuccess, onError)

                }

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

        /**
         * analyzes the fields of an item to determine if the advanced option is needed
         *
         * @param item
         * @returns {boolean}
         */
        var has_advanced = function (item) {
            var found = false;

            for (var i = 0; i < item.columns.length; i++) {
                if (item.columns[i].hasOwnProperty('position') && item.columns[i]['position'] === 'advanced') {
                    return true;
                }
            }

            return found;
        };

        /**
         * determines weather a specified blueprint needs a new tab on click
         *
         * @param key
         * @returns {boolean}
         */
        var blueprint_has_on_click_new_tab = function(key) {
            var bp = get_blueprint(key);
            return !!(bp && bp.onClickNewTab);
        };

        /**
         * triggers open secret function
         *
         * @param key
         * @param content
         */
        var blueprint_on_open_secret = function (key, content) {
            var bp = get_blueprint(key);
            bp.onOpenSecret(content);
        };

        /**
         * triggered before the open secret function and returns a message (if applicable) that is sent to the main
         * script
         *
         * @param key
         * @param content
         * @returns {*|{key, content}|{key: string, content: {username: *, password: *}}}
         */
        var blueprint_msg_before_open_secret = function (key, content) {
            var bp = get_blueprint(key);
            return bp.msgBeforeOpenSecret(content);
        };

        /**
         * used to register functions
         *
         * @param key
         * @param func
         */
        var register = function (key, func) {
            registrations[key] = func;
        };

        return {
            get_blueprint: get_blueprint,
            get_blueprints: get_blueprints,
            get_default_blueprint_key: get_default_blueprint_key,
            get_default_blueprint: get_default_blueprint,
            has_advanced: has_advanced,
            blueprint_has_on_click_new_tab: blueprint_has_on_click_new_tab,
            blueprint_on_open_secret: blueprint_on_open_secret,
            blueprint_msg_before_open_secret: blueprint_msg_before_open_secret,
            register: register
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("shareBlueprint", ['$window', 'helper', shareBlueprint]);

}(angular));
