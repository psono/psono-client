(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditLinkShareCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires $uibModal
     * @requires languagePicker
     * @requires psonocli.shareBlueprint
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.helper
     * @requires psonocli.languagePicker
     * @requires psonocli.managerLinkShare
     * @requires psonocli.managerHost
     * @requires psonocli.browserClient
     *
     * @description
     * Controller for the "Create link share" modal
     */
    angular.module('psonocli').controller('ModalEditLinkShareCtrl', ['$scope', '$uibModalInstance', '$uibModal', 'languagePicker',
        'cryptoLibrary', 'helper', 'managerLinkShare', 'managerHost', 'browserClient', 'link_share',
        function ($scope, $uibModalInstance, $uibModal, languagePicker,
                  cryptoLibrary, helper, managerLinkShare, managerHost, browserClient, link_share) {

            $scope.edit = edit;
            $scope.cancel = cancel;

            $scope.link_share = link_share;
            $scope.errors = [];


            $scope.datepicker = {
                options: {
                    locale: languagePicker.get_active_language_code(),
                    minDate: moment()
                }
            };

            $scope.state = {
                public_title: link_share.public_title,
                allowed_reads: link_share.allowed_reads,
                change_passphrase: false,
                valid_till: moment(link_share.valid_till),
                passphrase: '',
                passphrase_repeat: '',
                link_share_access_url: ''
            };

            activate();

            function activate() {

            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditLinkShareCtrl#edit
             * @methodOf psonocli.controller:ModalEditLinkShareCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function edit() {

                $scope.errors = [];
                if ($scope.state.change_passphrase && $scope.state.passphrase && $scope.state.passphrase !== $scope.state.passphrase_repeat) {
                    $scope.errors.push('PASSPHRASE_MISSMATCH');
                    return;
                }

                var passphrase = null;
                if ($scope.state.change_passphrase) {
                    passphrase = $scope.state.passphrase;
                }

                var valid_till = null;
                if ($scope.state.valid_till !== null) {
                    valid_till = $scope.state.valid_till.toISOString();
                }

                var onError = function(data) {
                    if (data.hasOwnProperty('non_field_errors')) {
                        $scope.errors = data.non_field_errors;
                    } else {
                        console.log(data);
                        alert("Error, should not happen.");
                    }
                };

                var onSuccess = function(result) {
                    link_share.public_title = $scope.state.public_title;
                    link_share.allowed_reads = $scope.state.allowed_reads;
                    link_share.valid_till = $scope.state.valid_till;
                    $uibModalInstance.close(link_share);
                };
                managerLinkShare
                    .update_link_share(link_share.id, $scope.state.public_title, $scope.state.allowed_reads, passphrase, valid_till)
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditLinkShareCtrl#cancel
             * @methodOf psonocli.controller:ModalEditLinkShareCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));