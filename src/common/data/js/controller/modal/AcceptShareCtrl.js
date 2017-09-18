(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalAcceptShareCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires $uibModal
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.message
     * @requires psonocli.shareBlueprint
     * @requires psonocli.item
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Controller for the "AcceptShare" modal
     */
    angular.module('psonocli').controller('ModalAcceptShareCtrl', ['$scope', '$uibModalInstance', '$uibModal',
        'managerDatastoreUser', 'message', 'shareBlueprint', 'item', 'cryptoLibrary',
        function ($scope, $uibModalInstance, $uibModal,
                  managerDatastoreUser, message, shareBlueprint, item, cryptoLibrary) {

            $scope.cut_breadcrumbs = cut_breadcrumbs;
            $scope.clear_breadcrumbs = clear_breadcrumbs;
            $scope.save = save;
            $scope.cancel = cancel;

            $scope.item = item;
            $scope.user_is_trusted = false;
            $scope.trust = trust;

            activate();

            function activate() {

                /**
                 * message is sent once someone selects another folder in the datastore
                 */
                message.on("modal_accept_share_breadcrumbs_update", function (data) {
                    $scope.breadcrumbs = data;
                });

                /**
                 * identifies trusted users
                 */
                managerDatastoreUser
                    .search_user_datastore(item.share_right_create_user_id, item.share_right_create_user_username)
                    .then(function (user) {

                        if (user !== null) {
                            $scope.user_is_trusted = true;
                            $scope.user = user;
                            return;
                        }

                        var onSuccess = function (data) {
                            $scope.user = {
                                data: {
                                    user_search_username: data.data.username,
                                    user_id: data.data.id,
                                    user_username: data.data.username,
                                    user_public_key: data.data.public_key
                                },
                                name: data.data.username
                            };
                            $scope.user_list = [
                                {name: 'user_search_username', value: data.data.username},
                                {name: 'user_id', value: data.data.id},
                                {name: 'user_username', value: data.data.username},
                                {name: 'user_public_key', value: data.data.public_key}
                            ]
                        };
                        var onError = function (data) {
                            //pass
                        };
                        managerDatastoreUser.search_user(item.share_right_create_user_username)
                            .then(onSuccess, onError);
                    });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAcceptShareCtrl#cut_breadcrumbs
             * @methodOf psonocli.controller:ModalAcceptShareCtrl
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
             * @name psonocli.controller:ModalAcceptShareCtrl#clear_breadcrumbs
             * @methodOf psonocli.controller:ModalAcceptShareCtrl
             *
             * @description
             * triggered once someone clicks the "delete" button near path. The function will clear the breadcrumbs.
             */
            function clear_breadcrumbs() {
                $scope.breadcrumbs = {};
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAcceptShareCtrl#trust
             * @methodOf psonocli.controller:ModalAcceptShareCtrl
             *
             * @description
             * triggered once a users clicks the "trust this user" button and adds the user to the trusted datastore
             *
             * @param {Array} users List of users to trust
             */
            function trust(users) {

                var onSuccess = function (user_data_store) {

                    if (typeof user_data_store.items === 'undefined') {
                        user_data_store.items = [];
                    }

                    var user_object = {
                        id: cryptoLibrary.generate_uuid(),
                        type: "user",
                        data: {}
                    };

                    if (shareBlueprint.get_blueprint("user").getName) {
                        user_object.name = shareBlueprint.get_blueprint("user").getName(users);
                    }

                    for (var i = 0; i < users.length; i++) {

                        if (!users[i].hasOwnProperty("value")) {
                            continue;
                        }
                        if (!user_object.name && shareBlueprint.get_blueprint("user").title_field === users[i].name) {
                            user_object.name = user[i].value;
                        }
                        if (shareBlueprint.get_blueprint("user").hasOwnProperty("urlfilter_field")
                            && shareBlueprint.get_blueprint("user").urlfilter_field === users[i].name) {
                            user_object.urlfilter = users[i].value;
                        }
                        if (shareBlueprint.get_blueprint("user").hasOwnProperty("autosubmit_field")
                            && shareBlueprint.get_blueprint("user").autosubmit_field === users[i].name) {
                            user_object.autosubmit = users[i].value;
                        }
                        user_object.data[users[i].name] = users[i].value;

                        user_data_store.items.push(user_object);
                    }

                    managerDatastoreUser.save_datastore_content(user_data_store);
                    $scope.user_is_trusted = true;
                };
                var onError = function (data) {
                    //pass
                };

                managerDatastoreUser.get_user_datastore()
                    .then(onSuccess, onError);

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAcceptShareCtrl#save
             * @methodOf psonocli.controller:ModalAcceptShareCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save () {
                if (typeof $scope.breadcrumbs === "undefined") {
                    $scope.breadcrumbs = {};
                }
                $scope.breadcrumbs['user'] = $scope.user;
                $scope.breadcrumbs['item'] = $scope.item;
                $uibModalInstance.close($scope.breadcrumbs);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalAcceptShareCtrl#cancel
             * @methodOf psonocli.controller:ModalAcceptShareCtrl
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