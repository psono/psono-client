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
            $scope.delete_group = delete_group;
            $scope.accept_group = accept_group;
            $scope.decline_group = decline_group;

            activate();

            function activate() {

                managerGroups.read_groups()
                    .then(function (groups) {
                        $scope.groups = groups;
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
                    templateUrl: 'view/modal-new-group.html',
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
                    templateUrl: 'view/modal-edit-group.html',
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
             * @name psonocli.controller:ShareCtrl#remove_item_from_pending_list
             * @methodOf psonocli.controller:ShareCtrl
             *
             * @description
             * Helper function to remove a specified item from the pending shares list
             *
             * @param group_id
             */
            var remove_group_from_pending_list = function (group_id) {
                helper.remove_from_array($scope.groups, group_id, function(group, group_id) {
                    return group.group_id === group_id;
                });
            };


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
                    templateUrl: 'view/modal-delete-verify.html',
                    controller: 'ModalDeleteVerifyCtrl',
                    resolve: {
                        title: function () {
                            return 'Delete Group';
                        },
                        description: function () {
                            return 'You are about to delete the group. All shares will be lost. Are you sure?';
                        }
                    }
                });

                modalInstance.result.then(function () {
                    // User clicked the yes button

                    var onSuccess = function(data){
                        remove_group_from_pending_list(group_id);
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
             * Accepts a given membership request
             *
             * @param {uuid} group The group to accept
             */
            function accept_group(group) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-accept-share.html',
                    controller: 'ModalAcceptShareCtrl',
                    resolve: {
                        title: function () {
                            return 'Accept Group';
                        },
                        item: function () {
                            return {
                                'share_right_read': true
                            };
                        },
                        user: function () {
                            return {
                                'user_id': group.user_id,
                                'user_username': group.user_username
                            };
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

                            remove_group_from_pending_list(group.group_id);
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