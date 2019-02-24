(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:OtherFileExchangeCtrl
     * @requires $scope
     * @requires $uibModal
     * @requires psonocli.managerFileExchange
     *
     * @description
     * Controller for the Datastore tab in the "Others" menu
     */
    angular.module('psonocli').controller('OtherFileExchangeCtrl', ['$scope', '$uibModal', 'managerFileExchange',
        function ($scope, $uibModal, managerFileExchange) {

            $scope.create_new_file_exchange = create_new_file_exchange;
            $scope.edit_file_exchange = edit_file_exchange;
            $scope.delete_file_exchange = delete_file_exchange;

            $scope.file_exchanges_disabled = managerFileExchange.file_exchanges_disabled();

            $scope.file_exchanges=[];

            activate();
            function activate() {
                read_file_exchanges();
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherFileExchangeCtrl#read_file_exchanges
             * @methodOf psonocli.controller:OtherFileExchangeCtrl
             *
             * @description
             * Reads all api keys from the backend
             */
            function read_file_exchanges() {
                managerFileExchange.read_file_exchanges().then(function (file_exchanges) {
                    $scope.file_exchanges=file_exchanges;
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherFileExchangeCtrl#create_new_file_exchange
             * @methodOf psonocli.controller:OtherFileExchangeCtrl
             *
             * @description
             * Creates a new datastore
             */
            function create_new_file_exchange() {


                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/create-file-exchange.html',
                    controller: 'ModalCreateFileExchangeCtrl',
                    resolve: {}
                });

                modalInstance.result.then(function () {

                    read_file_exchanges();

                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherFileExchangeCtrl#edit_file_exchange
             * @methodOf psonocli.controller:OtherFileExchangeCtrl
             *
             * @description
             * edits an file_exchanges
             *
             * @param {TreeObject} file_exchange The file_exchange to edit
             */
            function edit_file_exchange(file_exchange) {

                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(file_exchange) {

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/edit-file-exchange.html',
                        controller: 'ModalEditFileExchangeCtrl',
                        resolve: {
                            file_exchange: function () {
                                return file_exchange;
                            }
                        }
                    });

                    modalInstance.result.then(function (form) {
                        // save triggered
                    }, function () {
                        // cancel triggered
                    });
                };
                return managerFileExchange.read_file_exchange(file_exchange['id'])
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherFileExchangeCtrl#delete_file_exchange
             * @methodOf psonocli.controller:OtherFileExchangeCtrl
             *
             * @description
             * deletes an file_exchange
             *
             * @param {TreeObject} file_exchange The file_exchange to delete
             */
            function delete_file_exchange(file_exchange) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/verify.html',
                    controller: 'ModalVerifyCtrl',
                    resolve: {
                        title: function () {
                            return 'DELETE_FILE_EXCHANGE';
                        },
                        description: function () {
                            return 'DELETE_FILE_EXCHANGE_WARNING';
                        }
                    }
                });

                modalInstance.result.then(function () {
                    // User clicked the yes button

                    var onSuccess = function(){

                        for (var i = $scope.file_exchanges.length - 1; i >= 0; i--) {
                            if ($scope.file_exchanges[i].id !== file_exchange.id) {
                                continue;
                            }
                            $scope.file_exchanges.splice(i, 1);
                        }

                    };

                    var onError = function() {
                        //pass
                    };

                    managerFileExchange.delete_file_exchange(file_exchange.id)
                        .then(onSuccess, onError);


                }, function () {
                    // cancel triggered
                });

            }
        }]
    );
}(angular));