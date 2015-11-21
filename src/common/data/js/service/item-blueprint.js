(function(angular) {
    'use strict';


    var itemBlueprint = function($window) {

        var _default = "website_password";

        var _blueprints = {
            website_password: {
                id: "website_password", // Unique ID
                name: "Password", // Displayed in Dropdown Menu
                title_column: "website_password_title", // is the main column, that is used as filename
                urlfilter_column: "website_password_url_filter", // is the filter column for url matching
                columns: [ // All columns for this object with unique names
                    { name: "website_password_title", field: "input", type: "text", title: "Title", placeholder: "Title", required: true},
                    { name: "website_password_url", field: "input", type: "url", title: "URL", placeholder: "URL", required: true, onChange: "onChangeUrl"},
                    { name: "website_password_username", field: "input", type: "text", title: "Username", placeholder: "Username"},
                    { name: "website_password_password", field: "input", type: "password", title: "Password", placeholder: "Password"},
                    { name: "website_password_notes", field: "textarea", title: "Notes", placeholder: "Notes", required: false},
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

                    /*
                    function parse_url(url) {
                        // According to RFC http://www.ietf.org/rfc/rfc3986.txt Appendix B
                        var pattern = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
                        var matches =  url.match(pattern);

                        return {
                            scheme: matches[2],
                            authority: matches[4].replace(/^(www\.)/,""), //remove leading www.
                            path: matches[5],
                            query: matches[7],
                            fragment: matches[9]
                        };
                    }
                    function escapeRegExp(str) {
                        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                    }

                    // get only toplevel domain
                    var matches = parse_url(url).authority.split(".");
                    matches = matches.slice(-2);

                    return "'/"+escapeRegExp(matches.join("."))+"/i'";
                    */

                    function parse_url(url) {
                        // According to RFC http://www.ietf.org/rfc/rfc3986.txt Appendix B
                        var pattern = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
                        var matches =  url.match(pattern);

                        return {
                            scheme: matches[2],
                            authority: matches[4].replace(/^(www\.)/,""), //remove leading www.
                            path: matches[5],
                            query: matches[7],
                            fragment: matches[9]
                        };
                    }
                    // get only toplevel domain
                    var matches = parse_url(url).authority.split(".");
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
                            authority: content.website_password_url_filter
                        }
                    }
                }
            },
            note: {
                id: "note",
                name: "Note",
                title_column: "note_title",
                columns: [
                    { name: "note_title", field: "input", type: "text", title: "Title", placeholder: "Name", required: true},
                    { name: "note_notes", field: "textarea", title: "Notes", placeholder: "Notes", required: false}
                ]
            },
            dummy: {
                id: "dummy",
                name: "Dummy",
                title_column: "dummy_title",
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
                    { name: "dummy_title", field: "input", type: "text", title: "Dummy field 1", placeholder: "Put your dummy 1 content here", required: true, tab: 'dummy_tab_2'},
                    { name: "dummy_notes", field: "textarea", title: "Dummy field 2", placeholder: "Put your dummy 2 content here", required: false, tab: 'dummy_tab_1'},
                    { name: "dummy_before", field: "input", title: "Before Tabs", placeholder: "Before tab", required: false},
                    { name: "dummy_after", field: "input", title: "after Tabs", placeholder: "After tab", required: false, position: "after"}
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

        return {
            get_blueprint: get_blueprint,
            get_blueprints: get_blueprints,
            get_default_blueprint_key: get_default_blueprint_key,
            get_default_blueprint: get_default_blueprint,
            blueprint_has_on_click_new_tab: blueprint_has_on_click_new_tab,
            blueprint_on_open_secret: blueprint_on_open_secret,
            blueprint_msg_before_open_secret: blueprint_msg_before_open_secret
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("itemBlueprint", ['$window', itemBlueprint]);

}(angular));
