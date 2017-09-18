(function(angular, qrcode) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalConfigureGoogleAuthenticatorCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "Setup Google Authenticator" modal
     */
    angular.module('psonocli').controller('ModalConfigureGoogleAuthenticatorCtrl', ['$scope', '$uibModalInstance', 'managerDatastoreUser', 'helper',
        function ($scope, $uibModalInstance, managerDatastoreUser, helper) {

            $scope.create_ga = create_ga;
            $scope.delete_ga = delete_ga;
            $scope.close = close;

            $scope.new_ga = { 'title': undefined };
            $scope.gas = [];

            activate();

            function activate() {

                managerDatastoreUser.read_ga()
                    .then(function(gas) {
                        $scope.gas = gas;
                    });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalConfigureGoogleAuthenticatorCtrl#create_ga
             * @methodOf psonocli.controller:ModalConfigureGoogleAuthenticatorCtrl
             *
             * @description
             * Triggered once someone clicks the "New Google Authenticator" button in the modal
             *
             * @param {string} new_ga The new Google Authenticator object with title attribute
             *
             * @return {promise} Returns a promise with the new Google authenticator secret
             */
            function create_ga(new_ga) {

                if (typeof(new_ga.title) === 'undefined') {
                    $scope.errors = ['Title is required'];
                    return $q.resolve();
                } else {
                    $scope.errors = [];
                }

                var onSuccess = function(ga) {

                    var typeNumber = 6;
                    var errorCorrectionLevel = 'L';
                    var qr = qrcode(typeNumber, errorCorrectionLevel);
                    qr.addData(ga.uri);
                    qr.make();
                    $scope.google_authenticator_html = qr.createImgTag(4, 16);
                    $scope.gas.push({
                        'id': ga.id,
                        'title': new_ga['title']
                    });
                };

                var onError = function() {
                    //pass
                };

                return managerDatastoreUser.create_ga(new_ga.title).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalConfigureGoogleAuthenticatorCtrl#delete_ga
             * @methodOf psonocli.controller:ModalConfigureGoogleAuthenticatorCtrl
             *
             * @description
             * Triggered once someone clicks on a delete link
             *
             * @param {string} gas A list of all current google authenticator
             * @param {string} ga_id The id of the google Authenticator to delete
             *
             * @return {promise} Returns a promise which can result either to true of false
             */
            function delete_ga(gas, ga_id) {

                var onSuccess = function() {
                    helper.remove_from_array(gas, ga_id, function(a, b){ return a.id === b});
                    return true;
                };

                var onError = function() {
                    return false;
                };

                return managerDatastoreUser.delete_ga(ga_id).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalConfigureGoogleAuthenticatorCtrl#close
             * @methodOf psonocli.controller:ModalConfigureGoogleAuthenticatorCtrl
             *
             * @description
             * Triggered once someone clicks the close button in the modal
             */
            function close() {
                $uibModalInstance.dismiss('close');
            }

        }]
    );
}(angular, qrcode));
