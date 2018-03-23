(function(angular, qrcode) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalConfigureDuoCtrl
     * @requires $q
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.helper
     *
     * @description
     * Controller for the "Setup Duo" modal
     */
    angular.module('psonocli').controller('ModalConfigureDuoCtrl', ['$q', '$scope', '$uibModalInstance', 'managerDatastoreUser', 'helper',
        function ($q, $scope, $uibModalInstance, managerDatastoreUser, helper) {

            $scope.create_duo = create_duo;
            $scope.activate_duo = activate_duo;
            $scope.delete_duo = delete_duo;
            $scope.close = close;
            $scope.goto_step3 = goto_step3;

            $scope.new_duo = {
                'id': undefined,
                'title': undefined,
                'integration_key': undefined,
                'secret_key': undefined,
                'host': undefined,
                'code': undefined
            };

            $scope.duos = [];
            $scope.step = "step1";

            activate();

            function activate() {

                managerDatastoreUser.read_duo()
                    .then(function(duos) {
                        $scope.duos = duos;
                    });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalConfigureDuoCtrl#create_duo
             * @methodOf psonocli.controller:ModalConfigureDuoCtrl
             *
             * @description
             * Triggered once someone clicks the "New Duo" button in the modal
             *
             * @param {string} new_duo The new Duo object with title attribute
             *
             * @return {promise} Returns a promise with the new Duo secret
             */
            function create_duo(new_duo) {

                $scope.errors = [];

                if (typeof(new_duo.title) === 'undefined' || new_duo.title === '') {
                    $scope.errors.push('Title is required');
                }

                if (typeof(new_duo.integration_key) === 'undefined' || new_duo.integration_key === '') {
                    $scope.errors.push('Integration Key is required');
                }

                if (typeof(new_duo.secret_key) === 'undefined' || new_duo.secret_key === '') {
                    $scope.errors.push('Secret Key is required');
                }

                if (typeof(new_duo.host) === 'undefined' || new_duo.host === '') {
                    $scope.errors.push('Host is required');
                }

                if ($scope.errors.length !== 0) {
                    return $q.resolve();
                }

                var onSuccess = function(duo) {

                    var typeNumber = 6;
                    var errorCorrectionLevel = 'L';
                    var qr = qrcode(typeNumber, errorCorrectionLevel);
                    qr.addData(duo.uri);
                    qr.make();
                    $scope.duo_html = qr.createImgTag(4, 16);
                    $scope.duos.push({
                        'id': duo.id,
                        'title': new_duo['title']
                    });
                    $scope.new_duo['id'] = duo.id;
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

                return managerDatastoreUser.create_duo(new_duo.title, new_duo.integration_key, new_duo.secret_key, new_duo.host).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalConfigureDuoCtrl#activate_duo
             * @methodOf psonocli.controller:ModalConfigureDuoCtrl
             *
             * @description
             * Triggered automatically and once someone clicks the "Validate Duo" button in the modal
             *
             * @param {string} new_duo The new Duo object with code attribute
             *
             * @return {promise} Returns a promise whether it succeeded or not
             */
            function activate_duo(new_duo) {
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

                return managerDatastoreUser.activate_duo(new_duo.id, new_duo.code).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalConfigureDuoCtrl#delete_duo
             * @methodOf psonocli.controller:ModalConfigureDuoCtrl
             *
             * @description
             * Triggered once someone clicks on a delete link
             *
             * @param {string} duos A list of all current duos
             * @param {string} duo_id The id of the duo to delete
             *
             * @return {promise} Returns a promise which can result either to true of false
             */
            function delete_duo(duos, duo_id) {
                $scope.delete_errors = [];

                var onSuccess = function() {
                    helper.remove_from_array(duos, duo_id, function(a, b){ return a.id === b});
                    return true;
                };

                var onError = function(errors) {
                    $scope.delete_errors = errors.non_field_errors;
                };

                return managerDatastoreUser.delete_duo(duo_id).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalConfigureDuoCtrl#goto_step3
             * @methodOf psonocli.controller:ModalConfigureDuoCtrl
             *
             * @description
             * Triggered once someone clicks the "Next" button in the modal
             */
            function goto_step3() {
                activate_duo($scope.new_duo);
                $scope.step = "step3";
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalConfigureDuoCtrl#close
             * @methodOf psonocli.controller:ModalConfigureDuoCtrl
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
