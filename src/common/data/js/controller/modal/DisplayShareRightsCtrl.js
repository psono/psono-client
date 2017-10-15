(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalDisplayShareRightsCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.itemBlueprint
     *
     * @description
     * Controller for the "Display share rights" modal
     */
    angular.module('psonocli').controller('ModalDisplayShareRightsCtrl', ['$scope', '$uibModalInstance', 'itemBlueprint', 'node', 'path',
        'share_details', 'managerShare', 'DTOptionsBuilder', 'DTColumnDefBuilder',
        function ($scope, $uibModalInstance, itemBlueprint, node, path, share_details, managerShare, DTOptionsBuilder, DTColumnDefBuilder) {

            $scope.cancel = cancel;
            $scope.delete_right = delete_right;
            $scope.toggle_right = toggle_right;

            $scope.dtOptions = DTOptionsBuilder.newOptions();
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
             * @name psonocli.controller:ModalDisplayShareRightsCtrl#delete_right
             * @methodOf psonocli.controller:ModalDisplayShareRightsCtrl
             *
             * @description
             * Triggered once someone clicks on the delete button for a share right
             *
             * @param {object} right The right to delete
             */
            function delete_right(right) {
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

        }]);

}(angular));
