(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ActiveLinkSharesCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires $uibModal
     * @requires psonocli.managerLinkShare
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Controller for the Share view
     */
    angular.module('psonocli').controller('ActiveLinkSharesCtrl', ['$scope', '$routeParams', '$uibModal', 'managerLinkShare',
        'managerDatastorePassword', 'cryptoLibrary', 'languagePicker', 'DTOptionsBuilder', 'DTColumnDefBuilder',
        function ($scope, $routeParams, $uibModal, managerLinkShare,
                  managerDatastorePassword, cryptoLibrary, languagePicker, DTOptionsBuilder, DTColumnDefBuilder) {

            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withLanguageSource('translations/datatables.' + languagePicker.get_active_language_code() + '.json');

            $scope.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1),
                DTColumnDefBuilder.newColumnDef(2),
                DTColumnDefBuilder.newColumnDef(3),
                DTColumnDefBuilder.newColumnDef(4)
            ];

            $scope.edit_link_share = edit_link_share;
            $scope.delete_link_share = delete_link_share;

            $scope.name = "ActiveLinkSharesCtrl";
            $scope.params = $routeParams;
            $scope.routeParams = $routeParams;
            $scope.link_shares = [];

            activate();

            function activate() {
                // populates the the data with all shares

                var onSuccess = function (data) {
                    $scope.link_shares = data.link_shares;
                };
                var onError = function (data) {
                    //pass
                };
                managerLinkShare.read_link_shares().then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ActiveLinkSharesCtrl#edit_link_share
             * @methodOf psonocli.controller:ActiveLinkSharesCtrl
             *
             * @description
             * edits a share link
             *
             * @param {object} link_share The link share to edit
             * @param {Array} link_shares List of all the current shares
             */
            function edit_link_share(link_share, link_shares) {

                var on_modal_close_success = function () {
                    // pass
                };

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/edit-link-share.html',
                    controller: 'ModalEditLinkShareCtrl',
                    backdrop: 'static',
                    resolve: {
                        link_share: function () {
                            return link_share;
                        }
                    }
                });

                // User clicked the final share button
                modalInstance.result.then(on_modal_close_success, function () {
                    // cancel triggered
                });

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ActiveLinkSharesCtrl#delete_link_share
             * @methodOf psonocli.controller:ActiveLinkSharesCtrl
             *
             * @description
             * deletes a share link
             *
             * @param {object} item The item to delete
             * @param {Array} link_shares List of all the current shares
             */
            function delete_link_share(item, link_shares) {


                for (var i = link_shares.length - 1; i >= 0; i--) {
                    if (link_shares[i].id !== item.id) {
                        continue;
                    }
                    link_shares.splice(i, 1);
                }
                managerLinkShare.delete_link_share(item.id);
            }
        }]
    );
}(angular));