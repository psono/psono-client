(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ShareCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires $uibModal
     * @requires psonocli.managerShare
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Controller for the Share view
     */
    angular.module('psonocli').controller('ShareCtrl', ['$scope', '$routeParams', '$uibModal', 'managerShare', 'managerDatastorePassword', 'cryptoLibrary',
        function ($scope, $routeParams, $uibModal, managerShare, managerDatastorePassword, cryptoLibrary) {

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
             * Helper function to remove a specified item from the pending shares list
             *
             * @param item
             * @param shares
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
                    templateUrl: 'view/modal-accept-share.html',
                    controller: 'ModalAcceptShareCtrl',
                    resolve: {
                        item: function () {
                            return item;
                        }
                    }
                });

                modalInstance.result.then(function (breadcrumbs) {
                    // User clicked the prime button

                    var onSuccess = function (datastore) {

                        var link_id = cryptoLibrary.generate_uuid();

                        var path;
                        var parent_path;

                        var target;
                        var parent_share_id;
                        var datastore_id;

                        if (typeof breadcrumbs.id_breadcrumbs !== "undefined") {
                            path = breadcrumbs.id_breadcrumbs.slice();
                            var path_copy = breadcrumbs.id_breadcrumbs.slice();
                            parent_path = breadcrumbs.id_breadcrumbs.slice();
                            // find drop zone
                            var val1 = managerDatastorePassword.find_in_datastore(breadcrumbs.id_breadcrumbs, datastore);
                            target = val1[0][val1[1]];

                            // get the parent (share or datastore)
                            var parent_share = managerShare.get_closest_parent_share(path_copy, datastore, datastore, 0);
                            if (parent_share.hasOwnProperty("datastore_id")) {
                                datastore_id = parent_share.datastore_id;
                            } else if (parent_share.hasOwnProperty("share_id")){
                                parent_share_id = parent_share.share_id;
                            } else {
                                alert("Wupsi, that should not happen: d6da43af-e0f5-46ba-ae5b-d7e5ccd2fa92")
                            }
                        } else {
                            path = [];
                            parent_path = [];
                            target = datastore;
                            datastore_id = target.datastore_id;
                        }

                        if (item.share_right_grant === false && typeof(parent_share_id) !== 'undefined') {
                            // No grant right, yet the parent is a a share?!?
                            alert("Wups, this should not happen. Error: 781f3da7-d38b-470e-a3c8-dd5787642230");
                        }

                        var onSuccess = function (share) {

                            share.id = link_id;

                            if (typeof share.name === "undefined") {
                                share.name = item.share_right_title;
                            }

                            if (typeof share.type === "undefined") {
                                //its a folder, lets add it to folders
                                if (typeof target.folders === "undefined") {
                                    target.folders = []
                                }
                                target.folders.push(share)
                            } else {
                                // its an item, lets add it to items
                                if (typeof target.items === "undefined") {
                                    target.items = []
                                }
                                target.items.push(share)
                            }
                            path.push(share.id);
                            var changed_paths = managerDatastorePassword.on_share_added(share.share_id, path, datastore, 1);
                            changed_paths.push(parent_path);

                            managerDatastorePassword.save_datastore_content(datastore, changed_paths);

                            remove_item_from_pending_list(item, pending_shares);
                        };

                        var onError = function (data) {
                            //pass
                        };

                        managerShare.accept_share_right(item.share_right_id, item.share_right_key,
                            item.share_right_key_nonce, breadcrumbs.user.data.user_public_key, link_id, parent_share_id,
                            datastore_id
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