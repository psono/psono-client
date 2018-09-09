(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalHistoryCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires $uibModalInstance
     * @requires $uibModal
     * @requires psonocli.managerHistory
     * @requires node
     *
     * @description
     * Controller for the "History" modal
     */
    angular.module('psonocli').controller('ModalHistoryCtrl', ['$scope', '$rootScope', '$uibModalInstance', '$uibModal', 'managerHistory', 'node',
        function ($scope, $rootScope, $uibModalInstance, $uibModal, managerHistory, node) {

            $scope.show_history_item = show_history_item;
            $scope.cancel = cancel;
            $scope.data = {
                history: []
            };

            activate();

            function activate() {
                managerHistory.read_secret_history(node.secret_id).then(function(history) {
                    $scope.data['history'] = history;
                })
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalHistoryCtrl#show_history_item
             * @methodOf psonocli.controller:ModalHistoryCtrl
             *
             * @description
             * Triggered once someone clicks the show button of a history item.
             * Will load the item from the server and show it.
             *
             * @param history_item
             */
            function show_history_item(history_item) {

                managerHistory.read_history(history_item.id, node.secret_key).then(function(data) {

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal-show-entry.html',
                        controller: 'ModalEditEntryCtrl',
                        backdrop: 'static',
                        resolve: {
                            node: function () {
                                return node;
                            },
                            path: function () {
                                return '';
                            },
                            data: function () {
                                return data;
                            }
                        }
                    });

                    modalInstance.result.then(function () {
                        // should never happen
                    }, function () {
                        // cancel triggered
                    });

                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalHistoryCtrl#cancel
             * @methodOf psonocli.controller:ModalHistoryCtrl
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