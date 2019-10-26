(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalChooseFolderCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires $uibModal
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.message
     * @requires psonocli.shareBlueprint
     * @requires psonocli.item
     *
     * @description
     * Controller for the "MoveEntry" modal
     */
    angular.module('psonocli').controller('ModalChooseFolderCtrl', ['$scope', '$uibModalInstance', '$uibModal',
        'managerDatastoreUser', 'message', 'shareBlueprint', 'title', 'datastore', 'datastore_type',
        function ($scope, $uibModalInstance, $uibModal,
                  managerDatastoreUser, message, shareBlueprint, title, datastore, datastore_type) {

            $scope.cut_breadcrumbs = cut_breadcrumbs;
            $scope.clear_breadcrumbs = clear_breadcrumbs;
            $scope.save = save;
            $scope.cancel = cancel;

            $scope.title = title;
            $scope.datastore = datastore;
            $scope.datastore_type = datastore_type;

            activate();

            function activate() {

                /**
                 * message is sent once someone selects another folder in the datastore
                 */
                message.on("node_breadcrumbs_update", function (data) {
                    $scope.breadcrumbs = data;
                });

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalChooseFolderCtrl#cut_breadcrumbs
             * @methodOf psonocli.controller:ModalChooseFolderCtrl
             *
             * @description
             * triggered once someone clicks on one of the breadcrumbs in the path
             *
             * @param {int} index The index to jump to
             * @param {object} node The node to jump to
             */
            function cut_breadcrumbs(index, node) {

                // prevent jumping to folders with no read nor write rights
                if (node.hasOwnProperty('share_rights') && ( !node.share_rights.read || !node.share_rights.write )) {
                    return;
                }

                $scope.breadcrumbs.breadcrumbs = $scope.breadcrumbs.breadcrumbs.slice(0, index + 1);
                $scope.breadcrumbs.id_breadcrumbs = $scope.breadcrumbs.id_breadcrumbs.slice(0, index + 1);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalChooseFolderCtrl#clear_breadcrumbs
             * @methodOf psonocli.controller:ModalChooseFolderCtrl
             *
             * @description
             * triggered once someone clicks the "delete" button near path. The function will clear the breadcrumbs.
             */
            function clear_breadcrumbs() {
                $scope.breadcrumbs = {};
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalChooseFolderCtrl#save
             * @methodOf psonocli.controller:ModalChooseFolderCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save () {
                if (typeof $scope.breadcrumbs === "undefined") {
                    $scope.breadcrumbs = {};
                }
                $uibModalInstance.close($scope.breadcrumbs);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalChooseFolderCtrl#cancel
             * @methodOf psonocli.controller:ModalChooseFolderCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }

        }]
    );
}(angular));