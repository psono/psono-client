(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:GroupsCtrl
     * @requires $scope
     * @requires $interval
     * @requires $uibModal
     * @requires psonocli.managerGroups
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.helper
     *
     * @description
     * Controller for the Group view
     */
    angular.module('psonocli').controller('GroupsCtrl', ["$scope", "$interval", "$uibModal", "managerGroups", "managerDatastorePassword", "helper",
        function ($scope, $interval, $uibModal, managerGroups, managerDatastorePassword, helper) {

            $scope.create_group = create_group;
            $scope.edit_group = edit_group;
            $scope.leave_group = leave_group;
            $scope.delete_group = delete_group;
            $scope.accept_group = accept_group;
            $scope.accept_new_group_shares = accept_new_group_shares;
            $scope.decline_group = decline_group;

            activate();

            function activate() {

                managerGroups.read_groups(true)
                    .then(function (groups) {
                        $scope.groups = groups;
                    });

                managerGroups.get_outstanding_group_shares()
                    .then(function (outstanding_share_index) {
                        $scope.outstanding_share_index = outstanding_share_index;
                    });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:GroupsCtrl#create_group
             * @methodOf psonocli.controller:GroupsCtrl
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
                        $scope.groups.push(group)
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
             * @name psonocli.controller:GroupsCtrl#edit_group
             * @methodOf psonocli.controller:GroupsCtrl
             *
             * @description
             * Opens the modal for editing a group
             *
             * @param {uuid} group_id The id of the group to edit
             * @param {string} size The size of the modal to open
             */
            function edit_group(group_id, size) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/edit-group.html',
                    controller: 'ModalEditGroupCtrl',
                    size: size,
                    resolve: {
                        group_id: function () {
                            return group_id;
                        }
                    }
                });

                modalInstance.result.then(function (new_group_name) {
                    if (typeof(new_group_name) === 'undefined') {
                        return;
                    }

                    var onSuccess = function(){
                        for (var i = 0; i < $scope.groups.length; i++) {
                            if ($scope.groups[i].group_id !== group_id) {
                                continue;
                            }
                            $scope.groups[i].name = new_group_name;
                        }
                    };

                    var onError = function() {
                        //pass
                    };

                    managerGroups.update_group(group_id, new_group_name)
                        .then(onSuccess, onError);
                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ShareCtrl#remove_group_from_group_list
             * @methodOf psonocli.controller:GroupsCtrl
             *
             * @description
             * Helper function to remove a specified group from the group list
             *
             * @param {uuid} group_id The id of the group to remove
             */
            var remove_group_from_group_list = function (group_id) {
                helper.remove_from_array($scope.groups, group_id, function(group, group_id) {
                    return group.group_id === group_id;
                });
            };

            /**
             * @ngdoc
             * @name psonocli.controller:ShareCtrl#mark_group_accepted
             * @methodOf psonocli.controller:GroupsCtrl
             *
             * @description
             * Helper function to mark a group in the pending share list  as accepted
             *
             * @param {uuid} group_id The id of the group to mark as accepted
             */
            var mark_group_accepted = function (group_id) {

                for (var i = 0; i < $scope.groups.length; i++) {
                    if ($scope.groups[i].group_id !== group_id) {
                        continue;
                    }
                    $scope.groups[i].accepted = true;
                    break;
                }
            };


            /**
             * @ngdoc
             * @name psonocli.controller:GroupsCtrl#leave_group
             * @methodOf psonocli.controller:GroupsCtrl
             *
             * @description
             * Leaves a given group
             *
             * @param {object} group The group to leave
             */
            function leave_group(group) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/verify.html',
                    controller: 'ModalVerifyCtrl',
                    resolve: {
                        title: function () {
                            return 'LEAVE_GROUP';
                        },
                        description: function () {
                            return 'LEAVE_GROUP_WARNING';
                        }
                    }
                });

                modalInstance.result.then(function () {
                    // User clicked the yes button

                    var onSuccess = function(data){
                        remove_group_from_group_list(group.group_id);
                    };

                    var onError = function() {
                        //pass
                    };

                    managerGroups.delete_membership(group.membership_id)
                        .then(onSuccess, onError);


                }, function () {
                    // cancel triggered
                });
            }


            /**
             * @ngdoc
             * @name psonocli.controller:GroupsCtrl#delete_group
             * @methodOf psonocli.controller:GroupsCtrl
             *
             * @description
             * Deletes a given group
             *
             * @param {uuid} group_id The id of the group to delete
             */
            function delete_group(group_id) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/verify.html',
                    controller: 'ModalVerifyCtrl',
                    resolve: {
                        title: function () {
                            return 'Delete Group';
                        },
                        description: function () {
                            return 'You are about to delete the group. All shares will be lost / become inaccessible. Are you sure?';
                        }
                    }
                });

                modalInstance.result.then(function () {
                    // User clicked the yes button

                    var onSuccess = function(data){
                        remove_group_from_group_list(group_id);
                    };

                    var onError = function() {
                        //pass
                    };

                    managerGroups.delete_group(group_id)
                        .then(onSuccess, onError);

                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:GroupsCtrl#accept_group
             * @methodOf psonocli.controller:GroupsCtrl
             *
             * @description
             * Accepts a given membership request and adds the new shares to the datastore
             *
             * @param {object} group The group to accept
             */
            function accept_group(group) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/accept-share.html',
                    controller: 'ModalAcceptShareCtrl',
                    resolve: {
                        title: function () {
                            return 'Accept Group';
                        },
                        item: function () {
                            return {
                                'share_right_read': true,
                                'share_right_create_user_id': group.user_id,
                                'share_right_create_user_username': group.user_username
                            };
                        },
                        user: function () {
                            return {
                                'user_id': group.user_id,
                                'user_username': group.user_username
                            };
                        },
                        hide_user: function () {
                            return !group.user_id;
                        }
                    }
                });

                modalInstance.result.then(function (breadcrumbs) {
                    // User clicked the prime button

                    var onSuccess = function (datastore) {

                        var analyzed_breadcrumbs = managerDatastorePassword.analyze_breadcrumbs(breadcrumbs, datastore);

                        if (group.share_right_grant === false && typeof(analyzed_breadcrumbs['parent_share_id']) !== 'undefined') {
                            // No grant right, yet the parent is a a share?!?
                            alert("Wups, this should not happen. Error: 405989c9-44c7-4fe7-b443-4ee7c8e07ed1");
                            return;
                        }

                        var onSuccess = function (shares) {

                            managerDatastorePassword.create_share_links_in_datastore(shares, analyzed_breadcrumbs['target'],
                                analyzed_breadcrumbs['parent_path'], analyzed_breadcrumbs['path'],
                                analyzed_breadcrumbs['parent_share_id'], analyzed_breadcrumbs['parent_datastore_id'],
                                datastore);

                            mark_group_accepted(group.group_id);
                        };

                        var onError = function (data) {
                            //pass
                        };

                        managerGroups.accept_membership(group.membership_id)
                            .then(onSuccess, onError);
                    };
                    var onError = function (data) {
                        //pass
                    };

                    managerDatastorePassword.get_password_datastore()
                        .then(onSuccess, onError);

                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:GroupsCtrl#accept_new_group_shares
             * @methodOf psonocli.controller:GroupsCtrl
             *
             * @description
             * Add the pending shares to our datastore
             *
             * @param {object} group The group to accept
             */
            function accept_new_group_shares(group) {

                if (!$scope.outstanding_share_index.hasOwnProperty(group.group_id)) {
                    return;
                }

                var outstanding_share_index = $scope.outstanding_share_index[group.group_id];

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/accept-share.html',
                    controller: 'ModalAcceptShareCtrl',
                    resolve: {
                        title: function () {
                            return 'Accept New Shares';
                        },
                        item: function () {
                            return {
                                'share_right_read': true,
                                'share_right_create_user_id': group.user_id,
                                'share_right_create_user_username': group.user_username
                            };
                        },
                        user: function () {
                            return {
                                'user_id': group.user_id,
                                'user_username': group.user_username
                            };
                        },
                        hide_user: function () {
                            return !group.user_id;
                        }
                    }
                });

                modalInstance.result.then(function (breadcrumbs) {
                    // User clicked the prime button

                    var onSuccess = function (datastore) {

                        var analyzed_breadcrumbs = managerDatastorePassword.analyze_breadcrumbs(breadcrumbs, datastore);

                        if (group.share_right_grant === false && typeof(analyzed_breadcrumbs['parent_share_id']) !== 'undefined') {
                            // No grant right, yet the parent is a a share?!?
                            alert("Wups, this should not happen. Error: 405989c9-44c7-4fe7-b443-4ee7c8e07ed1");
                            return;
                        }

                        var onSuccess = function (group_details) {

                            var encrypted_shares = [];
                            for (var i = 0; i < group_details.group_share_rights.length; i++) {
                                var share = group_details.group_share_rights[i];
                                if (!outstanding_share_index.hasOwnProperty(share.share_id)) {
                                    continue;
                                }
                                share.share_key = share.key;
                                share.share_key_nonce = share.key_nonce;
                                share.share_title = share.title;
                                share.share_title_nonce = share.title_nonce;
                                share.share_type = share.type;
                                share.share_type_nonce = share.type_nonce;
                                encrypted_shares.push(share);
                            }

                            var shares = managerGroups.decrypt_group_shares(group.group_id, encrypted_shares);

                            managerDatastorePassword.create_share_links_in_datastore(shares, analyzed_breadcrumbs['target'],
                                analyzed_breadcrumbs['parent_path'], analyzed_breadcrumbs['path'],
                                analyzed_breadcrumbs['parent_share_id'], analyzed_breadcrumbs['parent_datastore_id'],
                                datastore);

                            delete $scope.outstanding_share_index[group.group_id];
                        };

                        var onError = function (data) {
                            //pass
                        };

                        managerGroups.read_group(group.group_id)
                            .then(onSuccess, onError);
                    };
                    var onError = function (data) {
                        //pass
                    };

                    managerDatastorePassword.get_password_datastore()
                        .then(onSuccess, onError);

                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:GroupsCtrl#decline_group
             * @methodOf psonocli.controller:GroupsCtrl
             *
             * @description
             * Declines a given membership request
             *
             * @param {uuid} group The group to decline
             */
            function decline_group(group) {

                var onSuccess = function(data){
                    helper.remove_from_array($scope.groups, group.membership_id, function(a, membership_id) {
                        return a['membership_id'] === membership_id;
                    });
                };

                var onError = function() {
                    //pass
                };

                managerGroups.decline_membership(group.membership_id)
                    .then(onSuccess, onError);
            }
        }]);

}(angular));