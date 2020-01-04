(function(angular, qrcode) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalShowQRClientConfigCtrl
     * @requires $q
     * @requires $scope
     * @requires $uibModalInstance
     * @requires psonocli.browserClient
     *
     * @description
     * Controller for the "Setup Emergency Codes" modal
     */
    angular.module('psonocli').controller('ModalShowQRClientConfigCtrl', ['$q', '$scope',
        '$uibModalInstance', 'browserClient',
        function ($q, $scope,
                  $uibModalInstance, browserClient) {

            $scope.close = close;

            activate();

            function activate() {

                browserClient.load_config()
                    .then(function(config) {
                        var typeNumber = 0;
                        var errorCorrectionLevel = 'L';
                        var qr = qrcode(typeNumber, errorCorrectionLevel);
                        qr.addData(JSON.stringify({
                            client_config: config
                        }));
                        qr.make();
                        $scope.qr_code_html = qr.createImgTag(4, 16);
                    });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalShowQRClientConfigCtrl#close
             * @methodOf psonocli.controller:ModalShowQRClientConfigCtrl
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
