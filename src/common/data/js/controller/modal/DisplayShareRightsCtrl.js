(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalDisplayShareRightsCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires $uibModal
     * @requires psonocli.itemBlueprint
     *
     * @description
     * Controller for the "Display share rights" modal
     */
    angular.module('psonocli').controller('ModalDisplayShareRightsCtrl', ['$scope', '$uibModalInstance', '$uibModal',
        'itemBlueprint', 'storage', 'node', 'path',
        'share_details', 'managerShare', 'DTOptionsBuilder', 'DTColumnDefBuilder', 'languagePicker',
        function ($scope, $uibModalInstance, $uibModal,
                  itemBlueprint, storage, node, path,
                  share_details, managerShare, DTOptionsBuilder, DTColumnDefBuilder, languagePicker) {

            $scope.cancel = cancel;
            $scope.delete_right = delete_right;
            $scope.toggle_right = toggle_right;

            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withLanguageSource('translations/datatables.' + languagePicker.get_active_language_code() + '.json');
            $scope.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1),
                DTColumnDefBuilder.newColumnDef(2),
                DTColumnDefBuilder.newColumnDef(3),
                DTColumnDefBuilder.newColumnDef(4),
                DTColumnDefBuilder.newColumnDef(5).notSortable()
            ];

            $scope.node = node;
            $scope.path = path;
            $scope.name = node.name;
            $scope.share_details = share_details;


            /**
             * @ngdoc
             * @name psonocli.controller:ModalDisplayShareRightsCtrl#cancel
             * @methodOf psonocli.controller:ModalDisplayShareRightsCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDisplayShareRightsCtrl#delete_right_without_further_warning
             * @methodOf psonocli.controller:ModalDisplayShareRightsCtrl
             *
             * @description
             * Deletes a share right without further warning.
             *
             * @param {object} right The right to delete
             */
            function delete_right_without_further_warning(right) {
                var share_rights;
                var user_share_right_id;
                var group_share_right_id;

                if (right.hasOwnProperty('user_id')) {
                    share_rights = share_details.user_share_rights;
                    user_share_right_id = right.id;
                } else {
                    share_rights = share_details.group_share_rights;
                    group_share_right_id = right.id;
                }

                for (var i = share_rights.length - 1; i >= 0; i--) {
                    if (share_rights[i].id !== right.id) {
                        continue;
                    }

                    share_rights.splice(i, 1);
                    managerShare.delete_share_right(user_share_right_id, group_share_right_id);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDisplayShareRightsCtrl#delete_right
             * @methodOf psonocli.controller:ModalDisplayShareRightsCtrl
             *
             * @description
             * Triggered once someone clicks on the delete button for a share right
             *
             * @param {object} right The right to delete
             */
            function delete_right(right) {
                
                if (storage.find_key('persistent', 'username').value === right.username) {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/verify.html',
                        controller: 'ModalVerifyCtrl',
                        resolve: {
                            title: function () {
                                return 'DELETE_SHARE_RIGHT';
                            },
                            description: function () {
                                return 'DELETE_OWN_SHARE_RIGHT_WARNING';
                            },
                            entries: function () {
                                return [right.username];
                            },
                            affected_entries_text: function () {
                                return 'AFFECTED_SHARE_RIGHTS';
                            }
                        }
                    });

                    modalInstance.result.then(function () {
                        // User clicked the yes button
                        return delete_right_without_further_warning(right);

                    }, function () {
                        // cancel triggered
                    });
                } else {
                    return delete_right_without_further_warning(right);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDisplayShareRightsCtrl#toggle_right
             * @methodOf psonocli.controller:ModalDisplayShareRightsCtrl
             *
             * @description
             * Triggered once someone clicks on the right toggle button for a share right
             *
             * @param {string} type The type of the right e.g. 'read' or 'grant'
             * @param {object} right The right holding object
             */
            function toggle_right_without_further_warning(type, right) {


                var onError = function(data) {
                    // pass
                };

                var onSuccess = function() {
                    right[type] = !right[type];
                };

                var new_right = angular.copy(right);
                new_right[type] = !new_right[type];

                managerShare.update_share_right(new_right.share_id, new_right.user_id, new_right.group_id, new_right.read, new_right.write, new_right.grant)
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalDisplayShareRightsCtrl#toggle_right
             * @methodOf psonocli.controller:ModalDisplayShareRightsCtrl
             *
             * @description
             * Triggered once someone clicks on the right toggle button for a share right
             *
             * @param {string} type The type of the right e.g. 'read' or 'grant'
             * @param {object} right The right holding object
             */
            function toggle_right(type, right) {
                
                if (type === 'grant' && storage.find_key('persistent', 'username').value === right.username) {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/verify.html',
                        controller: 'ModalVerifyCtrl',
                        resolve: {
                            title: function () {
                                return 'TOGGLE_GRANT_RIGHT';
                            },
                            description: function () {
                                return 'TOGGLE_OWN_GRANT_RIGHT_WARNING';
                            },
                            entries: function () {
                                return [right.username];
                            },
                            affected_entries_text: function () {
                                return 'AFFECTED_SHARE_RIGHTS';
                            }
                        }
                    });

                    modalInstance.result.then(function () {
                        // User clicked the yes button
                        return toggle_right_without_further_warning(type, right);

                    }, function () {
                        // cancel triggered
                    });
                } else {
                    return toggle_right_without_further_warning(type, right);
                }

            }

        }]);

}(angular));
