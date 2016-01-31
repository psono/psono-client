(function(angular) {
    'use strict';


    var itemBlueprint = function($window, $injector, helper) {

        var _default = "website_password";

        var registrations = {};

        var _blueprints = {
            website_password: {
                id: "website_password", // Unique ID
                name: "Password", // Displayed in Dropdown Menu
                title_column: "website_password_title", // is the main column, that is used as filename
                urlfilter_column: "website_password_url_filter", // is the filter column for url matching
                search: ['website_password_title', 'website_password_url_filter'], // are searched when the user search his entries
                columns: [ // All columns for this object with unique names
                    { name: "website_password_title", field: "input", type: "text", title: "Title", placeholder: "Title", required: true},
                    { name: "website_password_url", field: "input", type: "url", title: "URL", placeholder: "URL", required: true, onChange: "onChangeUrl"},
                    { name: "website_password_username", field: "input", type: "text", title: "Username", placeholder: "Username"},
                    { name: "website_password_password", field: "input", type: "password", title: "Password", placeholder: "Password",
                        dropmenuItems:[
                            {
                                icon: "fa fa-eye-slash",
                                text:"Show Password",
                                onclick:function(id) {
                                    document.getElementById(id).type = document.getElementById(id).type == 'text' ? 'password' : 'text';
                                }
                            },
                            {
                                icon: "fa fa-key",
                                text:"Generate Password",
                                onclick:function(id) {
                                    angular.element(document.querySelector('#'+id)).val(registrations['generate']()).trigger('input');
                                }
                            }
                        ]},
                    { name: "website_password_notes", field: "textarea", title: "Notes", placeholder: "Notes", required: false},
                    { name: "website_password_auto_submit", field: "input", type:"checkbox", title: "Automatic submit", position: "advanced"},
                    { name: "website_password_url_filter", field: "textarea", title: "Domain Filter", placeholder: "URL filter e.g. example.com or sub.example.com", required: true, position: "advanced"}
                ],
                /**
                 * triggered whenever url is changing.
                 * gets the columns and returns the default domain filter
                 *
                 * @param columns
                 * @returns {string}
                 */
                onChangeUrl: function(columns){

                    var url;
                    var domain_filter_col;

                    var i;
                    for (i = 0; i < columns.length; i++) {
                        if (columns[i].name === "website_password_url") {
                            url = columns[i].value;
                            break;
                        }
                    }

                    if (typeof url === "undefined") {
                        return "";
                    }

                    for (i = 0; i < columns.length; i++) {
                        if (columns[i].name === "website_password_url_filter") {
                            domain_filter_col = columns[i];
                            break;
                        }
                    }

                    // get only toplevel domain
                    var matches = helper.parse_url(url).authority.split(".");
                    matches = matches.slice(-2);

                    domain_filter_col.value = matches.join(".");

                    return matches.join(".");
                },
                onClickNewTab: true,
                /**
                 * will open a new tab
                 *
                 * @param content
                 */
                onOpenSecret: function(content) {
                    $window.location.href = content.website_password_url;
                },
                /**
                 * returns the message content with the username and password for the website
                 *
                 * @param content
                 * @returns {{key: string, content: {username: *, password: *}}}
                 */
                msgBeforeOpenSecret: function(content) {
                    return {
                        key: "fillpassword",
                        content: {
                            username: content.website_password_username,
                            password: content.website_password_password,
                            authority: content.website_password_url_filter,
                            auto_submit: content.website_password_auto_submit
                        }
                    }
                }
            },
            note: {
                id: "note",
                name: "Note",
                title_column: "note_title",
                search: ['note_title'],
                columns: [
                    { name: "note_title", field: "input", type: "text", title: "Title", placeholder: "Name", required: true},
                    { name: "note_notes", field: "textarea", title: "Notes", placeholder: "Notes", required: false}
                ]
            }/*,
            dummy: {
                id: "dummy",
                name: "Dummy",
                title_column: "dummy_title",
                search: ['dummy_title'],
                tabs: [
                    {
                        id: "dummy_tab_1",
                        title: "Title of Tab 1"
                    },
                    {
                        id: "dummy_tab_2",
                        title:"Title of Tab 2"
                    }
                ],
                columns: [
                    { name: "dummy_title", field: "input", type: "text", title: "Dummy field 1", placeholder: "Put your dummy 1 content here", required: true, tab: 'dummy_tab_2',
                        dropmenuItems:[
                            { icon: "fa fa-key", text:"Generate Password", onclick:function(id) { alert("Generate Password triggered " + id); } },
                            { icon: "fa fa-eye-slash", text:"Show Password", onclick:function(id) { alert("Show Password triggered " + id); } }
                        ]
                    },
                    { name: "dummy_notes", field: "textarea", title: "Dummy field 2", placeholder: "Put your dummy 2 content here", required: false, tab: 'dummy_tab_1',
                        dropmenuItems:[
                            { icon: "fa fa-key", text:"Generate Password", onclick:function(id) { alert("Generate Password triggered " + id); } },
                            { icon: "fa fa-eye-slash", text:"Show Password", onclick:function(id) { alert("Show Password triggered " + id); } }
                        ]
                    },
                    { name: "dummy_before", field: "input", title: "Before Tabs", placeholder: "Before tab", required: false,
                        dropmenuItems:[
                            { icon: "fa fa-key", text:"Generate Password", onclick:function(id) { alert("Generate Password triggered " + id); } },
                            { icon: "fa fa-eye-slash", text:"Show Password", onclick:function(id) { alert("Show Password triggered " + id); } }
                        ]
                    },
                    { name: "dummy_after", field: "input", title: "after Tabs", placeholder: "After tab", required: false, position: "after",
                        dropmenuItems:[
                            { icon: "fa fa-key", text:"Generate Password", onclick:function(id) { alert("Generate Password triggered " + id); } },
                            { icon: "fa fa-eye-slash", text:"Show Password", onclick:function(id) { alert("Show Password triggered " + id); } }
                        ]
                    }
                ]
            }*/
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
    app.factory("itemBlueprint", ['$window', '$injector', 'helper', itemBlueprint]);

}(angular));
