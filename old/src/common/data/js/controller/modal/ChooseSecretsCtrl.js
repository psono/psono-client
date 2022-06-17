(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalChooseSecretsCtrl
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
    angular.module('psonocli').controller('ModalChooseSecretsCtrl', ['$scope', '$uibModalInstance', '$uibModal',
        'managerDatastoreUser', 'message', 'shareBlueprint', 'title', 'exclude_secrets',
        function ($scope, $uibModalInstance, $uibModal,
                  managerDatastoreUser, message, shareBlueprint, title, exclude_secrets) {

            $scope.save = save;
            $scope.cancel = cancel;

            $scope.title = title;

            activate();

            function activate() {

                /**
                 * message is sent once someone selects another folder in the datastore
                 */
                message.on("item_breadcrumbs_update", function (data) {

                    for (var i = 0; i < exclude_secrets.length; i++) {
                        if (exclude_secrets[i]['secret_id'] !== data['item']['secret_id']) {
                            continue;
                        }
                        return;
                    }

                    $scope.breadcrumbs = data;
                    if (typeof $scope.breadcrumbs === "undefined") {
                        $scope.breadcrumbs = {};
                    }
                    $uibModalInstance.close([$scope.breadcrumbs]);
                });

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalChooseSecretsCtrl#save
             * @methodOf psonocli.controller:ModalChooseSecretsCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save () {
                if (typeof $scope.breadcrumbs === "undefined") {
                    $scope.breadcrumbs = {};
                }
                $uibModalInstance.close([$scope.breadcrumbs]);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalChooseSecretsCtrl#cancel
             * @methodOf psonocli.controller:ModalChooseSecretsCtrl
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