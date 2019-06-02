(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.itemBlueprint
     * @requires $q
     * @requires browserClient
     * @requires $window
     * @requires $uibModal
     * @requires psonocli.helper
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.storage
     * @requires psonocli.managerFileTransfer
     * @requires psonocli.managerFileRepository
     *
     * @description
     * Service that provides the possible item blueprints e.g.:
     * - website_password
     * - note
     *
     * Should later be extended to provide licenses, files, ...
     */


    var itemBlueprint = function($q, browserClient, $window, $uibModal, helper, cryptoLibrary, storage, managerFileTransfer, managerFileRepository) {

        var _default = "website_password";
        var _shards = [];
        var _filesrepositories = [];

        var registrations = {};

        var _blueprint_website_password = {
            id: "website_password", // Unique ID
            name: "PASSWORD", // Displayed in Dropdown Menu
            title_field: "website_password_title", // is the main column, that is used as filename
            urlfilter_field: "website_password_url_filter", // is the filter column for url matching
            autosubmit_field: "website_password_auto_submit", // is the filter column for auto submit
            search: ['website_password_title', 'website_password_url_filter'], // are searched when the user search his entries
            fields: [ // All fields for this object with unique names
                { name: "website_password_title", field: "input", type: "text", title: "TITLE", placeholder: "TITLE", required: true},
                { name: "website_password_url", field: "input", type: "text", validationType: "url", title: "URL", placeholder: "URL", onChange: "onChangeUrl"},
                { name: "website_password_username", field: "input", type: "text", title: "USERNAME", placeholder: "USERNAME"},
                { name: "website_password_password", field: "input", type: "password", title: "PASSWORD", placeholder: "PASSWORD",
                    dropmenuItems:[
                        {
                            icon: "fa fa-eye-slash",
                            text:"SHOW_PASSWORD",
                            onclick:function(id, item) {
                                if (document.getElementById(id).type === 'text') {
                                    document.getElementById(id).type = 'password';
                                    item.text = 'SHOW_PASSWORD';
                                } else {
                                    document.getElementById(id).type = 'text';
                                    item.text = 'HIDE_PASSWORD';
                                }
                            }
                        },
                        {
                            icon: "fa fa-cogs",
                            text:"GENERATE_PASSWORD",
                            hide_offline: true,
                            hide_on_not_write: true,
                            onclick:function(id, item) {
                                angular.element(document.querySelector('#'+id)).val(registrations['generate']()).trigger('input');
                            }
                        }
                    ]},
                { name: "website_password_notes", field: "textarea", title: "NOTES", placeholder: "NOTES"},
                { name: "website_password_auto_submit", field: "input", type:"checkbox", title: "AUTOMATIC_SUBMIT", position: "advanced"},
                { name: "website_password_url_filter", field: "textarea", title: "DOMAIN_FILTER", placeholder: "URL_FILTER_EG", position: "advanced"}
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
        };
        var _blueprint_note = {
            id: "note",
            name: "NOTE",
            title_field: "note_title",
            search: ['note_title'],
            fields: [
                { name: "note_title", field: "input", type: "text", title: "TITLE", placeholder: "TITLE", required: true},
                { name: "note_notes", field: "textarea", title: "NOTES", placeholder: "NOTES"}
            ]
        };

        var _blueprint_file = {
            id: "file",
            name: "FILE",
            title_field: "file_title",
            search: ['file_title'],
            fields: [
                { name: "file_title", field: "input", type: "text", title: "TITLE", placeholder: "TITLE", required: true},
                { name: "file", field: "input", type: "file", title: "FILE", placeholder: "FILE", required: true, onChange: "onChangeData", hidden_edit: true},
                { name: "file_id", field: "input", title: "FILE_ID", placeholder: "FILE_ID", hidden: true},
                { name: "file_shard_id", field: "input", title: "FILE_SHARD_ID", placeholder: "FILE_SHARD_ID", hidden: true},
                { name: "file_repository_id", field: "input", title: "FILE_REPOSITORY_ID", placeholder: "FILE_REPOSITORY_ID", hidden: true},
                { name: "file_destinations", field: "select", title: "TARGET_STORAGE", placeholder: "TARGET_STORAGE", values: [], hidden: true},
                { name: "file_secret_key", field: "input", title: "FILE_SECRET_KEY", placeholder: "FILE_SECRET_KEY", hidden: true},
                { name: "file_size", field: "input", title: "FILE_SIZE", placeholder: "FILE_SIZE_BYTES", hidden: true},
                { name: "file_chunks", field: "input", type: "text", title: "FILE_CHUNKS", placeholder: "FILE_CHUNKS", hidden: true, value: {}},
            ],
            hide_history: true,
            hide_callback: true,
            hide_offline: true,
            non_secret_fields: ['file_title', 'file_id', 'file_shard_id', 'file_repository_id', 'file_secret_key', 'file_size', 'file_chunks'],

            /**
             * Initialize the blueprint
             *
             * @returns {array}
             */
            activate: function(){
                _blueprint_file.field_index = {};
                for (var i = 0; i < _blueprint_file.fields.length; i++) {
                    _blueprint_file.field_index[_blueprint_file.fields[i]['name']] = _blueprint_file.fields[i]
                }

                var promises = [];
                promises.push(_blueprint_file.getShards());
                promises.push(_blueprint_file.getFileRepositories());

                $q.all(promises).then(function() {
                    var shard_count = _shards.length;
                    var file_repository_count = _filesrepositories.length;
                    var all_possibilities_count = shard_count + file_repository_count;

                    _blueprint_file.field_index['file_destinations'].values = _shards.concat(_filesrepositories);

                    if (all_possibilities_count === 0) {
                        // no possiblity, the user will get an error anyway when he wants to create the file
                        return
                    }

                    if (shard_count > 0) {
                        // only shards are available, so lets pick the first shard as default shard
                        _blueprint_file.field_index['file_destinations'].value = _shards[0];
                    } else if (file_repository_count > 0) {
                        // only repositories are available, so lets pick the first repository as default repository
                        _blueprint_file.field_index['file_destinations'].value = _filesrepositories[0];
                    }

                    if (all_possibilities_count > 1) {
                        _blueprint_file.field_index['file_destinations'].hidden = false;
                    }
                });
            },

            /**
             * Loads the possible shards
             *
             * @returns {array}
             */
            getShards: function(){

                return managerFileTransfer.read_shards().then(function(shards){
                    shards = managerFileTransfer.filter_shards(shards, null, true);

                    for (var i = 0; i < shards.length; i++) {
                        shards[i]['name'] =  shards[i]['shard_title'];
                        shards[i]['destination_type'] =  'shard';
                    }

                    _shards = shards;
                });
            },

            /**
             * Loads the possible file repositories
             *
             * @returns {array}
             */
            getFileRepositories: function(){

                return managerFileRepository.read_file_repositories().then(function (file_repositories) {

                    file_repositories = managerFileRepository.filter_file_repositories(file_repositories, null, null, true, true);

                    for (var i = 0; i < file_repositories.length; i++) {
                        file_repositories[i]['name'] =  file_repositories[i]['title'];
                        file_repositories[i]['destination_type'] =  'file_repository';
                    }

                    _filesrepositories = file_repositories;
                });
            },

            /**
             * triggered whenever file data is changing.
             * gets the fields and sets the title field with the file name
             *
             * @param fields
             * @returns {string}
             */
            onChangeData: function(fields){

                var field_file_data;
                var field_file_title;

                var i;
                for (i = 0; i < fields.length; i++) {
                    if (fields[i].name === "file") {
                        field_file_data = fields[i];
                    }
                    if (fields[i].name === "file_title") {
                        field_file_title = fields[i];
                    }
                }

                if (!field_file_title.value && field_file_data.value) {
                    field_file_title.value=field_file_data.value.replace(/^.*[\\\/]/, '');
                }

            },

            /**
             * triggered before storing it.
             *
             * @param selected
             * @param parent
             * @param path
             */
            preCreate: function(selected, parent, path){

                var file_secret_key = cryptoLibrary.generate_secret_key();
                //var file_chunk_size = 8*1024*1024; // in bytes. e.g.   8*1024*1024 Bytes =   8 MB
                var file_chunk_size = 128*1024*1024; // in bytes. e.g. 128*1024*1024 Bytes = 128 MB

                if (typeof(selected['field_index']['file_destinations'].value) === 'undefined') {
                    return $q.reject(['NO_FILESERVER_AVAILABLE']);
                }

                var is_file_repository_upload = selected['field_index']['file_destinations'].value['destination_type'] ===  'file_repository';
                var is_file_shard_upload = selected['field_index']['file_destinations'].value['destination_type'] ===  'shard';

                var has_file_repository = _filesrepositories.length !== 0;
                var has_file_shard = _shards.length !== 0;

                if (!has_file_repository && !has_file_shard) {
                    return $q.reject(['NO_FILESERVER_AVAILABLE']);
                }

                if (is_file_repository_upload && is_file_shard_upload) {
                    return $q.reject(['SELECT_EITHER_SHARD_OR_REPOSITORY']);
                }

                if (!is_file_repository_upload && !is_file_shard_upload) {
                    return $q.reject(['SELECT_EITHER_SHARD_OR_REPOSITORY']);
                }

                var destination = selected['field_index']['file_destinations'].value;

                var file_repository_id = undefined;
                var shard_id = undefined;
                var file_repository = undefined;
                var shard = undefined;

                if (is_file_repository_upload) {
                    file_repository_id = destination['id'];
                    file_repository = destination;
                }
                if (is_file_shard_upload) {
                    shard_id = destination['id'];
                    shard = destination;
                }

                /**
                 * Uploads a file in chunks and returns the array of hashs
                 *
                 * @param shard
                 * @param file_repository
                 * @param file
                 * @param file_transfer_id
                 * @param {string} file_transfer_secret_key The hex encoded secret key for the file transfer
                 * @param file_secret_key
                 * @param file_chunk_size
                 *
                 * @returns {promise} Promise with the chunks uploaded
                 */
                function multi_chunk_upload(shard, file_repository, file, file_transfer_id, file_transfer_secret_key, file_secret_key, file_chunk_size) {

                    var on_load_end = function(bytes, chunk_size, file_secret_key, chunk_position, resolve) {
                        cryptoLibrary.encrypt_file(bytes, file_secret_key).then(function(encrypted_bytes) {
                            registrations['upload_step_complete']('HASHING_FILE_CHUNK');

                            var hash_checksum = cryptoLibrary.sha512(encrypted_bytes);

                            registrations['upload_step_complete']('UPLOADING_FILE_CHUNK');

                            managerFileTransfer.upload(new Blob([encrypted_bytes], {type: 'application/octet-stream'}), file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, shard, file_repository, hash_checksum).then(function() {
                                return resolve({
                                    'chunk_position': chunk_position,
                                    'hash_checksum': hash_checksum
                                })
                            });
                        });
                    };

                    var read_file_chunk = function(file, file_slice_start, chunk_size, on_load_end, file_secret_key, chunk_position, resolve) {
                        var file_reader = new FileReader();
                        var file_slice;

                        file_reader.onloadend = function(event) {
                            var bytes = new Uint8Array(event.target.result);
                            on_load_end(bytes, chunk_size, file_secret_key, chunk_position, resolve);
                        };

                        file_slice = file.slice(file_slice_start, file_slice_start + chunk_size);

                        file_reader.readAsArrayBuffer(file_slice);

                    };



                    var chunk_position = 1;
                    var file_slice_start = 0;
                    var chunks = {};
                    var max_chunks = Math.ceil(file.size / file_chunk_size);

                    registrations['upload_started'](max_chunks * 3 + 1);

                    // new sequential approach
                    function read_next_chunk() {

                        var chunk_size = Math.min(file_chunk_size, file.size-file_slice_start);
                        if (chunk_size === 0) {
                            registrations['upload_complete']();
                            return $q.resolve(chunks);
                        }

                        registrations['upload_step_complete']('ENCRYPTING_FILE_CHUNK');

                        var defer_single = $q.defer();
                        read_file_chunk(file, file_slice_start, chunk_size, on_load_end, file_secret_key, chunk_position, defer_single.resolve);

                        file_slice_start = file_slice_start + chunk_size;
                        chunk_position = chunk_position + 1;

                        return defer_single.promise.then(function(chunk) {
                            chunks[chunk['chunk_position']] = chunk['hash_checksum'];
                            return read_next_chunk();
                        });
                    }

                    return read_next_chunk();

                    // old parallel approach
                    // var secret_promise_array = [];
                    // var is_first = true;
                    // var defer = $q.defer();
                    //
                    // while (file_slice_start <= file.size) {
                    //     var bytes_to_go = Math.min(file_chunk_size, file.size-file_slice_start);
                    //     if (bytes_to_go === 0 && !is_first) {
                    //         break;
                    //     }
                    //     var defer_single = $q.defer();
                    //     secret_promise_array.push($q.when(defer_single.promise.then(function(chunk) {
                    //         chunks[chunk['chunk_position']] = chunk['hash_checksum'];
                    //         return;
                    //     })));
                    //     read_file_chunk(file, file_slice_start, bytes_to_go, on_load_end, file_secret_key, chunk_position, defer_single.resolve);
                    //     file_slice_start = file_slice_start + bytes_to_go;
                    //     is_first = false;
                    //     chunk_position = chunk_position + 1;
                    // }
                    //
                    // $q.all(secret_promise_array).then(function() {
                    //     defer.resolve(chunks);
                    // });
                    //
                    // return defer.promise;
                }

                /**
                 * Takes a dom field and returns the first file or nothing
                 *
                 * @param dom_field
                 * @returns {*}
                 */
                function get_dom_file(dom_field) {
                    if (dom_field.files.length <= 0) {
                        return;
                    }
                    return dom_field.files[0];
                }


                function get_dom_file_field(selected_fields) {

                    for (var i = 0; i < selected_fields.length; i++) {
                        var field = selected_fields[i];
                        if (!field.hasOwnProperty("type") || field['type'] !== 'file' ) {
                            continue;
                        }

                        if (angular.element('#newEntryForm-' + field['name']).length > 0) {
                            return angular.element('#newEntryForm-' + field['name'])[0];
                        }
                    }

                    return false;
                }

                var dom_field = get_dom_file_field(selected.fields);

                selected.skipSecretCreate = true;

                if (!dom_field) {
                    return $q.reject(['NO_FILE_SELECTED']);
                }
                var file = get_dom_file(dom_field);
                if (!file) {
                    return $q.reject(['NO_FILE_SELECTED']);
                }

                var onSuccess = function(data){
                    return multi_chunk_upload(shard, file_repository, file, data['file_transfer_id'], data['file_transfer_secret_key'], file_secret_key, file_chunk_size).then(function(chunks) {
                        for (var i = 0; i < selected.fields.length; i++) {
                            if (selected.fields[i].name === 'file_chunks') {
                                selected.fields[i].value = chunks;
                            }
                            if (selected.fields[i].name === 'file_id') {
                                selected.fields[i].value = data['file_id'];
                            }
                            if (selected.fields[i].name === 'file_secret_key') {
                                selected.fields[i].value = file_secret_key;
                            }
                            if (selected.fields[i].name === 'file_shard_id' && shard && shard.hasOwnProperty('id')) {
                                selected.fields[i].value = shard['id'];
                            }
                            if (selected.fields[i].name === 'file_repository_id' && file_repository && file_repository.hasOwnProperty('id')) {
                                selected.fields[i].value = file_repository['id'];
                            }
                        }
                    })
                };

                var onError = function(data) {
                    if (data.hasOwnProperty('non_field_errors') && data.non_field_errors.length > 0) {
                        return $q.reject(data.non_field_errors)
                    } else {
                        console.log(data);
                        alert("Error, should not happen.");
                    }
                };

                var chunk_count = Math.ceil(file.size / file_chunk_size);
                var size = file.size;

                var parent_datastore_id = undefined;
                var parent_share_id = undefined;

                if (parent.hasOwnProperty("share_id")) {
                    parent_share_id = parent.share_id;
                } else if(parent.hasOwnProperty("datastore_id")) {
                    parent_datastore_id = parent.datastore_id;
                } else if(parent.hasOwnProperty("parent_datastore_id") && typeof(parent.parent_datastore_id) !== 'undefined') {
                    parent_datastore_id = parent.parent_datastore_id;
                } else if(parent.hasOwnProperty("parent_share_id") && typeof(parent.parent_share_id) !== 'undefined') {
                    parent_share_id = parent.parent_share_id;
                }

                if (size === 0) {
                    return $q.resolve()
                }

                return managerFileTransfer.create_file(shard_id, file_repository_id, size + chunk_count * 40, chunk_count, selected['link_id'], parent_datastore_id, parent_share_id)
                    .then(onSuccess, onError);
            },


            /**
             * triggered before updating it.
             *
             * @param node
             * @param secret_object
             */
            preUpdate: function(node, secret_object){
                var keys = Object.keys(secret_object);
                for (var i = 0; i < keys.length; i++) {
                    node[keys[i]] = secret_object[keys[i]];
                }
                return $q.resolve()
            }
        };

        var _blueprint_mail_gpg_own_key = {
            id: "mail_gpg_own_key",
            name: "GPG_KEY",
            title_field: "mail_gpg_own_key_title",
            search: ['mail_gpg_own_key_title', 'mail_gpg_own_key_email'],
            fields: [
                { name: "mail_gpg_own_key_title", field: "input", type: "text", title: "TITLE", hidden: true, placeholder: "TITLE", required: true},
                { name: "mail_gpg_own_key_email", field: "input", type: "text", title: "EMAIL", placeholder: "EMAIL", hidden: true, readonly: true},
                { name: "mail_gpg_own_key_name", field: "input", type: "text", title: "NAME", placeholder: "NAME", hidden: true, readonly: true},
                { name: "mail_gpg_own_key_public", field: "textarea", title: "PUBLIC_KEY", placeholder: "PUBLIC_KEY", hidden: true, readonly: true},
                { name: "mail_gpg_own_key_private", field: "textarea", title: "PRIVATE_KEY", placeholder: "PRIVATE_KEY", hidden: true, readonly: true},
                { name: "mail_gpg_own_key_publish", field: "input", type:"checkbox", title: "PUBLISH_PUBLIC_KEY", hidden: true},
                { name: "mail_gpg_own_key_generate_new", field: "button", type: "button", title: "GENERATE_NEW_GPG_KEY", hidden: true, class: 'btn-primary', onClick:"onClickGenerateNewButton" },
                { name: "mail_gpg_own_key_generate_import_text", field: "button", type: "button", title: "IMPORT_AS_TEXT", hidden: true, class: 'btn-primary', onClick:"onClickImportAsTextButton" },
                { name: "mail_gpg_own_key_encrypt_message", field: "button", type: "button", title: "ENCRYPT_MESSAGE", hidden: true, class: 'btn-default', onClick:"onClickEncryptMessageButton" },
                { name: "mail_gpg_own_key_decrypt_message", field: "button", type: "button", title: "DECRYPT_MESSAGE", hidden: true, class: 'btn-default', onClick:"onClickDecryptMessageButton" }
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
                    templateUrl: 'view/modal/generate-new-mail-gpg-key.html',
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
                    templateUrl: 'view/modal/import-mail-gpg-key-as-text.html',
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
                    templateUrl: 'view/modal/encrypt-message-gpg.html',
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
                    templateUrl: 'view/modal/decrypt-message-gpg.html',
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
        };

        var _blueprint_bookmark = {
            id: "bookmark", // Unique ID
            name: "BOOKMARK", // Displayed in Dropdown Menu
            title_field: "bookmark_title", // is the main column, that is used as filename
            urlfilter_field: "bookmark_url_filter", // is the filter column for url matching
            search: ['bookmark_title', 'bookmark_url_filter'], // are searched when the user search his entries
            fields: [ // All fields for this object with unique names
                { name: "bookmark_title", field: "input", type: "text", title: "TITLE", placeholder: "TITLE", required: true},
                { name: "bookmark_url", field: "input", type: "text", validationType: "url", title: "URL", placeholder: "URL", onChange: "onChangeUrl"},
                { name: "bookmark_notes", field: "textarea", title: "NOTES", placeholder: "NOTES"},
                { name: "bookmark_url_filter", field: "textarea", title: "DOMAIN_FILTER", placeholder: "URL_FILTER_EG", position: "advanced"}
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
        };

        var _blueprints = {
            website_password: _blueprint_website_password,
            note: _blueprint_note,
            mail_gpg_own_key: _blueprint_mail_gpg_own_key,
            bookmark: _blueprint_bookmark
            // dummy: {
            //     id: "dummy",
            //     name: "Dummy",
            //     title_field: "dummy_title",
            //     search: ['dummy_title'],
            //     tabs: [
            //         {
            //             id: "dummy_tab_1",
            //             title: "Title of Tab 1"
            //         },
            //         {
            //             id: "dummy_tab_2",
            //             title:"Title of Tab 2"
            //         }
            //     ],
            //     fields: [
            //         { name: "dummy_title", field: "input", type: "text", title: "Dummy field 1", placeholder: "Put your dummy 1 content here", required: true, tab: 'dummy_tab_2',
            //             dropmenuItems:[
            //                 { icon: "fa fa-cogs", text:"Generate Password", onclick:function(id) { alert("Generate Password triggered " + id); } },
            //                 { icon: "fa fa-eye-slash", text:"Show Password", onclick:function(id) { alert("Show Password triggered " + id); } }
            //             ]
            //         },
            //         { name: "dummy_notes", field: "textarea", title: "Dummy field 2", placeholder: "Put your dummy 2 content here", required: false, tab: 'dummy_tab_1',
            //             dropmenuItems:[
            //                 { icon: "fa fa-cogs", text:"Generate Password", onclick:function(id) { alert("Generate Password triggered " + id); } },
            //                 { icon: "fa fa-eye-slash", text:"Show Password", onclick:function(id) { alert("Show Password triggered " + id); } }
            //             ]
            //         },
            //         { name: "dummy_before", field: "input", title: "Before Tabs", placeholder: "Before tab", required: false,
            //             dropmenuItems:[
            //                 { icon: "fa fa-cogs", text:"Generate Password", onclick:function(id) { alert("Generate Password triggered " + id); } },
            //                 { icon: "fa fa-eye-slash", text:"Show Password", onclick:function(id) { alert("Show Password triggered " + id); } }
            //             ]
            //         },
            //         { name: "dummy_after", field: "input", title: "after Tabs", placeholder: "After tab", required: false, position: "after",
            //             dropmenuItems:[
            //                 { icon: "fa fa-cogs", text:"Generate Password", onclick:function(id) { alert("Generate Password triggered " + id); } },
            //                 { icon: "fa fa-eye-slash", text:"Show Password", onclick:function(id) { alert("Show Password triggered " + id); } }
            //             ]
            //         }
            //     ]
            // }
        };



        var _additionalFunction = {
            share: {
                id: 'share',
                name: 'SHARE',
                icon: 'fa fa-user-plus',
                hide_offline: true,
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

                            registrations['get_password_datastore']().then(function(datastore) {

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
                        templateUrl: 'view/modal/share-entry.html',
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
            link_share: {
                id: 'link_share',
                name: 'LINK_SHARE',
                icon: 'fa fa-link',
                hide_offline: true,
                ngClass: function(item) {
                    if (!item.hasOwnProperty('type')) {
                        return 'hidden';
                    }
                    if (item.hasOwnProperty('share_rights') && item.share_rights.grant === false) {
                        return 'hidden';
                    }
                    if (!server_supports_link_shares()) {
                        return 'hidden'
                    }
                },
                onClick: function(item, path) {

                    if (item.hasOwnProperty('share_rights') && item.share_rights.grant === false) {
                        return;
                    }

                    /**
                     * User clicked the "Create" button
                     *
                     * @param content
                     */
                    var on_modal_close_success = function (content) {
                        console.log(content)
                    };

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/create-link-share.html',
                        controller: 'ModalCreateLinkShareCtrl',
                        backdrop: 'static',
                        resolve: {
                            node: function () {
                                return item;
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
                name: 'RIGHTS_OVERVIEW',
                icon: 'fa fa-list',
                hide_offline: true,
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
                            templateUrl: 'view/modal/display-share-rights.html',
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
                name: 'COPY_USERNAME',
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
                name: 'COPY_PASSWORD',
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

        activate();

        function activate() {
            if (server_supports_files()) {
                _blueprints.file = _blueprint_file
            }

            browserClient.on("login", function () {
                if (server_supports_files()) {
                    _blueprints.file = _blueprint_file
                } else if (_blueprints.hasOwnProperty('file')){
                    delete _blueprints.file;
                }
            });
        }

        /**
         * @ngdoc
         * @name psonocli.itemBlueprint#server_supports_files
         * @methodOf psonocli.itemBlueprint
         *
         * @description
         * returns whether the server supports files or not
         *
         * @returns {boolean} returns whether the server supports files or not
         */
        function server_supports_files() {
            return storage.find_key('config', 'server_info') && storage.find_key('config', 'server_info').value && storage.find_key('config', 'server_info').value.hasOwnProperty('files') && storage.find_key('config', 'server_info').value['files']
        }

        /**
         * @ngdoc
         * @name psonocli.itemBlueprint#server_supports_link_shares
         * @methodOf psonocli.itemBlueprint
         *
         * @description
         * returns whether the server supports link shares or not
         *
         * @returns {boolean} returns whether the server supports link shares or not
         */
        function server_supports_link_shares() {
            return storage.find_key('config', 'server_info') && storage.find_key('config', 'server_info').value && (!storage.find_key('config', 'server_info').value.hasOwnProperty('compliance_disable_link_shares') || ! storage.find_key('config', 'server_info').value['compliance_disable_link_shares'])
        }

        /**
         * @ngdoc
         * @name psonocli.itemBlueprint#server_credit_buy_address
         * @methodOf psonocli.itemBlueprint
         *
         * @description
         * returns the servers credit buy address if it has one or false
         *
         * @returns {boolean} returns whether the servers credit buy address
         */
        function server_credit_buy_address() {

            var has_buy_address = storage.find_key('config', 'server_info') && storage.find_key('config', 'server_info').value && storage.find_key('config', 'server_info').value.hasOwnProperty('credit_buy_address');
            if(!has_buy_address) {
                return false;
            }
            return storage.find_key('config', 'server_info').value['credit_buy_address'];
        }

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
        function get_additional_functions(item) {

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
        }

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
        function get_blueprints() {

            var result = [];

            for (var property in _blueprints) {
                if (_blueprints.hasOwnProperty(property)) {
                    result.push(_blueprints[property])
                }
            }
            return result;
        }

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
        function get_blueprint(key) {
            if (_blueprints.hasOwnProperty(key)){
                return angular.copy(_blueprints[key]);
            } else {
                return false;
            }
        }


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
        function get_default_blueprint_key() {
            return _default;
        }

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
        function get_default_blueprint() {
            return get_blueprint(get_default_blueprint_key());
        }

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
        function blueprint_has_on_click_new_tab(key) {
            var bp = get_blueprint(key);
            return !!(bp && bp.onClickNewTab);
        }

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
        function blueprint_on_open_secret(key, content) {
            var bp = get_blueprint(key);
            if (bp.hasOwnProperty('onOpenSecret')) {
                bp.onOpenSecret(content);
            }
        }

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
        function blueprint_msg_before_open_secret(key, content) {
            var bp = get_blueprint(key);
            if (bp.hasOwnProperty('msgBeforeOpenSecret')) {
                return bp.msgBeforeOpenSecret(content);
            }
        }

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
            blueprint_has_on_click_new_tab: blueprint_has_on_click_new_tab,
            blueprint_on_open_secret: blueprint_on_open_secret,
            blueprint_msg_before_open_secret: blueprint_msg_before_open_secret,
            register: register,
            server_credit_buy_address: server_credit_buy_address
        };
    };

    var app = angular.module('psonocli');
    app.factory("itemBlueprint", ['$q', 'browserClient', '$window', '$uibModal', 'helper', 'cryptoLibrary', 'storage', 'managerFileTransfer', 'managerFileRepository', itemBlueprint]);

}(angular));
