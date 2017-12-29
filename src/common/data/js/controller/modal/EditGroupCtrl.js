(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditGroupCtrl
     * @requires $scope
     * @requires $uibModal
     * @requires $uibModalInstance
     * @requires psonocli.managerGroups
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.helper
     * @requires psonocli.account
     *
     * @description
     * Controller for the "Edit Group" modal
     */
    angular.module('psonocli').controller('ModalEditGroupCtrl', ['$scope', '$uibModal', '$uibModalInstance',
        'managerGroups', 'managerDatastoreUser', 'shareBlueprint', 'cryptoLibrary', 'helper', 'account', 'group_id',
        function ($scope, $uibModal, $uibModalInstance,
                  managerGroups, managerDatastoreUser, shareBlueprint, cryptoLibrary, helper, account, group_id) {
            var i;
            var original_group_name;
            var group;
            var _group_member_index = {};

            $scope.add_user = add_user;
            $scope.is_member = is_member;
            $scope.save = save;
            $scope.cancel = cancel;
            $scope.toggle_user = toggle_user;
            $scope.toggle_group_admin = toggle_group_admin;


            $scope.users = [];

            activate();

            function activate() {


                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(group_details) {

                    var user_id = account.get_account_detail('user_id');
                    group = group_details;
                    $scope.group_name = group_details.name;
                    original_group_name = group_details.name;

                    managerDatastoreUser.get_user_datastore().then(function (user_datastore) {
                        var users = [];
                        var trusted_users = [];
                        helper.create_list(user_datastore, trusted_users);

                        for (i = 0; i < group_details.members.length; i++) {
                            _group_member_index[group_details.members[i].id] = group_details.members[i];
                            group_details.members[i]['is_current_user'] = group_details.members[i].id === user_id;
                            users.push(group_details.members[i]);
                        }

                        for (i = 0; i < trusted_users.length; i++) {
                            if (_group_member_index.hasOwnProperty(trusted_users[i].data.user_id)) {
                                continue;
                            }
                            users.push({
                                'id': trusted_users[i].data.user_id,
                                'name': trusted_users[i].data.user_username,
                                'public_key': trusted_users[i].data.user_public_key,
                                'is_current_user': trusted_users[i].data.user_id === user_id
                            });
                        }
                        $scope.users = users;
                        $scope.shares = group_details.group_share_rights;
                        for (var i = 0; i < $scope.shares.length; i++) {
                            $scope.shares[i].title = managerGroups.decrypt_secret_key(group_id, $scope.shares[i].title, $scope.shares[i].title_nonce);
                        }

                    });
                };

                managerGroups.read_group(group_id).then(onSuccess, onError);
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGroupCtrl#add_user
             * @methodOf psonocli.controller:ModalEditGroupCtrl
             *
             * @description
             * responsible to add a user to the known users datastore
             */
            function add_user() {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-new-entry.html',
                    controller: 'ModalShareNewEntryCtrl',
                    backdrop: 'static',
                    resolve: {
                        parent: function () {
                        },
                        path: function () {
                            return [];
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

                            parent.items.push(user_object);

                            managerDatastoreUser.save_datastore_content(parent).then(function() {
                                $scope.users.push({
                                    'id': user_object.data.user_id,
                                    'name': user_object.name,
                                    'public_key': user_object.data.user_public_key
                                });
                            }, function() {
                                // TODO handle error
                            });
                        });

                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGroupCtrl#is_member
             * @methodOf psonocli.controller:ModalEditGroupCtrl
             *
             * @description
             * Looks up if a user is a member of the current group or not
             *
             * @param {object} user The User to lookup
             *
             * @returns {boolean} Returns weather the user is a member or not
             */
            function is_member(user) {
                return _group_member_index.hasOwnProperty(user.id);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGroupCtrl#save
             * @methodOf psonocli.controller:ModalEditGroupCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {

                if ($scope.editGroupForm.$invalid) {
                    return;
                }
                var new_group_name;
                if (original_group_name !== $scope.group_name) {


                    $scope.errors = [];
                    var test_result;

                    test_result = helper.is_valid_group_name($scope.group_name);

                    if (test_result !== true) {
                        $scope.errors.push(test_result);
                        return;
                    }

                    new_group_name = $scope.group_name;
                }

                $uibModalInstance.close(new_group_name);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGroupCtrl#cancel
             * @methodOf psonocli.controller:ModalEditGroupCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGroupCtrl#create_membership
             * @methodOf psonocli.controller:ModalEditGroupCtrl
             *
             * @description
             * Grants a user membership status of a group
             *
             * @param {object} user The user to grant the membership status
             */
            function create_membership(user) {

                var onError = function(result) {
                    // pass
                    console.log(result);
                };

                var onSuccess = function(result) {
                    user['membership_id'] = result.membership_id;
                    user['group_admin'] = false;
                    user['is_current_user'] = false;
                    _group_member_index[user['id']] = user

                };

                managerGroups.create_membership(user, group).then(onSuccess, onError)
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGroupCtrl#delete_membership
             * @methodOf psonocli.controller:ModalEditGroupCtrl
             *
             * @description
             * Revokes a user membership status of a group
             *
             * @param {object} user The user to revoke the membership status
             */
            function delete_membership(user) {

                var onError = function(result) {
                    // pass
                    console.log(result);
                };

                var onSuccess = function(result) {
                    // pass
                    delete user['membership_id'];
                    delete user['group_admin'];
                    delete _group_member_index[user['id']];

                };

                managerGroups.delete_membership(user['membership_id']).then(onSuccess, onError)

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGroupCtrl#toggle_user
             * @methodOf psonocli.controller:ModalEditGroupCtrl
             *
             * @description
             * responsible to toggle selections of users and adding it to the group or removing it
             */
            function toggle_user(user) {
                if (! is_member(user)) {
                    return create_membership(user);
                } else {
                    return delete_membership(user);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditGroupCtrl#toggle_group_admin
             * @methodOf psonocli.controller:ModalEditGroupCtrl
             *
             * @description
             * responsible to toggle the group admin right of a user
             */
            function toggle_group_admin(user) {

                var onError = function(result) {
                    // pass
                    console.log(result);
                };

                var onSuccess = function(result) {
                    user['group_admin'] = !user['group_admin'];
                };

                managerGroups.update_membership(user['membership_id'], !user['group_admin']).then(onSuccess, onError)
            }
        }]);

}(angular));
