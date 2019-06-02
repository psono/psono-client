(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalCreateLinkShareCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires $uibModal
     * @requires psonocli.converter
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.helper
     * @requires psonocli.languagePicker
     * @requires psonocli.managerLinkShare
     * @requires psonocli.managerHost
     * @requires psonocli.browserClient
     * @requires psonocli.storage
     *
     * @description
     * Controller for the "Create link share" modal
     */
    angular.module('psonocli').controller('ModalCreateLinkShareCtrl', ['$scope', '$uibModalInstance', '$uibModal',
        'converter', 'cryptoLibrary', 'helper', 'languagePicker', 'managerLinkShare',
        'managerHost', 'browserClient', 'storage', 'node',
        function ($scope, $uibModalInstance, $uibModal,
                  converter, cryptoLibrary, helper, languagePicker, managerLinkShare, managerHost, browserClient, storage, node) {

            $scope.copy_to_clipboard = copy_to_clipboard;
            $scope.create = create;
            $scope.cancel = cancel;

            $scope.node = node;
            $scope.errors = [];


            $scope.datepicker = {
                options: {
                    locale: languagePicker.get_active_language_code(),
                    minDate: moment()
                }
            };

            $scope.state = {
                public_title: node.name,
                allowed_reads: 1,
                valid_till: moment().add(1, 'day'),
                passphrase: '',
                passphrase_repeat: '',
                link_share_access_url: ''
            };

            activate();

            function activate() {


            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalCreateLinkShareCtrl#create
             * @methodOf psonocli.controller:ModalCreateLinkShareCtrl
             *
             * @description
             * Triggered once someone clicks the create button in the modal
             */
            function create() {

                $scope.errors = [];
                if ($scope.state.passphrase && $scope.state.passphrase !== $scope.state.passphrase_repeat) {
                    $scope.errors.push('PASSPHRASE_MISSMATCH');
                    return;
                }

                var link_share_secret = cryptoLibrary.generate_secret_key();

                var content = {
                    secret_id: node.secret_id,
                    secret_key: node.secret_key,
                    type: node.type
                };
                if (node.hasOwnProperty('file_chunks')) {
                    content['file_chunks'] = node['file_chunks'];
                }
                if (node.hasOwnProperty('file_id')) {
                    content['file_id'] = node['file_id'];
                }
                if (node.hasOwnProperty('file_secret_key')) {
                    content['file_secret_key'] = node['file_secret_key'];
                }
                if (node.hasOwnProperty('file_shard_id')) {
                    content['file_shard_id'] = node['file_shard_id'];
                }
                if (node.hasOwnProperty('file_title')) {
                    content['file_title'] = node['file_title'];
                }

                var node_encrypted = cryptoLibrary.encrypt_data(
                    JSON.stringify(content),
                    link_share_secret
                );

                var valid_till = null;
                if ($scope.state.valid_till !== null) {
                    valid_till = $scope.state.valid_till.toISOString();
                }

                var file_id = undefined;
                var secret_id = undefined;

                if (node.hasOwnProperty('file_id')) {
                    file_id = node.file_id;
                } else {
                    secret_id = node.secret_id;
                }

                var onError = function(result) {
                    // pass
                    console.log(result);
                };

                var onSuccess = function(result) {
                    managerHost.info()
                        .then(function(info) {
                            var server = storage.find_key('config', 'server');
                            var encoded_server_url = converter.to_base58(converter.encode_utf8(server['value']['url']));

                            $scope.state.link_share_access_url = info['data']['decoded_info']['web_client'] + '/link-share-access.html#!/link-share-access/'+ result.link_share_id +'/' + link_share_secret +'/'+ encoded_server_url;
                        });
                    //$uibModalInstance.close();
                };

                managerLinkShare
                    .create_link_share(secret_id, file_id, node_encrypted.text, node_encrypted.nonce, $scope.state.public_title, $scope.state.allowed_reads, $scope.state.passphrase, valid_till)
                    .then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalCreateLinkShareCtrl#copy_to_clipboard
             * @methodOf psonocli.controller:ModalCreateLinkShareCtrl
             *
             * @description
             * Triggered once someone clicks the copy to clipboard button
             */
            function copy_to_clipboard(content) {
                browserClient.copy_to_clipboard(content);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalCreateLinkShareCtrl#cancel
             * @methodOf psonocli.controller:ModalCreateLinkShareCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $uibModalInstance.dismiss('cancel');
            }
        }]);

}(angular));