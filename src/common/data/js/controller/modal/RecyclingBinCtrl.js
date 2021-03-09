(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalRecyclingBinCtrl
     * @requires $scope
     * @requires $uibModalInstance
     * @requires managerWidget
     * @requires helper
     * @requires languagePicker
     * @requires DTOptionsBuilder
     * @requires DTColumnDefBuilder
     * @requires datastore
     * @requires datastore_type
     *
     * @description
     * Controller for the "Recycling Bin" modal
     */
    angular.module('psonocli').controller('ModalRecyclingBinCtrl', ['$scope', '$uibModal', '$uibModalInstance',
        'managerWidget', 'helper', 'languagePicker', 'DTOptionsBuilder', 'DTColumnDefBuilder', 'datastore', 'datastore_type',
        function ($scope, $uibModal, $uibModalInstance,
                  managerWidget, helper, languagePicker, DTOptionsBuilder, DTColumnDefBuilder, datastore, datastore_type) {

            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withLanguageSource('translations/datatables.' + languagePicker.get_active_language_code() + '.json');

            $scope.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1),
                DTColumnDefBuilder.newColumnDef(2)
            ];
            
            $scope.errors = [];
            $scope.data = {
            };

            $scope.close = close;
            $scope.restore_entry = restore_entry;
            $scope.delete_entry = delete_entry;

            activate();

            function activate() {
                $scope.data['recycling_bin_entries'] = [];
                fill_recycling_bin_entries(datastore, []);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalRecyclingBinCtrl#fill_recycling_bin_entries
             * @methodOf psonocli.controller:ModalRecyclingBinCtrl
             *
             * @description
             * Fills recycling_bin_entries with all deleted entries
             */
            function fill_recycling_bin_entries(folder, path) {
                var path_copy;

                if(typeof folder === 'undefined') {
                    return;
                }

                if (folder.hasOwnProperty('deleted') && folder['deleted']) {
                    if (!folder.hasOwnProperty('share_rights') || !folder.share_rights.delete) {
                        return;
                    }
                    
                    $scope.data['recycling_bin_entries'].push({
                        "path": path,
                        "item": folder,
                        "type": 'folder'
                    })
                    return;
                }

                var i;
                for (i = 0; folder.hasOwnProperty("folders") && i < folder.folders.length; i ++) {
                    path_copy = path.slice();
                    path_copy.push(folder.folders[i].id)
                    fill_recycling_bin_entries(folder.folders[i], path_copy);
                }

                for (i = 0; folder.hasOwnProperty("items") && i < folder.items.length; i++) {
                    if (!folder.items[i].hasOwnProperty('deleted') || !folder.items[i]['deleted']) {
                        continue;
                    }

                    path_copy = path.slice();
                    path_copy.push(folder.items[i].id)

                    if (!folder.items[i].hasOwnProperty('share_rights') || !folder.items[i].share_rights.delete) {
                        continue;
                    }
                    $scope.data['recycling_bin_entries'].push({
                        "path": path_copy,
                        "item": folder.items[i],
                        "type": 'item'
                    })
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalRecyclingBinCtrl#restore_entry
             * @methodOf psonocli.controller:ModalRecyclingBinCtrl
             *
             * @description
             * Triggered once someone clicks the restore button in the modal and restores an entry
             */
            function restore_entry(entry) {
                managerWidget.reverse_mark_item_as_deleted(datastore, entry['item'], entry['path'], datastore_type)
                helper.remove_from_array($scope.data['recycling_bin_entries'], entry, function(a, b){
                    return a.item.id === b.item.id;
                });
                
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalRecyclingBinCtrl#delete_entry
             * @methodOf psonocli.controller:ModalRecyclingBinCtrl
             *
             * @description
             * Triggered once someone clicks the delete button in the modal and permanently deletes an entry
             */
            function delete_entry(entry) {
                var modalInstance

                if (entry['type'] === 'item') {
                    modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/verify.html',
                        controller: 'ModalVerifyCtrl',
                        resolve: {
                            title: function () {
                                return 'DELETE_ENTRY';
                            },
                            description: function () {
                                return 'DELETE_ENTRY_PERMANENT_WARNING';
                            },
                            entries: function () {
                                return [entry['item'].name];
                            },
                            affected_entries_text: function () {
                                return 'AFFECTED_ENTRIES';
                            }
                        }
                    });
                } else {
                    modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/verify.html',
                        controller: 'ModalVerifyCtrl',
                        resolve: {
                            title: function () {
                                return 'DELETE_FOLDER';
                            },
                            description: function () {
                                return 'DELETE_FOLDER_PERMANENT_WARNING';
                            },
                            entries: function () {
                                return [entry['item'].name];
                            },
                            affected_entries_text: function () {
                                return 'AFFECTED_FOLDERS';
                            }
                        }
                    });
                }

                modalInstance.result.then(function () {
                    // User clicked the yes button
                    managerWidget.delete_item(datastore, entry['item'], entry['path'], datastore_type)

                    helper.remove_from_array($scope.data['recycling_bin_entries'], entry, function(a, b){
                        return a.item.id === b.item.id;
                    });
                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ModalRecyclingBinCtrl#close
             * @methodOf psonocli.controller:ModalRecyclingBinCtrl
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
