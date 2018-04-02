(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.itemBlueprint
     * @requires $rootScope
     * @requires $window
     * @requires $uibModal
     * @requires psonocli.helper
     *
     * @description
     * Service that provides the possible item blueprints e.g.:
     * - website_password
     * - note
     *
     * Should later be extended to provide licenses, files, ...
     */


    var itemBlueprint = function($rootScope, $window, $uibModal, helper) {

        var _default = "website_password";

        var registrations = {};

        var _blueprints = {
            website_password: {
                id: "website_password", // Unique ID
                name: "Password", // Displayed in Dropdown Menu
                title_field: "website_password_title", // is the main column, that is used as filename
                urlfilter_field: "website_password_url_filter", // is the filter column for url matching
                autosubmit_field: "website_password_auto_submit", // is the filter column for auto submit
                search: ['website_password_title', 'website_password_url_filter'], // are searched when the user search his entries
                fields: [ // All fields for this object with unique names
                    { name: "website_password_title", field: "input", type: "text", title: "Title", placeholder: "Title", required: true},
                    { name: "website_password_url", field: "input", type: "text", validationType: "url", title: "URL", placeholder: "URL", onChange: "onChangeUrl"},
                    { name: "website_password_username", field: "input", type: "text", title: "Username", placeholder: "Username"},
                    { name: "website_password_password", field: "input", type: "password", title: "Password", placeholder: "Password",
                        dropmenuItems:[
                            {
                                icon: "fa fa-eye-slash",
                                text:"Show Password",
                                onclick:function(id, item) {
                                    if (document.getElementById(id).type === 'text') {
                                        document.getElementById(id).type = 'password';
                                        item.text = 'Show Password';
                                    } else {
                                        document.getElementById(id).type = 'text';
                                        item.text = 'Hide Password';
                                    }
                                }
                            },
                            {
                                icon: "fa fa-cogs",
                                text:"Generate Password",
                                onclick:function(id, item) {
                                    angular.element(document.querySelector('#'+id)).val(registrations['generate']()).trigger('input');
                                }
                            }
                        ]},
                    { name: "website_password_notes", field: "textarea", title: "Notes", placeholder: "Notes"},
                    { name: "website_password_auto_submit", field: "input", type:"checkbox", title: "Automatic submit", position: "advanced"},
                    { name: "website_password_url_filter", field: "textarea", title: "Domain Filter", placeholder: "URL filter e.g. example.com or sub.example.com", position: "advanced"}
                ],
                /**
                 * triggered whenever url is changing.
                 * gets the fields and returns the default domain filter
                 *
                 * @param fields
                 * @returns {string}
                 */
                onChangeUrl: function(fields){

                    var url;
                    var domain_filter_col;

                    var i;
                    for (i = 0; i < fields.length; i++) {
                        if (fields[i].name === "website_password_url") {
                            url = fields[i].value;
                            break;
                        }
                    }

                    for (i = 0; i < fields.length; i++) {
                        if (fields[i].name === "website_password_url_filter") {
                            domain_filter_col = fields[i];
                            break;
                        }
                    }

                    if (typeof url === "undefined") {
                        domain_filter_col.value = "";
                        return "";
                    }

                    // get only toplevel domain
                    var parsed_url = helper.parse_url(url);

                    if (typeof(parsed_url.authority) === 'undefined' && url) {
                        domain_filter_col.value = url;
                        return url;
                    } else if (typeof(parsed_url.authority) === 'undefined') {
                        domain_filter_col.value = "";
                        return '';
                    } else {
                        domain_filter_col.value = parsed_url.authority;
                        return parsed_url.authority;
                    }
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
                title_field: "note_title",
                search: ['note_title'],
                fields: [
                    { name: "note_title", field: "input", type: "text", title: "Title", placeholder: "Name", required: true},
                    { name: "note_notes", field: "textarea", title: "Notes", placeholder: "Notes"}
                ]
            },
            mail_gpg_own_key: {
                id: "mail_gpg_own_key",
                name: "GPG Key",
                title_field: "mail_gpg_own_key_title",
                search: ['mail_gpg_own_key_title', 'mail_gpg_own_key_email'],
                fields: [
                    { name: "mail_gpg_own_key_title", field: "input", type: "text", title: "Title", hidden: true, placeholder: "Name", required: true},
                    { name: "mail_gpg_own_key_email", field: "input", type: "text", title: "Email", placeholder: "Email", hidden: true, readonly: true},
                    { name: "mail_gpg_own_key_name", field: "input", type: "text", title: "Name", placeholder: "Name", hidden: true, readonly: true},
                    { name: "mail_gpg_own_key_public", field: "textarea", title: "Public Key", placeholder: "Public Key", hidden: true, readonly: true},
                    { name: "mail_gpg_own_key_private", field: "textarea", title: "Private Key", placeholder: "Private Key", hidden: true, readonly: true},
                    { name: "mail_gpg_own_key_publish", field: "input", type:"checkbox", title: "Publish Public Key", hidden: true},
                    { name: "mail_gpg_own_key_generate_new", field: "button", type: "button", title: "Generate New", hidden: true, class: 'btn-primary', onClick:"onClickGenerateNewButton" },
                    { name: "mail_gpg_own_key_generate_import_text", field: "button", type: "button", title: "Import (as text)", hidden: true, class: 'btn-primary', onClick:"onClickImportAsTextButton" },
                    { name: "mail_gpg_own_key_encrypt_message", field: "button", type: "button", title: "Encrypt Message", hidden: true, class: 'btn-default', onClick:"onClickEncryptMessageButton" },
                    { name: "mail_gpg_own_key_decrypt_message", field: "button", type: "button", title: "Decrypt Message", hidden: true, class: 'btn-default', onClick:"onClickDecryptMessageButton" }
                ],
                /**
                 * triggered whenever the "Generate New" button is clicked.
                 * Will open a new modal so the user can enter his details, and once the modal closes show the details for this entry.
                 *
                 * @param node
                 * @param fields
                 * @param errors
                 * @param form_control
                 * @param selected_server_domain
                 */
                onClickGenerateNewButton: function(node, fields, errors, form_control, selected_server_domain){

                    var show_key = function(data) {

                        for (var i = 0; i < fields.length; i++) {
                            if (fields[i].name === "mail_gpg_own_key_title") {
                                fields[i].value = data.title;
                                fields[i].hidden = false;
                            }
                            if (fields[i].name === "mail_gpg_own_key_name") {
                                fields[i].value = data.name;
                                fields[i].hidden = false;
                            }
                            if (fields[i].name === "mail_gpg_own_key_email") {
                                fields[i].value = data.email;
                                fields[i].hidden = false;
                            }
                            if (fields[i].name === "mail_gpg_own_key_public") {
                                fields[i].value = data.public_key;
                                fields[i].hidden = false;
                            }
                            if (fields[i].name === "mail_gpg_own_key_private") {
                                fields[i].value = data.private_key;
                                fields[i].hidden = false;
                            }
                        }
                    };

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal-generate-new-mail-gpg-key.html',
                        controller: 'ModalGenerateNewMailGPGKeyCtrl',
                        backdrop: 'static',
                        resolve: {
                        }
                    });

                    modalInstance.result.then(function (data) {
                        show_key(data);
                        //form_control['block_submit'] = false;
                    }, function () {
                        // cancel triggered
                    });

                },
                /**
                 * triggered whenever the "Import (as text)" button is clicked.
                 * Will open a new modal so the user can copy paste his keys, and once the modal closes show the details for this entry.
                 *
                 * @param node
                 * @param fields
                 * @param errors
                 * @param form_control
                 * @param selected_server_domain
                 */
                onClickImportAsTextButton: function(node, fields, errors, form_control, selected_server_domain){

                    var show_key = function(data) {

                        for (var i = 0; i < fields.length; i++) {
                            if (fields[i].name === "mail_gpg_own_key_title") {
                                fields[i].value = data.title;
                                fields[i].hidden = false;
                            }
                            if (fields[i].name === "mail_gpg_own_key_name") {
                                fields[i].value = data.name;
                                fields[i].hidden = false;
                            }
                            if (fields[i].name === "mail_gpg_own_key_email") {
                                fields[i].value = data.email;
                                fields[i].hidden = false;
                            }
                            if (fields[i].name === "mail_gpg_own_key_public") {
                                fields[i].value = data.public_key;
                                fields[i].hidden = false;
                            }
                            if (fields[i].name === "mail_gpg_own_key_private") {
                                fields[i].value = data.private_key;
                                fields[i].hidden = false;
                            }
                        }
                    };

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal-import-mail-gpg-key-as-text.html',
                        controller: 'ModalImportMailGPGKeyAsTextCtrl',
                        backdrop: 'static',
                        resolve: {
                        }
                    });

                    modalInstance.result.then(function (data) {
                        show_key(data);
                        //form_control['block_submit'] = false;
                    }, function () {
                        // cancel triggered
                    });

                },
                /**
                 * triggered whenever the "Encrypt Message" button is clicked.
                 * Will open a new modal where the user can encrypt a message for specific receivers.
                 *
                 * @param node
                 * @param fields
                 * @param errors
                 * @param form_control
                 * @param selected_server_domain
                 */
                onClickEncryptMessageButton: function(node, fields, errors, form_control, selected_server_domain){
                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal-encrypt-message-gpg.html',
                        controller: 'ModalEncryptMessageGPGCtrl',
                        backdrop: 'static',
                        resolve: {
                            secret_id: function() {
                                return node.secret_id;
                            }
                        }
                    });

                    modalInstance.result.then(function (data) {
                        // pass
                    }, function () {
                        // cancel triggered
                    });

                },
                /**
                 * triggered whenever the "Decrypt Message" button is clicked.
                 * Will open a new modal where the user can decrypt a message.
                 *
                 * @param node
                 * @param fields
                 * @param errors
                 * @param form_control
                 * @param selected_server_domain
                 */
                onClickDecryptMessageButton: function(node, fields, errors, form_control, selected_server_domain){
                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal-decrypt-message-gpg.html',
                        controller: 'ModalDecryptMessageGPGCtrl',
                        backdrop: 'static',
                        resolve: {
                            secret_id: function() {
                                return node.secret_id;
                            }
                        }
                    });

                    modalInstance.result.then(function (data) {
                        // pass
                    }, function () {
                        // cancel triggered
                    });

                },
                onEditModalOpen: function(node) {
                    var showInEditOnly = [
                        "mail_gpg_own_key_title",
                        "mail_gpg_own_key_email",
                        "mail_gpg_own_key_name",
                        "mail_gpg_own_key_public",
                        "mail_gpg_own_key_encrypt_message",
                        "mail_gpg_own_key_decrypt_message"
                    ];
                    for (var i = 0; i < node.fields.length; i++) {
                        node.fields[i].hidden = !(showInEditOnly.indexOf(node.fields[i].name) > -1);
                    }
                },
                onNewModalOpen: function(node) {
                    var showInNewOnly = ["mail_gpg_own_key_generate_new", "mail_gpg_own_key_generate_import_text"];
                    for (var i = 0; i < node.fields.length; i++) {
                        node.fields[i].hidden = !(showInNewOnly.indexOf(node.fields[i].name) > -1);
                    }
                }
            },
            bookmark: {
                id: "bookmark", // Unique ID
                name: "Bookmark", // Displayed in Dropdown Menu
                title_field: "bookmark_title", // is the main column, that is used as filename
                urlfilter_field: "bookmark_url_filter", // is the filter column for url matching
                search: ['bookmark_title', 'bookmark_url_filter'], // are searched when the user search his entries
                fields: [ // All fields for this object with unique names
                    { name: "bookmark_title", field: "input", type: "text", title: "Title", placeholder: "Title", required: true},
                    { name: "bookmark_url", field: "input", type: "text", validationType: "url", title: "URL", placeholder: "URL", onChange: "onChangeUrl"},
                    { name: "bookmark_notes", field: "textarea", title: "Notes", placeholder: "Notes"},
                    { name: "bookmark_url_filter", field: "textarea", title: "Domain Filter", placeholder: "URL filter e.g. example.com or sub.example.com", position: "advanced"}
                ],
                /**
                 * triggered whenever url is changing.
                 * gets the fields and returns the default domain filter
                 *
                 * @param fields
                 * @returns {string}
                 */
                onChangeUrl: function(fields){

                    var url;
                    var domain_filter_col;

                    var i;
                    for (i = 0; i < fields.length; i++) {
                        if (fields[i].name === "bookmark_url") {
                            url = fields[i].value;
                            break;
                        }
                    }

                    for (i = 0; i < fields.length; i++) {
                        if (fields[i].name === "bookmark_url_filter") {
                            domain_filter_col = fields[i];
                            break;
                        }
                    }

                    if (typeof url === "undefined") {
                        domain_filter_col.value = "";
                        return "";
                    }

                    // get only toplevel domain
                    var parsed_url = helper.parse_url(url);

                    if (typeof(parsed_url.authority) === 'undefined') {
                        domain_filter_col.value = "";
                        return '';
                    } else {
                        domain_filter_col.value = parsed_url.authority;
                        return parsed_url.authority;
                    }
                },
                onClickNewTab: true,
                /**
                 * will open a new tab
                 *
                 * @param content
                 */
                onOpenSecret: function(content) {
                    $window.location.href = content.bookmark_url;
                }
            }/*,
            dummy: {
                id: "dummy",
                name: "Dummy",
                title_field: "dummy_title",
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
                fields: [
                    { name: "dummy_title", field: "input", type: "text", title: "Dummy field 1", placeholder: "Put your dummy 1 content here", required: true, tab: 'dummy_tab_2',
                        dropmenuItems:[
                            { icon: "fa fa-cogs", text:"Generate Password", onclick:function(id) { alert("Generate Password triggered " + id); } },
                            { icon: "fa fa-eye-slash", text:"Show Password", onclick:function(id) { alert("Show Password triggered " + id); } }
                        ]
                    },
                    { name: "dummy_notes", field: "textarea", title: "Dummy field 2", placeholder: "Put your dummy 2 content here", required: false, tab: 'dummy_tab_1',
                        dropmenuItems:[
                            { icon: "fa fa-cogs", text:"Generate Password", onclick:function(id) { alert("Generate Password triggered " + id); } },
                            { icon: "fa fa-eye-slash", text:"Show Password", onclick:function(id) { alert("Show Password triggered " + id); } }
                        ]
                    },
                    { name: "dummy_before", field: "input", title: "Before Tabs", placeholder: "Before tab", required: false,
                        dropmenuItems:[
                            { icon: "fa fa-cogs", text:"Generate Password", onclick:function(id) { alert("Generate Password triggered " + id); } },
                            { icon: "fa fa-eye-slash", text:"Show Password", onclick:function(id) { alert("Show Password triggered " + id); } }
                        ]
                    },
                    { name: "dummy_after", field: "input", title: "after Tabs", placeholder: "After tab", required: false, position: "after",
                        dropmenuItems:[
                            { icon: "fa fa-cogs", text:"Generate Password", onclick:function(id) { alert("Generate Password triggered " + id); } },
                            { icon: "fa fa-eye-slash", text:"Show Password", onclick:function(id) { alert("Show Password triggered " + id); } }
                        ]
                    }
                ]
            }*/
        };

        var _additionalFunction = {
            share: {
                id: 'share',
                name: 'Share',
                icon: 'fa fa-user-plus',
                ngClass: function(item) {
                    if (item.hasOwnProperty('share_rights') && item.share_rights.grant === false) {
                        return 'hidden';
                    }
                },
                onClick: function(item, path) {

                    if (item.hasOwnProperty('share_rights') && item.share_rights.grant === false) {
                        return;
                    }

                    /**
                     * little wrapper to create the share rights from the selected users / groups and rights for a given nonce and
                     * a given share_id and key
                     *
                     * @param share_id
                     * @param share_secret_key
                     * @param node
                     * @param users
                     * @param groups
                     * @param selected_users
                     * @param selected_groups
                     * @param selected_rights
                     */
                    var create_share_rights = function(share_id, share_secret_key, node, users, groups, selected_users, selected_groups, selected_rights) {
                        var i;

                        // found a user that has been selected, lets create the rights for him
                        var rights = {
                            read: selected_rights.indexOf('read') > -1,
                            write: selected_rights.indexOf('write') > -1,
                            grant: selected_rights.indexOf('grant') > -1
                        };

                        // generate the title
                        // TODO create form field with this default value and read value from form

                        var title = "";
                        if (typeof(node.type) === 'undefined') {
                            // we have a folder
                            title = "Folder with title '" + node.name + "'";
                        } else {
                            // we have an item
                            title = _blueprints[node.type].name + " with title '" + node.name + "'";
                        }

                        // get the type
                        var type = "";
                        if (typeof(node.type) === 'undefined') {
                            // we have a folder
                            type = 'folder';
                        } else {
                            // we have an item
                            type = node.type;
                        }

                        for (i = 0; i < users.length; i++) {
                            if (selected_users.indexOf(users[i].id) < 0) {
                                continue;
                            }
                            registrations['create_share_right'](title, type,
                                share_id, users[i].data.user_id, undefined,
                                users[i].data.user_public_key, undefined, share_secret_key,
                                rights['read'], rights['write'], rights['grant']);
                        }

                        for (i = 0; i < groups.length; i++) {
                            if (selected_groups.indexOf(groups[i].group_id) < 0) {
                                continue;
                            }

                            var group_secret_key = registrations['get_group_secret_key'](
                                groups[i].group_id, groups[i].secret_key, groups[i].secret_key_nonce,
                                groups[i].secret_key_type, groups[i].public_key);

                            registrations['create_share_right'](title, type,
                                share_id, undefined, groups[i].group_id,
                                undefined, group_secret_key, share_secret_key,
                                rights['read'], rights['write'], rights['grant']);
                        }
                    };

                    /**
                     * Users and or / shares have been selected in the modal and the final "Share Now" button was
                     * clicked
                     *
                     * @param content
                     */
                    var on_modal_close_success = function (content) {
                        // content = { node: "...", path: "...", selected_users: "...", users: "..."}

                        var has_no_users = !content.users
                            || content.users.length < 1
                            || !content.selected_users
                            || content.selected_users.length < 1;

                        var has_no_groups = !content.groups
                            || content.groups.length < 1
                            || !content.selected_groups
                            || content.selected_groups.length < 1;

                        if (has_no_users && has_no_groups) {
                            // TODO echo not shared message because no user / group selected
                            return;
                        }

                        if (content.node.hasOwnProperty("share_id")) {
                            // its already a share, so generate only the share_rights

                            create_share_rights(content.node.share_id, content.node.share_secret_key,
                                content.node, content.users, content.groups, content.selected_users, content.selected_groups, content.selected_rights);

                        } else {
                            // its not yet a share, so generate the share, generate the share_rights and update
                            // the datastore

                            registrations['get_password_datastore'](true).then(function(datastore) {

                                var path = content.path.slice();
                                var parent_share = registrations['get_closest_parent_share'](path, datastore, null, 1);
                                var parent_share_id;
                                var parent_datastore_id;

                                if (parent_share !== false && parent_share !== null) {
                                    parent_share_id = parent_share.share_id;
                                } else {
                                    parent_datastore_id = datastore.datastore_id;
                                }

                                // create the share
                                registrations['create_share'](content.node, parent_share_id, parent_datastore_id, content.node.id).then(function (share_details) {

                                    var item_path = content.path.slice();
                                    var item_path_copy = content.path.slice();
                                    var item_path_copy2 = content.path.slice();

                                    // create the share right
                                    create_share_rights(share_details.share_id, share_details.secret_key,
                                        content.node, content.users, content.groups, content.selected_users, content.selected_groups, content.selected_rights);


                                    // update datastore and / or possible parent shares
                                    var search = registrations['find_in_datastore'] (item_path, datastore);

                                    if (typeof(content.node.type) === 'undefined') {
                                        // we have an item
                                        delete search[0][search[1]].secret_id;
                                        delete search[0][search[1]].secret_key;
                                    }
                                    search[0][search[1]].share_id = share_details.share_id;
                                    search[0][search[1]].share_secret_key = share_details.secret_key;

                                    // update node in our displayed datastore
                                    content.node.share_id = share_details.share_id;
                                    content.node.share_secret_key = share_details.secret_key;

                                    var changed_paths = registrations['on_share_added'](share_details.share_id, item_path_copy, datastore, 1);

                                    var parent_path = item_path_copy2.slice();
                                    parent_path.pop();

                                    changed_paths.push(parent_path);

                                    registrations['save_datastore_content'](datastore, changed_paths);


                                });
                            });
                        }
                    };

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal-share-entry.html',
                        controller: 'ModalShareEntryCtrl',
                        backdrop: 'static',
                        resolve: {
                            node: function () {
                                return item;
                            },
                            path: function () {
                                return path;
                            }
                        }
                    });

                    // User clicked the final share button
                    modalInstance.result.then(on_modal_close_success, function () {
                        // cancel triggered
                    });
                }
            },
            show_share_rights: {
                id: 'show_share_rights',
                name: 'Rights Overview',
                icon: 'fa fa-list',
                ngClass: function(item) {
                    if (item.hasOwnProperty('share_rights') && item.share_rights.grant === false) {
                        return 'hidden';
                    }
                },
                condition: function(item) {
                    return item.hasOwnProperty('share_id');
                },
                onClick: function(item, path) {

                    if (item.hasOwnProperty('share_rights') && item.share_rights.grant === false) {
                        return;
                    }

                    // create the share
                    registrations['read_share_rights'](item.share_id).then(function (share_details) {

                        var modalInstance = $uibModal.open({
                            templateUrl: 'view/modal-display-share-rights.html',
                            controller: 'ModalDisplayShareRightsCtrl',
                            backdrop: 'static',
                            size: 'lg',
                            resolve: {
                                node: function () {
                                    return item;
                                },
                                path: function () {
                                    return path;
                                },
                                share_details: function() {
                                    return share_details;
                                }
                            }
                        });

                    });
                }
            },
            copy_username_to_clipboard: {
                id: 'copy_username_to_clipboard',
                name: 'Copy Username',
                icon: 'fa fa-clipboard',
                ngClass: function(item) {
                    if (item.hasOwnProperty('share_rights') && item.share_rights.read !== true) {
                        return 'hidden';
                    }
                },
                condition: function(item) {
                    return item.hasOwnProperty('type') && item['type'] === 'website_password';
                },
                onClick: function(item, path) {
                    registrations['copy_username'](item);
                }
            },
            copy_password_to_clipboard: {
                id: 'copy_password_to_clipboard',
                name: 'Copy Password',
                icon: 'fa fa-clipboard',
                ngClass: function(item) {
                    if (item.hasOwnProperty('share_rights') && item.share_rights.read !== true) {
                        return 'hidden';
                    }
                },
                condition: function(item) {
                    return item.hasOwnProperty('type') && item['type'] === 'website_password';
                },
                onClick: function(item, path) {
                    registrations['copy_password'](item);
                }
            }
        };

        /**
         * @ngdoc
         * @name psonocli.itemBlueprint#get_additional_functions
         * @methodOf psonocli.itemBlueprint
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

                if (_additionalFunction[property].hasOwnProperty('ngClass') && _additionalFunction[property].ngClass(item) === 'hidden') {
                    continue;
                }

                result.push(_additionalFunction[property]);
            }
            return result;
        };

        /**
         * @ngdoc
         * @name psonocli.itemBlueprint#get_blueprints
         * @methodOf psonocli.itemBlueprint
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
         * @name psonocli.itemBlueprint#get_blueprint
         * @methodOf psonocli.itemBlueprint
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
         * @name psonocli.itemBlueprint#get_default_blueprint_key
         * @methodOf psonocli.itemBlueprint
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
         * @name psonocli.itemBlueprint#get_default_blueprint
         * @methodOf psonocli.itemBlueprint
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
         * @name psonocli.itemBlueprint#has_advanced
         * @methodOf psonocli.itemBlueprint
         *
         * @description
         * analyzes the fields of an item following a blueprint to determine if any field has position advanced
         *
         * @param {object} blueprint_item The blueprint item with fields that we want to search
         * @returns {boolean} Returns if the items has fields with position advanced
         */
        var has_advanced = function (blueprint_item) {
            if (typeof(blueprint_item) === 'undefined') {
                return false;
            }
            for (var i = 0; i < blueprint_item.fields.length; i++) {
                if (blueprint_item.fields[i].hasOwnProperty('position') && blueprint_item.fields[i]['position'] === 'advanced') {
                    return true;
                }
            }

            return false;
        };

        /**
         * @ngdoc
         * @name psonocli.itemBlueprint#blueprint_has_on_click_new_tab
         * @methodOf psonocli.itemBlueprint
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
         * @name psonocli.itemBlueprint#blueprint_on_open_secret
         * @methodOf psonocli.itemBlueprint
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
         * @name psonocli.itemBlueprint#blueprint_msg_before_open_secret
         * @methodOf psonocli.itemBlueprint
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
            if (bp.hasOwnProperty('msgBeforeOpenSecret')) {
                return bp.msgBeforeOpenSecret(content);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.itemBlueprint#register
         * @methodOf psonocli.itemBlueprint
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
    app.factory("itemBlueprint", ['$rootScope', '$window', '$uibModal', 'helper', itemBlueprint]);

}(angular));
