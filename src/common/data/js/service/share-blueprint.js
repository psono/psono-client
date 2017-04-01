(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.shareBlueprint
     * @requires $window
     * @requires psonocli.helper
     *
     * @description
     * Service that provides the possible sharing partner blueprints, currently only "users".
     *
     * Should later be extended to groups or multi users.
     */


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
                    { name: "user_search_username", field: "input", type: "text", title: "Username", placeholder: "Username", onChange: "onChangeSearchUsername", usernameInputGroupAddon: true },
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
                 * @param selected_server_domain
                 */
                onChangeSearchUsername: function(fields, selected_server_domain){

                    var has_search_username = false;

                    var possible_username = '';

                    var i;
                    for (i = 0; i < fields.length; i++) {
                        if (fields[i].name === "user_search_username") {
                            if (fields[i].value && fields[i].value.length > 0) {

                                possible_username = fields[i].value;

                                if (fields[i].value.indexOf('@') == -1 && selected_server_domain) {
                                    possible_username = possible_username + '@' + selected_server_domain;
                                }

                                // Regex obtained from Angular JS
                                var regexp = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
                                if (regexp.test(possible_username)) {
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
                 * @param form_control
                 * @param selected_server_domain
                 */
                onClickSearchButton: function(fields, errors, form_control, selected_server_domain){

                    var search_username = '';

                    var i;
                    for (i = 0; i < fields.length; i++) {
                        if (fields[i].name === "user_search_username") {
                            search_username = fields[i].value;
                            break;
                        }
                    }

                    if (search_username.indexOf('@') == -1 && selected_server_domain) {
                        search_username = search_username + '@' + selected_server_domain;
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

                        errors.splice(0,errors.length);
                        form_control['block_submit'] = false;
                    };

                    var onError = function(data) {

                        for (i = 0; i < fields.length; i++) {
                            if (fields[i].name === "user_name") {
                                fields[i].hidden = true;
                            }
                            if (fields[i].name === "user_id") {
                                fields[i].value = '';
                            }
                            if (fields[i].name === "user_username") {
                                fields[i].hidden = true;
                                fields[i].value = '';
                            }
                            if (fields[i].name === "user_public_key") {
                                fields[i].hidden = true;
                                fields[i].value = '';
                            }
                        }

                        if (data.status = 404) {
                            form_control['block_submit'] = true;
                            errors.push("User not found.");
                        } else {
                            alert("Ups, this should not happen. ");
                        }
                    };

                    registrations['search_user'](search_username).then(onSuccess, onError)

                },
                /**
                 * will open a new tab
                 *
                 * @param content
                 */
                onOpenSecret: function(content) {

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
         * @ngdoc
         * @name psonocli.shareBlueprint#get_additional_functions
         * @methodOf psonocli.shareBlueprint
         *
         * @description
         * returns an overview of all available additional functions with name id and function
         *
         * @param {object} item The blueprint item which should be searched for additional functions
         *
         * @returns {Array} The list of all additional functions
         */
        var get_additional_functions = function(item) {

            var result = [];

            for (var property in _additionalFunction) {
                if (!_additionalFunction.hasOwnProperty(property)) {
                    continue;
                }

                if (_additionalFunction[property].hasOwnProperty('condition') && !_additionalFunction[property].condition(item)) {
                    continue;
                }

                if (_additionalFunction[property].hasOwnProperty('ngClass') && _additionalFunction[property].ngClass(item) == 'hidden') {
                    continue;
                }

                result.push(_additionalFunction[property]);
            }
            return result;
        };

        /**
         * @ngdoc
         * @name psonocli.shareBlueprint#get_blueprints
         * @methodOf psonocli.shareBlueprint
         *
         * @description
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
         * @ngdoc
         * @name psonocli.shareBlueprint#get_blueprint
         * @methodOf psonocli.shareBlueprint
         *
         * @description
         * returns the blueprint for a specific key
         *
         * @param {string} key The key of the blueprint that we want to have
         *
         * @returns {object|false} The blueprint or false
         */
        var get_blueprint = function (key) {
            if (_blueprints.hasOwnProperty(key)){
                return angular.copy(_blueprints[key]);
            } else {
                return false;
            }
        };


        /**
         * @ngdoc
         * @name psonocli.shareBlueprint#get_default_blueprint_key
         * @methodOf psonocli.shareBlueprint
         *
         * @description
         * returns the key for the default blueprint
         *
         * @returns {string} Returns the key of the default blueprint
         */
        var get_default_blueprint_key = function () {
            return _default;
        };

        /**
         * @ngdoc
         * @name psonocli.shareBlueprint#get_default_blueprint
         * @methodOf psonocli.shareBlueprint
         *
         * @description
         * returns the default blueprint
         *
         * @returns {object} Returns the default blueprint
         */
        var get_default_blueprint = function () {
            return get_blueprint(get_default_blueprint_key());
        };

        /**
         * @ngdoc
         * @name psonocli.shareBlueprint#has_advanced
         * @methodOf psonocli.shareBlueprint
         *
         * @description
         * analyzes the fields of an item following a blueprint to determine if any field has position advanced
         *
         * @param {object} item The blueprint item with fields that we want to search
         * @returns {boolean} Returns if the items has fields with position advanced
         */
        var has_advanced = function (item) {

            for (var i = 0; i < item.fields.length; i++) {
                if (item.fields[i].hasOwnProperty('position') && item.fields[i]['position'] === 'advanced') {
                    return true;
                }
            }

            return false;
        };

        /**
         * @ngdoc
         * @name psonocli.shareBlueprint#blueprint_has_on_click_new_tab
         * @methodOf psonocli.shareBlueprint
         *
         * @description
         * determines weather a specified blueprint opens a new tab on click
         *
         * @param {string} key The key of the blueprint
         * @returns {boolean} Returns if the specified blueprint opens a new tab on click
         */
        var blueprint_has_on_click_new_tab = function(key) {
            var bp = get_blueprint(key);
            return !!(bp && bp.onClickNewTab);
        };

        /**
         * @ngdoc
         * @name psonocli.shareBlueprint#blueprint_on_open_secret
         * @methodOf psonocli.shareBlueprint
         *
         * @description
         * triggers open secret function
         *
         * @param {string} key The key of the blueprint
         * @param {object} content The payload of the "onOpenSecret" call
         */
        var blueprint_on_open_secret = function (key, content) {
            var bp = get_blueprint(key);
            if (bp.hasOwnProperty('onOpenSecret')) {
                bp.onOpenSecret(content);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.shareBlueprint#blueprint_msg_before_open_secret
         * @methodOf psonocli.shareBlueprint
         *
         * @description
         * triggered before the open secret function and returns a message (if applicable) that is sent to the main
         * script
         *
         * @param {string} key The key of the blueprint
         * @param {object} content The message for the before open secret call
         * @returns {object} The message object to send
         */
        var blueprint_msg_before_open_secret = function (key, content) {
            var bp = get_blueprint(key);
            return bp.msgBeforeOpenSecret(content);
        };

        /**
         * @ngdoc
         * @name psonocli.shareBlueprint#register
         * @methodOf psonocli.shareBlueprint
         *
         * @description
         * used to register functions to bypass circular dependencies
         *
         * @param {string} key The key of the function (usually the function name)
         * @param {function} func The call back function
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

    var app = angular.module('psonocli');
    app.factory("shareBlueprint", ['$window', 'helper', shareBlueprint]);

}(angular));
