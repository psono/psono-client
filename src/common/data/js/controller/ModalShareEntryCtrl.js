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
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Controller for the "Share Entry" modal
     */
    angular.module('psonocli').controller('ModalShareEntryCtrl', ['$scope', '$uibModalInstance', '$uibModal', 'shareBlueprint',
        'managerDatastoreUser', 'node', 'path', 'users', 'DTOptionsBuilder', 'DTColumnDefBuilder', 'cryptoLibrary',
        function ($scope, $uibModalInstance, $uibModal, shareBlueprint,
                  managerDatastoreUser, node, path, users, DTOptionsBuilder, DTColumnDefBuilder, cryptoLibrary) {

            $scope.add_user = add_user;
            $scope.toggle_select = toggle_select;
            $scope.save = save;
            $scope.cancel = cancel;

            $scope.dtOptions = DTOptionsBuilder.newOptions();
            $scope.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1).notSortable()
            ];

            $scope.node = node;
            $scope.path = path;
            $scope.users = users;
            $scope.errors = [];

            $scope.selected_users = [];
            $scope.selected_rights = [];

            activate();

            function activate() {

                $scope.rights = [{
                    id: 'read',
                    name: 'Read',
                    initial_value: true
                }, {
                    id: 'write',
                    name: 'Write',
                    initial_value: true
                }, {
                    id: 'grant',
                    name: 'Grant',
                    initial_value: true
                }];

                // fills selected_rights array with the default values
                for (var i = $scope.rights.length - 1; i >= 0; i--) {
                    if ($scope.rights[i].initial_value) {
                        $scope.selected_rights.push($scope.rights[i].id);
                    }
                }
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
                                user_object.data[content.fields[i].name] = content.fields[i].value;
                            }

                            parent.items.push(user_object);

                            managerDatastoreUser.save_datastore(parent).then(function() {

                                $scope.users.push(user_object);
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
                } else {
                    search_array = $scope.selected_users;
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
                    selected_users: $scope.selected_users,
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