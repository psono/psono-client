(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ShareCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires $uibModal
     * @requires psonocli.managerShare
     * @requires psonocli.managerShareLink
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Controller for the Share view
     */
    angular.module('psonocli').controller('ShareCtrl', ['$scope', '$routeParams', '$uibModal', 'managerShare',
        'managerShareLink', 'managerDatastorePassword', 'cryptoLibrary', 'languagePicker', 'DTOptionsBuilder', 'DTColumnDefBuilder',
        function ($scope, $routeParams, $uibModal, managerShare,
                  managerShareLink, managerDatastorePassword, cryptoLibrary, languagePicker, DTOptionsBuilder, DTColumnDefBuilder) {

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

            $scope.accept = accept;
            $scope.decline = decline;
            $scope.pending_approval_filter = pending_approval_filter;

            $scope.name = "ShareCtrl";
            $scope.params = $routeParams;
            $scope.routeParams = $routeParams;
            $scope.shares = [];

            activate();

            function activate() {
                // populates the the data with all shares

                var onSuccess = function (data) {
                    $scope.shares = data.shares;
                };
                var onError = function (data) {
                    //pass
                };
                managerShare.read_shares().then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ShareCtrl#remove_item_from_pending_list
             * @methodOf psonocli.controller:ShareCtrl
             *
             * @description
             * Helper function to remove a specified item from the pending shares list
             *
             * @param {object} item The item to remove
             * @param {array} shares The shares to search
             */
            var remove_item_from_pending_list = function (item, shares) {

                for (var i = shares.length - 1; i >= 0; i--) {
                    if (shares[i].id !== item.id) {
                        continue;
                    }
                    shares.splice(i, 1);
                }
            };


            /**
             * @ngdoc
             * @name psonocli.controller:ShareCtrl#accept
             * @methodOf psonocli.controller:ShareCtrl
             *
             * @description
             * accepts a share offer
             *
             * @param {object} item The item to accept
             * @param {Array} pending_shares List of all pending shares
             */
            function accept(item, pending_shares) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/accept-share.html',
                    controller: 'ModalAcceptShareCtrl',
                    resolve: {
                        title: function () {
                            return 'Accept Share';
                        },
                        item: function () {
                            return item;
                        },
                        user: function () {
                            return {
                                'user_id': item.share_right_create_user_id,
                                'user_username': item.share_right_create_user_username
                            };
                        },
                        hide_user: function () {
                            return false;
                        }
                    }
                });

                modalInstance.result.then(function (breadcrumbs) {
                    // User clicked the prime button

                    var onSuccess = function (datastore) {

                        var analyzed_breadcrumbs = managerDatastorePassword.analyze_breadcrumbs(breadcrumbs, datastore);

                        if (item.share_right_grant === false && typeof(analyzed_breadcrumbs['parent_share_id']) !== 'undefined') {
                            // No grant right, yet the parent is a a share?!?
                            alert("Wups, this should not happen. Error: 781f3da7-d38b-470e-a3c8-dd5787642230");
                        }

                        var onSuccess = function (share) {

                            if (typeof share.name === "undefined") {
                                share.name = item.share_right_title;
                            }

                            var shares = [share];

                            managerDatastorePassword.create_share_links_in_datastore(shares, analyzed_breadcrumbs['target'],
                                analyzed_breadcrumbs['parent_path'], analyzed_breadcrumbs['path'],
                                analyzed_breadcrumbs['parent_share_id'], analyzed_breadcrumbs['parent_datastore_id'],
                                analyzed_breadcrumbs['parent_share'], datastore);

                            remove_item_from_pending_list(item, pending_shares);
                        };

                        var onError = function (data) {
                            //pass
                        };

                        managerShare.accept_share_right(item.share_right_id, item.share_right_key,
                            item.share_right_key_nonce, breadcrumbs.user.data.user_public_key
                        ).then(onSuccess, onError);
                    };
                    var onError = function (data) {
                        //pass
                    };

                    managerDatastorePassword.get_password_datastore()
                        .then(onSuccess, onError);
                }, function () {
                    // cancel triggered
                });


            }

            /**
             * @ngdoc
             * @name psonocli.controller:ShareCtrl#decline
             * @methodOf psonocli.controller:ShareCtrl
             *
             * @description
             * declines a share offer
             *
             * @param {object} item The item to decline
             * @param {Array} pending_shares List of all pending shares
             */
            function decline(item, pending_shares) {
                managerShare.decline_share_right(item.share_right_id);
                remove_item_from_pending_list(item, pending_shares);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ShareCtrl#pending_approval_filter
             * @methodOf psonocli.controller:ShareCtrl
             *
             * @description
             * Filter function that returns if an item has already been accepted
             *
             * @param {object} item The item to check
             */
            function pending_approval_filter(item) {
                return item.share_right_accepted === null;
            }
        }]
    );
}(angular));