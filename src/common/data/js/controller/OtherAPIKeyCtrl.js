(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:OtherAPIKeyCtrl
     * @requires $scope
     * @requires $uibModal
     * @requires psonocli.managerAPIKeys
     *
     * @description
     * Controller for the Datastore tab in the "Others" menu
     */
    angular.module('psonocli').controller('OtherAPIKeyCtrl', ['$scope', '$uibModal', 'managerAPIKeys',
        function ($scope, $uibModal, managerAPIKeys) {

            $scope.create_new_api_key = create_new_api_key;
            $scope.edit_api_key = edit_api_key;
            $scope.delete_api_key = delete_api_key;

            $scope.api_keys_disabled = managerAPIKeys.api_keys_disabled();

            $scope.api_keys=[];

            activate();
            function activate() {
                read_api_keys();
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherAPIKeyCtrl#read_api_keys
             * @methodOf psonocli.controller:OtherAPIKeyCtrl
             *
             * @description
             * Reads all api keys from the backend
             */
            function read_api_keys() {
                managerAPIKeys.read_api_keys().then(function (data) {
                    $scope.api_keys=data.api_keys;
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherAPIKeyCtrl#create_new_api_key
             * @methodOf psonocli.controller:OtherAPIKeyCtrl
             *
             * @description
             * Creates a new datastore
             */
            function create_new_api_key() {


                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/create-api-key.html',
                    controller: 'ModalCreateAPIKeyCtrl',
                    resolve: {}
                });

                modalInstance.result.then(function () {

                    read_api_keys();

                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherAPIKeyCtrl#edit_api_key
             * @methodOf psonocli.controller:OtherAPIKeyCtrl
             *
             * @description
             * edits an api_keys
             *
             * @param {TreeObject} api_key The api_key to edit
             */
            function edit_api_key(api_key) {

                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(api_key) {

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/edit-api-key.html',
                        controller: 'ModalEditAPIKeyCtrl',
                        resolve: {
                            api_key: function () {
                                return api_key;
                            }
                        }
                    });

                    modalInstance.result.then(function (form) {
                        // save triggered
                    }, function () {
                        // cancel triggered
                    });
                };
                return managerAPIKeys.read_api_key(api_key['id'])
                     .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherAPIKeyCtrl#delete_api_key
             * @methodOf psonocli.controller:OtherAPIKeyCtrl
             *
             * @description
             * deletes an api_key
             *
             * @param {TreeObject} api_key The api_key to delete
             */
            function delete_api_key(api_key) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/verify.html',
                    controller: 'ModalVerifyCtrl',
                    resolve: {
                        title: function () {
                            return 'DELETE_API_KEY';
                        },
                        description: function () {
                            return 'DELETE_API_KEY_WARNING';
                        }
                    }
                });

                modalInstance.result.then(function () {
                    // User clicked the yes button

                    var onSuccess = function(){

                        for (var i = $scope.api_keys.length - 1; i >= 0; i--) {
                            if ($scope.api_keys[i].id !== api_key.id) {
                                continue;
                            }
                            $scope.api_keys.splice(i, 1);
                        }

                    };

                    var onError = function() {
                        //pass
                    };

                    managerAPIKeys.delete_api_key(api_key.id)
                        .then(onSuccess, onError);


                }, function () {
                    // cancel triggered
                });

            }
        }]
    );
}(angular));