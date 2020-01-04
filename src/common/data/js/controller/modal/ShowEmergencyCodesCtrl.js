(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalShowEmergencyCodesCtrl
     * @requires $q
     * @requires $scope
     * @requires $translate
     * @requires $uibModalInstance
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "Setup Emergency Codes" modal
     */
    angular.module('psonocli').controller('ModalShowEmergencyCodesCtrl', ['$q', '$scope', '$translate',
        '$uibModalInstance', 'managerDatastoreUser', 'managerHost', 'helper', 'DTOptionsBuilder', 'DTColumnDefBuilder',
        'languagePicker',
        function ($q, $scope, $translate,
                  $uibModalInstance, managerDatastoreUser, managerHost, helper, DTOptionsBuilder, DTColumnDefBuilder,
                  languagePicker) {

            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withLanguageSource('translations/datatables.' + languagePicker.get_active_language_code() + '.json');

            $scope.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1)
            ];

            var _translations;
            var _server_info;


            $scope.create_emergency_code = create_emergency_code;
            $scope.arm_emergency_code = arm_emergency_code;
            $scope.delete_emergency_code = delete_emergency_code;
            $scope.close = close;
            $scope.goto_step3 = goto_step3;

            $scope.new_emergency_code = {
                'id': undefined,
                'title': undefined,
                'lead_time': undefined
            };

            $scope.emergency_codes = [];
            $scope.step = "step1";

            activate();

            function activate() {

                managerDatastoreUser.read_emergency_codes()
                    .then(function(emergency_codes) {
                        $scope.emergency_codes = emergency_codes;
                    });

                managerHost.info()
                    .then(function(info) {
                        _server_info = info;
                    });



                $translate([
                    'TITLE_IS_REQUIRED',
                    'LEAD_TIME_IS_REQUIRED'
                ]).then(function (translations) {
                    _translations = translations;
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
                    $scope.errors.push(_translations.TITLE_IS_REQUIRED);
                }

                if (typeof(new_emergency_code.lead_time) === 'undefined' || new_emergency_code.lead_time === '') {
                    $scope.errors.push(_translations.LEAD_TIME_IS_REQUIRED);
                }

                if ($scope.errors.length !== 0) {
                    return $q.resolve();
                }

                var onSuccess = function(emergency_code) {
                    $scope.new_emergency_code['id'] = emergency_code.id;
                    $scope.new_emergency_code['username'] = emergency_code.username;
                    $scope.new_emergency_code['emergency_password'] = emergency_code.emergency_password;
                    $scope.new_emergency_code['emergency_words'] = emergency_code.emergency_words;
                    $scope.new_emergency_code['url'] = _server_info['data']['decoded_info']['web_client'] + '/emergency-code.html';
                    $scope.step = "step2";
                };

                var onError = function(data) {
                    if (data.hasOwnProperty('non_field_errors')) {
                        $scope.errors = data.non_field_errors;
                    } else if (data.hasOwnProperty('activation_delay')) {
                        $scope.errors.push(data['activation_delay'][0])
                    } else {
                        console.log(data);
                        alert("Error, should not happen.");
                    }
                };

                var lead_time = new_emergency_code.lead_time * 60 * 60;

                return managerDatastoreUser.create_emergency_code(new_emergency_code.title, lead_time).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalShowEmergencyCodesCtrl#arm_emergency_code
             * @methodOf psonocli.controller:ModalShowEmergencyCodesCtrl
             *
             * @description
             * Triggered automatically and once someone clicks the "Validate Duo" button in the modal
             *
             * @param {string} new_emergency_code The new Duo object with code attribute
             *
             * @return {promise} Returns a promise whether it succeeded or not
             */
            function arm_emergency_code(new_emergency_code) {
                $scope.errors = [];

                var onSuccess = function(successful) {
                    if(successful) {
                        $uibModalInstance.dismiss('close');
                    } else {
                        $scope.errors = ['CODE_INCORRECT'];
                    }
                };

                var onError = function() {
                    //pass
                };

                return managerDatastoreUser.arm_emergency_code(new_emergency_code.id, new_emergency_code.code).then(onSuccess, onError);
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
                arm_emergency_code($scope.new_emergency_code);
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
}(angular));
