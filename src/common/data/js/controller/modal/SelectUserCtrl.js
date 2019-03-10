(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalSelectUserCtrl
     * @requires $scope
     * @requires $uibModal
     * @requires $uibModalInstance
     * @requires psonocli.helper
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.shareBlueprint
     * @requires DTOptionsBuilder
     * @requires DTColumnDefBuilder
     * @requires psonocli.languagePicker
     *
     * @description
     * Controller for the "Select User" modal
     */
    angular.module('psonocli').controller('ModalSelectUserCtrl', ['$scope', '$uibModal', '$uibModalInstance', 'helper',
        'managerDatastoreUser', 'cryptoLibrary', 'shareBlueprint',
        'DTOptionsBuilder', 'DTColumnDefBuilder', 'languagePicker',
        function ($scope, $uibModal, $uibModalInstance, helper,
                  managerDatastoreUser, cryptoLibrary, shareBlueprint,
                  DTOptionsBuilder, DTColumnDefBuilder, languagePicker) {

            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withLanguageSource('translations/datatables.' + languagePicker.get_active_language_code() + '.json');

            $scope.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1)
            ];

            $scope.structure = { data: {}} ;
            $scope.errors = [];
            $scope.selected_users = [];
            $scope.toggle_select = toggle_select;
            $scope.save = save;
            $scope.cancel = cancel;
            $scope.add_user = add_user;

            activate();

            function activate() {
                managerDatastoreUser.get_user_datastore().then(function (user_datastore) {
                    var users = [];
                    helper.create_list(user_datastore, users);
                    $scope.users = users;

                })
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

                            parent.items.push(user_object);

                            managerDatastoreUser.save_datastore_content(parent).then(function() {

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
             * @name psonocli.controller:ModalSelectUserCtrl#save
             * @methodOf psonocli.controller:ModalSelectUserCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {
                var returnvalue = {
                    users: []
                };
                for (var i = 0; i < $scope.users.length; i++) {
                    if ($scope.selected_users.indexOf($scope.users[i].id) > -1){
                        returnvalue['users'].push($scope.users[i]);
                    }
                }

                $uibModalInstance.close(returnvalue);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalSelectUserCtrl#cancel
             * @methodOf psonocli.controller:ModalSelectUserCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));
