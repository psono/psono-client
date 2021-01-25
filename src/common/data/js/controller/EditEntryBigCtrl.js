(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalEditEntryBigCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires $uibModal
     * @requires $interval
     * @requires psonocli.itemBlueprint
     *
     * @description
     * Controller for the "Edit Entry" modal
     */
    angular.module('psonocli').controller('ModalEditEntryBigCtrl', ['$scope', '$rootScope', '$uibModal', '$interval', 'itemBlueprint', 'cryptoLibrary',
        function ($scope, $rootScope, $uibModal, $interval, itemBlueprint, cryptoLibrary) {
            $scope.show_history = show_history;
            $scope.reset = reset;
            $scope.save = save;
            $scope.cancel = cancel;
            $scope.toggle_input_type = toggle_input_type;

            $scope.content = '';
            $scope.isCollapsed = true;
            $scope.otherData = {
                'totp_colors': ['#5cb85c', '#cccccc'],
                'totp_percentage': [0],
                'totp_options': {
                    'aspectRatio': 1,
                    'cutoutPercentage': 85,
                },
                'totp_token': '',
            };
            $scope.errors = [];
            var timer;
            activate();

            var onClose = function() {};
            var onSave = function(data) {};

            function activate(){

                $rootScope.$on('show-entry-big-load', function(evt, args) {
                    var i;
                    onClose=args.onClose;
                    onSave=args.onSave;
                    $scope.node=args.node;
                    $scope.path=args.path;
                    $scope.data=args.data;
                    $scope.name = args.node.name;
                    $scope.bp = {
                        all: itemBlueprint.get_blueprints(),
                        selected: itemBlueprint.get_blueprint($scope.node.type)
                    };

                    for (i = $scope.bp.selected.fields.length - 1; i >= 0; i--) {
                        if ($scope.data.hasOwnProperty($scope.bp.selected.fields[i].name)) {
                            $scope.bp.selected.fields[i].value = $scope.data[$scope.bp.selected.fields[i].name];
                        }
                    }
                    if ($scope.node.type === 'totp') {
                        var totp_code = ''
                        for (i = $scope.bp.selected.fields.length - 1; i >= 0; i--) {
                            if ($scope.bp.selected.fields[i].hasOwnProperty('type') && $scope.bp.selected.fields[i].hasOwnProperty('value') && $scope.bp.selected.fields[i]['type'] === 'totp_code') {
                                totp_code = $scope.bp.selected.fields[i]['value'];
                            }
                        }
                        timer = $interval(function() {
                            $scope.otherData['totp_token'] = cryptoLibrary.get_totp_token(totp_code);
                            var percentage = 100 - (30 - (Math.round(new Date().getTime() / 1000.0) % 30)) / 0.3
                            $scope.otherData['totp_percentage'] = [percentage, 100-percentage];
                        }, 500);
                    }
                    $scope.$watch('bp.selected', function(newValue, oldValue) {
                        if (typeof $scope.bp.selected.onEditModalOpen !== 'undefined') {
                            $scope.bp.selected.onEditModalOpen($scope.bp.selected);
                        }
                    });
                    $scope.$on('$destroy', function () {
                        if (timer) {
                            $interval.cancel(timer);
                        }
                    });
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryBigCtrl#show_history
             * @methodOf psonocli.controller:ModalEditEntryBigCtrl
             *
             * @description
             * Triggered once someone clicks show history button
             */
            function show_history(node) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal/history.html',
                    controller: 'ModalHistoryCtrl',
                    resolve: {
                        node: function () {
                            return node;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    // User clicked the yes button
                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryBigCtrl#reset
             * @methodOf psonocli.controller:ModalEditEntryBigCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function reset() {
                $scope.submitted = false;
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryBigCtrl#save
             * @methodOf psonocli.controller:ModalEditEntryBigCtrl
             *
             * @description
             * Triggered once someone clicks the save button in the modal
             */
            function save() {

                if ($scope.editEntryForm.$invalid) {
                    return;
                }
                $scope.bp.selected['callback_data'] = $scope.data;
                onSave($scope.bp.selected);

                $rootScope.$broadcast('close-entry-big', {});
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryBigCtrl#cancel
             * @methodOf psonocli.controller:ModalEditEntryBigCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function cancel() {
                $rootScope.$broadcast('close-entry-big', {});
                onClose();
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalEditEntryBigCtrl#toggle_input_type
             * @methodOf psonocli.controller:ModalEditEntryBigCtrl
             *
             * @description
             * toggles the type of an input
             *
             * @param id
             */
            function toggle_input_type(id) {
                if (document.getElementById(id).type === 'text') {
                    document.getElementById(id).type = 'password';
                } else {
                    document.getElementById(id).type = 'text';
                }
            }
        }]);

}(angular));