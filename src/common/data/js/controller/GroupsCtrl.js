(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:GroupsCtrl
     * @requires $scope
     * @requires $interval
     * @requires $uibModal
     * @requires psonocli.managerGroups
     * @requires psonocli.helper
     *
     * @description
     * Controller for the Group view
     */
    angular.module('psonocli').controller('GroupsCtrl', ["$scope", "$interval", "$uibModal", "managerGroups", "helper",
        function ($scope, $interval, $uibModal, managerGroups, helper) {

            $scope.create_group = create_group;
            $scope.edit_group = edit_group;
            $scope.delete_group = delete_group;

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
             * @param {Object} group The group to edit
             * @param {string} size The size of the modal to open
             */
            function edit_group(group, size) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-edit-group.html',
                    controller: 'ModalEditGroupCtrl',
                    size: size,
                    resolve: {
                        group: function () {
                            return group;
                        }
                    }
                });

                modalInstance.result.then(function (group) {
                    // TODO: Trigger Save of group and update table
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
             * @param {Object} group The group to delete
             */
            function delete_group(group) {

                var onSuccess = function(data){
                    helper.remove_from_array($scope.groups, group);
                };

                var onError = function() {
                    //pass
                };

                managerGroups.delete_group(group['group_id'])
                    .then(onSuccess, onError);
            }
        }]);

}(angular));