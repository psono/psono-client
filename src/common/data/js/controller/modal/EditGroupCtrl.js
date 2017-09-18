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
     *
     * @description
     * Controller for the "Edit Group" modal
     */
    angular.module('psonocli').controller('ModalEditGroupCtrl', ['$scope', '$uibModal', '$uibModalInstance',
        'managerGroups', 'managerDatastoreUser', 'shareBlueprint', 'cryptoLibrary', 'helper', 'group',
        function ($scope, $uibModal, $uibModalInstance,
                  managerGroups, managerDatastoreUser, shareBlueprint, cryptoLibrary, helper, group) {
            var i;

            $scope.add_user = add_user;
            $scope.is_member = is_member;
            $scope.save = save;
            $scope.cancel = cancel;

            $scope.users = [];

            var group_member_index = {};

            activate();

            function activate() {


                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(group_details) {

                    $scope.group_details = group_details;

                    managerDatastoreUser.get_user_datastore().then(function (user_datastore) {
                        var users = [];
                        var trusted_users = [];
                        helper.create_list(user_datastore, trusted_users);

                        for (i = 0; i < group_details.members.length; i++) {
                            group_member_index[group_details.members[i].id] = group_details.members[i];
                            users.push(group_details.members[i]);
                        }

                        for (i = 0; i < trusted_users.length; i++) {
                            if (group_member_index.hasOwnProperty(trusted_users[i].id)) {
                                continue;
                            }
                            users.push({
                                'id': trusted_users[i].id,
                                'name': trusted_users[i].name
                            });
                        }

                        $scope.users = users;
                        $scope.shares = group_details.group_share_rights;
                        console.log($scope.shares);
                    });
                };

                managerGroups.read_group(group.group_id).then(onSuccess, onError);
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
                                if (content.hasOwnProperty("autosubmit_field")
                                    && content.autosubmit_field === content.fields[i].name) {
                                    user_object.autosubmit = content.fields[i].value;
                                }
                                user_object.data[content.fields[i].name] = content.fields[i].value;
                            }

                            parent.items.push(user_object);

                            managerDatastoreUser.save_datastore_content(parent).then(function() {

                                $scope.users.push({
                                    'id': user_object.id,
                                    'name': user_object.name
                                });
                                $scope.selected_users.push(user_object.id);
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
             * @param {{}} user The User to lookup
             *
             * @returns {boolean} Returns weather the user is a member or not
             */
            function is_member(user) {
                return group_member_index.hasOwnProperty(user.id);
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

                if ($scope.newGroupForm.$invalid) {
                    return;
                }

                $uibModalInstance.close($scope.name);
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
        }]);

}(angular));
