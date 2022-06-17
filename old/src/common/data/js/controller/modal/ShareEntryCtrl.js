(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalShareEntryCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires $uibModal
     * @requires DTOptionsBuilder
     * @requires DTColumnDefBuilder
     * @requires psonocli.shareBlueprint
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.helper
     * @requires psonocli.languagePicker
     *
     * @description
     * Controller for the "Share Entry" modal
     */
    angular.module('psonocli').controller('ModalShareEntryCtrl', ['$scope', '$uibModalInstance', '$uibModal', 'shareBlueprint',
        'managerDatastoreUser', 'managerDatastorePassword', 'managerGroups', 'node', 'path', 'DTOptionsBuilder', 'DTColumnDefBuilder', 'cryptoLibrary', 'helper', 'languagePicker',
        function ($scope, $uibModalInstance, $uibModal, shareBlueprint,
                  managerDatastoreUser, managerDatastorePassword, managerGroups, node, path, DTOptionsBuilder, DTColumnDefBuilder, cryptoLibrary, helper, languagePicker) {

            $scope.add_user = add_user;
            $scope.create_group = create_group;
            $scope.toggle_select = toggle_select;
            $scope.save = save;
            $scope.cancel = cancel;
            $scope.allow_create_groups = managerGroups.allow_create_groups();

            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withLanguageSource('translations/datatables.' + languagePicker.get_active_language_code() + '.json');

            $scope.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1).notSortable()
            ];

            $scope.node = node;
            $scope.path = path;
            $scope.users = [];
            $scope.errors = [];

            $scope.selected_users = [];
            $scope.selected_groups = [];
            $scope.selected_rights = [];

            activate();

            function activate() {

                $scope.rights = [{
                    id: 'read',
                    name: 'READ',
                    initial_value: true
                }, {
                    id: 'write',
                    name: 'WRITE',
                    initial_value: false
                }, {
                    id: 'grant',
                    name: 'ADMIN',
                    initial_value: false
                }];

                // fills selected_rights array with the default values
                for (var i = $scope.rights.length - 1; i >= 0; i--) {
                    if ($scope.rights[i].initial_value) {
                        $scope.selected_rights.push($scope.rights[i].id);
                    }
                }

                // The main modal to share
                managerDatastoreUser.get_user_datastore().then(function (user_datastore) {
                    var users = [];
                    helper.create_list(user_datastore, users);
                    $scope.users = users;
                });

                managerGroups.read_groups(true)
                    .then(function (groups) {
                        helper.remove_from_array(groups, '', function(a, b){
                            return !a.share_admin;
                        });
                        $scope.groups = groups;
                    });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalShareEntryCtrl#create_group
             * @methodOf psonocli.controller:ModalShareEntryCtrl
             *
             * @description
             * Opens the modal for a new group
             *
             * @param {string} size The size of the modal to open
             */
            function create_group(size) {
                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/new-group.html',
                    controller: 'ModalNewGroupCtrl',
                    size: size,
                    resolve: {}
                });

                modalInstance.result.then(function (name) {

                    var onSuccess = function(group){
                        $scope.groups.push(group);
                    };

                    var onError = function() {
                        //pass
                    };
                    managerGroups.create_group(name)
                        .then(onSuccess, onError)

                }, function () {
                    // cancel triggered
                });
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalShareEntryCtrl#add_user
             * @methodOf psonocli.controller:ModalShareEntryCtrl
             *
             * @description
             * responsible to add a user to the known users datastore
             */
            function add_user() {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/new-entry.html',
                    controller: 'ModalShareNewEntryCtrl',
                    backdrop: 'static',
                    resolve: {
                        parent: function () {
                        },
                        path: function () {
                            return [];
                        },
                        hide_advanced: function () {
                            return true
                        },
                        hide_history: function () {
                            return true
                        }
                    }
                });

                modalInstance.result.then(function (content) {

                    managerDatastoreUser.get_user_datastore()
                        .then(function (parent) {

                            if (typeof parent.items === 'undefined') {
                                parent.items = [];
                            }

                            var user_object = {
                                id: cryptoLibrary.generate_uuid(),
                                type: content.id,
                                data: {}
                            };

                            if (shareBlueprint.get_blueprint(content.id).getName) {
                                user_object.name = shareBlueprint.get_blueprint(content.id).getName(content.fields);
                            }

                            for (var i = content.fields.length - 1; i >= 0; i--) {

                                if (!content.fields[i].hasOwnProperty("value")) {
                                    continue;
                                }
                                if (!user_object.name && content.title_field === content.fields[i].name) {
                                    user_object.name = content.fields[i].value;
                                }
                                if (content.hasOwnProperty("urlfilter_field")
                                    && content.urlfilter_field === content.fields[i].name) {
                                    user_object.urlfilter = content.fields[i].value;
                                }
                                user_object.data[content.fields[i].name] = content.fields[i].value;
                            }

                            // check if we do not already have the user in our trusted user datastore
                            // skip if we already have it
                            var existing_locations = managerDatastorePassword.search_in_datastore(user_object, parent, function(a, b) {
                                if (!a.hasOwnProperty('data')) {
                                    return false
                                }
                                if (!b.hasOwnProperty('data')) {
                                    return false
                                }
                                if (!a['data'].hasOwnProperty('user_public_key')) {
                                    return false
                                }
                                if (!b['data'].hasOwnProperty('user_public_key')) {
                                    return false
                                }
                                return a['data']['user_public_key'] === b['data']['user_public_key']
                            });

                            if (existing_locations.length < 1) {
                                parent.items.push(user_object);
                                managerDatastoreUser.save_datastore_content(parent).then(function() {
                                    $scope.users.push(user_object);
                                    $scope.selected_users.push(user_object.id);
                                }, function() {
                                    // TODO handle error
                                });
                            } else {
                                $scope.users.push(user_object);
                                $scope.selected_users.push(user_object.id);
                            }
                        });

                }, function () {
                    // cancel triggered
                });
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalShareEntryCtrl#toggle_select
             * @methodOf psonocli.controller:ModalShareEntryCtrl
             *
             * @description
             * responsible to toggle selections of rights and users and adding it to the selected_rights / selected_users
             * array
             *
             * @param {int} index The index of the right in the array
             * @param {string} type The type of the toggle
             */
            function toggle_select(index, type) {

                var search_array;
                if (type === 'right') {
                    search_array = $scope.selected_rights;
                } else if (type === 'user') {
                    search_array = $scope.selected_users;
                } else {
                    search_array = $scope.selected_groups;
                }

                var array_index = search_array.indexOf(index);
                if (array_index > -1) {
                    //its selected, lets deselect it
                    search_array.splice(array_index, 1);
                } else {
                    search_array.push(index);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalShareEntryCtrl#save
             * @methodOf psonocli.controller:ModalShareEntryCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save () {
                $uibModalInstance.close({
                    node: $scope.node,
                    path: $scope.path,
                    users: $scope.users,
                    groups: $scope.groups,
                    selected_users: $scope.selected_users,
                    selected_groups: $scope.selected_groups,
                    rights: $scope.rights,
                    selected_rights: $scope.selected_rights
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalShareEntryCtrl#cancel
             * @methodOf psonocli.controller:ModalShareEntryCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));