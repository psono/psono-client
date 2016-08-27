(function(angular) {
    'use strict';


    var shareBlueprint = function($window, helper) {

        var _default = "user";

        var registrations = {};

        var _blueprints = {
            user: {
                id: "user",
                name: "User",
                title_field: "user_username",
                search: ['user_name', 'user_username'],
                fields: [
                    { name: "user_search_username", field: "input", type: "email", title: "Username", placeholder: "Username", onChange: "onChangeSearchUsername" },
                    { name: "user_search_button", field: "button", type: "button", title: "Search", hidden: true, class: 'btn-primary', onClick:"onClickSearchButton" },
                    { name: "user_name", field: "input", type: "text", title: "Name", placeholder: "Name (optional)", hidden: true},
                    { name: "user_id", field: "input", type: "text", title: "ID", placeholder: "ID", required: true, hidden: true, readonly: true },
                    { name: "user_username", field: "input", type: "text", title: "Username", placeholder: "Username", required: true, hidden: true, readonly: true },
                    { name: "user_public_key", field: "textarea", title: "Public Key", placeholder: "Public Key", required: true, hidden: true, readonly: true,
                        note: 'To verify that this is the user you want to share data with, ask him if this is really his public key.' }
                ],
                getName: function(fields) {
                    var vals= {};
                    var visible_name = '';
                    for (var i = 0; i < fields.length; i++) {
                        if (fields[i].hasOwnProperty('value')) {
                            vals[fields[i].name] = fields[i].value;
                        }
                    }

                    if (vals.user_name && vals['user_name'].length > 0) {
                        visible_name += vals['user_name'];
                    } else {
                        visible_name += vals['user_username'];
                    }
                    visible_name += ' ('+vals['user_public_key']+')';
                    return visible_name;
                },
                /**
                 * triggered whenever the search username input is changing.
                 * adjusts the visibility of the search button according to the input value
                 *
                 * @param fields
                 */
                onChangeSearchUsername: function(fields){

                    var has_search_username = false;

                    var i;
                    for (i = 0; i < fields.length; i++) {
                        if (fields[i].name === "user_search_username") {
                            if (fields[i].value && fields[i].value.length > 0) {
                                // Regex obtained from Angular JS
                                var regexp = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
                                if (regexp.test(fields[i].value)) {
                                    has_search_username = true;
                                }
                            }
                            break;
                        }
                    }

                    for (i = 0; i < fields.length; i++) {
                        if (fields[i].name === "user_search_button") {
                            fields[i].hidden = !has_search_username;
                            break;
                        }
                    }
                },
                /**
                 * triggered whenever the search button is clicked.
                 * triggers a search to the backend for a valid user with that email address
                 *
                 * @param fields
                 * @param errors
                 */
                onClickSearchButton: function(fields, errors){

                    var search_username = '';

                    var i;
                    for (i = 0; i < fields.length; i++) {
                        if (fields[i].name === "user_search_username") {
                            search_username = fields[i].value;
                            break;
                        }
                    }

                    var onSuccess = function(data) {
                        data = data.data;

                        for (i = 0; i < fields.length; i++) {
                            if (fields[i].name === "user_name") {
                                fields[i].hidden = false;
                            }
                            if (fields[i].name === "user_id") {
                                fields[i].value = data.id;
                            }
                            if (fields[i].name === "user_username") {
                                fields[i].value = data.username;
                                fields[i].hidden = false;
                            }
                            if (fields[i].name === "user_public_key") {
                                fields[i].value = data.public_key;
                                fields[i].hidden = false;
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

                    registrations['search_user'](search_username).then(onSuccess, onError)

                },
                onEditModalOpen: function(node) {
                    var showInEditOnly = ["user_name", "user_id", "user_username", "user_public_key"];
                    for (var i = 0; i < node.fields.length; i++) {
                        node.fields[i].hidden = !(showInEditOnly.indexOf(node.fields[i].name) > -1);
                    }
                }

            }
        };

        var _additionalFunction = {
        };

        /**
         * returns an overview of all available additional functions with name id and function
         *
         * @returns {Array} The list of all blueprints
         */
        var get_additional_functions = function() {

            var result = [];

            for (var property in _additionalFunction) {
                if (_additionalFunction.hasOwnProperty(property)) {
                    result.push(_additionalFunction[property])
                }
            }
            return result;
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

            for (var i = 0; i < item.fields.length; i++) {
                if (item.fields[i].hasOwnProperty('position') && item.fields[i]['position'] === 'advanced') {
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
            get_additional_functions: get_additional_functions,
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
