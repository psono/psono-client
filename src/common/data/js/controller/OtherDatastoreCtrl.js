(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:OtherDatastoreCtrl
     * @requires $scope
     * @requires $uibModal
     * @requires psonocli.managerDatastore
     * @requires psonocli.helper
     *
     * @description
     * Controller for the Datastore tab in the "Others" menu
     */
    angular.module('psonocli').controller('OtherDatastoreCtrl', ['$scope', '$uibModal', 'managerDatastore', 'helper',
        function ($scope, $uibModal, managerDatastore, helper) {

            $scope.create_new_datastore = create_new_datastore;
            $scope.edit_data_store = edit_data_store;
            $scope.delete_datastore = delete_datastore;

            $scope.data_stores=[];

            activate();
            function activate() {
                load_datastore_overview();
            }

            function load_datastore_overview() {
                managerDatastore.get_datastore_overview(true).then(function (overview) {
                    $scope.data_stores=[];
                    for (var i = 0; i < overview.data.datastores.length; i++) {
                        if (overview.data.datastores[i]['type'] === 'password') {
                            $scope.data_stores.push(overview.data.datastores[i]);
                        }
                    }
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherDatastoreCtrl#create_new_datastore
             * @methodOf psonocli.controller:OtherDatastoreCtrl
             *
             * @description
             * Creates a new datastore
             */
            function create_new_datastore() {


                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-create-datastore.html',
                    controller: 'ModalCreateDatastoreCtrl',
                    resolve: {}
                });

                modalInstance.result.then(function (form) {

                    var onError = function(result) {
                        // pass
                    };

                    var onSuccess = function(result) {
                        load_datastore_overview();
                    };

                    return managerDatastore.create_datastore('password', form['description'], form['is_default'])
                        .then(onSuccess, onError);

                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherDatastoreCtrl#edit_data_store
             * @methodOf psonocli.controller:OtherDatastoreCtrl
             *
             * @description
             * edits an data_store
             *
             * @param {TreeObject} data_store The data_store to edit
             */
            function edit_data_store(data_store) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-edit-datastore.html',
                    controller: 'ModalEditDatastoreCtrl',
                    resolve: {
                        data_store: function () {
                            return data_store;
                        }
                    }
                });

                modalInstance.result.then(function (form) {

                    var onError = function(result) {
                        // pass
                    };

                    var onSuccess = function(result) {
                        load_datastore_overview();
                    };

                    return managerDatastore.save_datastore_meta(form['id'], form['description'], form['is_default'])
                           .then(onSuccess, onError);

                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherDatastoreCtrl#delete_datastore
             * @methodOf psonocli.controller:OtherDatastoreCtrl
             *
             * @description
             * deletes an data_store
             *
             * @param {TreeObject} data_store The data_store to delete
             */
            function delete_datastore(data_store) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-delete-datastore.html',
                    controller: 'ModalDeleteDatastoreCtrl',
                    resolve: {
                        data_store: function () {
                            return data_store;
                        }
                    }
                });

                modalInstance.result.then(function (form) {
                    load_datastore_overview();

                }, function () {
                    // cancel triggered
                });
            }
        }]
    );
}(angular));