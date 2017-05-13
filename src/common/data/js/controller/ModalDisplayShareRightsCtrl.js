(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalDisplayShareRightsCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires itemBlueprint
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

                for (var i = share_details.user_share_rights.length - 1; i >= 0; i--) {
                    if (share_details.user_share_rights[i].id !== right.id) {
                        continue;
                    }

                    share_details.user_share_rights.splice(i, 1);
                    managerShare.delete_share_right(right.id);
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

                right[type] = !right[type];

                managerShare.update_share_right(right.share_id, right.user_id, right.read, right.write, right.grant)
            }

        }]);

}(angular, qrcode));
