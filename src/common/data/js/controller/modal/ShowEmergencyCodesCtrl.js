(function(angular, qrcode) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalShowEmergencyCodesCtrl
     * @requires $q
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "Setup Emergency Codes" modal
     */
    angular.module('psonocli').controller('ModalShowEmergencyCodesCtrl', ['$q', '$scope', '$uibModalInstance', 'managerDatastoreUser', 'helper',
        function ($q, $scope, $uibModalInstance, managerDatastoreUser, helper) {

            $scope.create_emergency_code = create_emergency_code;
            $scope.activate_emergency_code = activate_emergency_code;
            $scope.delete_emergency_code = delete_emergency_code;
            $scope.close = close;
            $scope.goto_step3 = goto_step3;

            $scope.new_emergency_code = {
                'id': undefined,
                'title': undefined,
                'integration_key': undefined,
                'secret_key': undefined,
                'host': undefined,
                'code': undefined
            };

            $scope.emergency_codes = [];
            $scope.step = "step1";

            activate();

            function activate() {

                managerDatastoreUser.read_emergency_codes()
                    .then(function(emergency_codes) {
                        $scope.emergency_codes = emergency_codes;
                    });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalShowEmergencyCodesCtrl#create_emergency_code
             * @methodOf psonocli.controller:ModalShowEmergencyCodesCtrl
             *
             * @description
             * Triggered once someone clicks the "New Duo" button in the modal
             *
             * @param {string} new_emergency_code The new Duo object with title attribute
             *
             * @return {promise} Returns a promise with the new Duo secret
             */
            function create_emergency_code(new_emergency_code) {

                $scope.errors = [];

                if (typeof(new_emergency_code.title) === 'undefined' || new_emergency_code.title === '') {
                    $scope.errors.push('Title is required');
                }

                if (typeof(new_emergency_code.integration_key) === 'undefined' || new_emergency_code.integration_key === '') {
                    $scope.errors.push('Integration Key is required');
                }

                if (typeof(new_emergency_code.secret_key) === 'undefined' || new_emergency_code.secret_key === '') {
                    $scope.errors.push('Secret Key is required');
                }

                if (typeof(new_emergency_code.host) === 'undefined' || new_emergency_code.host === '') {
                    $scope.errors.push('Host is required');
                }

                if ($scope.errors.length !== 0) {
                    return $q.resolve();
                }

                var onSuccess = function(emergency_code) {

                    var typeNumber = 6;
                    var errorCorrectionLevel = 'L';
                    var qr = qrcode(typeNumber, errorCorrectionLevel);
                    qr.addData(emergency_code.uri);
                    qr.make();
                    $scope.emergency_code_html = qr.createImgTag(4, 16);
                    $scope.emergency_codes.push({
                        'id': emergency_code.id,
                        'title': new_emergency_code['title']
                    });
                    $scope.new_emergency_code['id'] = emergency_code.id;
                    $scope.step = "step2";
                };

                var onError = function(data) {
                    if (data.hasOwnProperty('non_field_errors')) {
                        $scope.errors = data.non_field_errors;
                    } else {
                        console.log(data);
                        alert("Error, should not happen.");
                    }
                };

                return managerDatastoreUser.create_emergency_code(new_emergency_code.title, new_emergency_code.integration_key, new_emergency_code.secret_key, new_emergency_code.host).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalShowEmergencyCodesCtrl#activate_emergency_code
             * @methodOf psonocli.controller:ModalShowEmergencyCodesCtrl
             *
             * @description
             * Triggered automatically and once someone clicks the "Validate Duo" button in the modal
             *
             * @param {string} new_emergency_code The new Duo object with code attribute
             *
             * @return {promise} Returns a promise whether it succeeded or not
             */
            function activate_emergency_code(new_emergency_code) {
                $scope.errors = [];

                var onSuccess = function(successful) {
                    if(successful) {
                        $uibModalInstance.dismiss('close');
                    } else {
                        $scope.errors = ['Code incorrect. Please try again.'];
                    }
                };

                var onError = function() {
                    //pass
                };

                return managerDatastoreUser.activate_emergency_code(new_emergency_code.id, new_emergency_code.code).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalShowEmergencyCodesCtrl#delete_emergency_code
             * @methodOf psonocli.controller:ModalShowEmergencyCodesCtrl
             *
             * @description
             * Triggered once someone clicks on a delete link
             *
             * @param {string} emergency_codes A list of all current emergency_codes
             * @param {string} emergency_code_id The id of the emergency_code to delete
             *
             * @return {promise} Returns a promise which can result either to true of false
             */
            function delete_emergency_code(emergency_codes, emergency_code_id) {
                $scope.delete_errors = [];

                var onSuccess = function() {
                    helper.remove_from_array(emergency_codes, emergency_code_id, function(a, b){ return a.id === b});
                    return true;
                };

                var onError = function(errors) {
                    $scope.delete_errors = errors.non_field_errors;
                };

                return managerDatastoreUser.delete_emergency_code(emergency_code_id).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalShowEmergencyCodesCtrl#goto_step3
             * @methodOf psonocli.controller:ModalShowEmergencyCodesCtrl
             *
             * @description
             * Triggered once someone clicks the "Next" button in the modal
             */
            function goto_step3() {
                activate_emergency_code($scope.new_emergency_code);
                $scope.step = "step3";
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalShowEmergencyCodesCtrl#close
             * @methodOf psonocli.controller:ModalShowEmergencyCodesCtrl
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
