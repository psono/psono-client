(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalConfigureYubiKeyOTPCtrl
     * @requires $scope
     * @requires $q
     * @requires $uibModalInstance
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "Setup Google Authenticator" modal
     */
    angular.module('psonocli').controller('ModalConfigureYubiKeyOTPCtrl', ['$scope', '$q', '$uibModalInstance', 'managerDatastoreUser', 'helper',
        function ($scope, $q, $uibModalInstance, managerDatastoreUser, helper) {

            $scope.create_yubikey_otp = create_yubikey_otp;
            $scope.delete_yubikey_otp = delete_yubikey_otp;
            $scope.close = close;

            $scope.new_yubikey_otp = { 'title': undefined, 'otp': undefined };
            $scope.gas = [];

            activate();

            function activate() {

                managerDatastoreUser.read_yubikey_otp()
                    .then(function(yubikey_otps) {
                        $scope.yubikey_otps = yubikey_otps;
                    });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalConfigureYubiKeyOTPCtrl#create_yubikey_otp
             * @methodOf psonocli.controller:ModalConfigureYubiKeyOTPCtrl
             *
             * @description
             * Triggered once someone clicks the "New Google Authenticator" button in the modal
             *
             * @param {string} new_yubikey_otp The new Google Authenticator object with title attribute
             *
             * @return {promise} Returns a promise with the new Google authenticator secret
             */
            function create_yubikey_otp(new_yubikey_otp) {
                $scope.errors = [];

                if (typeof(new_yubikey_otp.title) === 'undefined' || new_yubikey_otp.title === '') {
                    $scope.errors = ['Title is required'];
                    return $q.resolve();
                }

                var onSuccess = function() {
                    $uibModalInstance.dismiss('close');
                };

                var onError = function() {
                    //pass
                };

                return managerDatastoreUser.create_yubikey_otp(new_yubikey_otp.title, new_yubikey_otp.otp).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalConfigureYubiKeyOTPCtrl#delete_ga
             * @methodOf psonocli.controller:ModalConfigureYubiKeyOTPCtrl
             *
             * @description
             * Triggered once someone clicks on a delete link
             *
             * @param {string} yubikey_otps A list of all current Yubikey
             * @param {string} yubikey_otp_id The id of the Yubikey to delete
             *
             * @return {promise} Returns a promise which can result either to true of false
             */
            function delete_yubikey_otp(yubikey_otps, yubikey_otp_id) {
                $scope.delete_errors = [];

                var onSuccess = function() {
                    helper.remove_from_array(yubikey_otps, yubikey_otp_id, function(a, b){
                        return a.id === b
                    });
                };

                var onError = function(errors) {
                    $scope.delete_errors = errors.non_field_errors;
                };

                return managerDatastoreUser.delete_yubikey_otp(yubikey_otp_id).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalConfigureYubiKeyOTPCtrl#close
             * @methodOf psonocli.controller:ModalConfigureYubiKeyOTPCtrl
             *
             * @description
             * Triggered once someone clicks the close button in the modal
             */
            function close() {
                $uibModalInstance.dismiss('close');
            }

        }]
    );
}(angular));
