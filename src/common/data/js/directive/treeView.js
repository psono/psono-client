(function(angular) {
    'use strict';

    /**
     * @ngdoc directive
     * @name ngTree.directive:treeView
     * @requires $q
     * @requires $timeout
     * @requires $uibModal
     * @requires treeViewDefaults
     * @scope
     * @restrict A
     *
     * @description
     * Directive for the tree structure
     */
    var treeView = function($q, $timeout, $uibModal, treeViewDefaults) {
        return {
            restrict: 'A',
            scope: {
                treeView: '=treeView',
                treeViewOptions: '=treeViewOptions'
            },
            replace: true,
            templateUrl: 'view/tree-view.html',
            controller: ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {
                var self = this,
                    selectedNode,
                    selectedItem;

                var options = angular.extend({}, treeViewDefaults, $scope.treeViewOptions);

                /**
                 * opens a new folder modal
                 */
                $scope.openNewFolder = function () {
                    if (typeof options.onNewFolder === "function") {
                        options.onNewFolder(undefined, []);
                    }
                };

                /**
                 * opens a new item modal
                 */
                $scope.openNewItem = function () {
                    if (typeof options.onNewItem === "function") {
                        options.onNewItem(undefined, []);
                    }
                };

                /**
                 * called by the directive whenever a node is selected to handle the possible option
                 *
                 * @param node
                 * @param breadcrumbs
                 * @param id_breadcrumbs
                 */
                self.selectNode = function (node, breadcrumbs, id_breadcrumbs) {
                    if (!self.isSelectable(node)) {
                        return;
                    }

                    if (selectedItem) {
                        selectedItem = undefined;
                    }
                    selectedNode = node;

                    if (typeof options.onNodeSelect === "function") {
                        options.onNodeSelect(node, breadcrumbs, id_breadcrumbs);
                    }
                };

                /**
                 * called by the directive whenever an item is selected to handle the possible option
                 *
                 * @param item
                 * @param breadcrumbs
                 */
                self.selectItem = function (item, breadcrumbs) {
                    if (selectedNode) {
                        selectedNode = undefined;
                    }
                    selectedItem = item;

                    if (typeof options.onItemSelect === "function") {
                        options.onItemSelect(item, breadcrumbs);
                    }
                };

                /**
                 * called by the directive whenever an item is clicked to handle the possible option
                 *
                 * @param item
                 */
                self.clickItem = function (item) {
                    if (typeof options.on_item_click === "function") {
                        options.on_item_click(item);
                    }
                };

                /**
                 * called by the directive whenever a node is clicked to handle the possible option
                 *
                 * @param node
                 */
                self.clickNode = function (node) {
                    if (typeof options.onNodeClick === "function") {
                        options.onNodeClick(node);
                    }
                };

                /**
                 * expends or collapses the node
                 *
                 * @param node
                 */
                self.toggleExpanded = function (node) {
                    var new_expand_status = ! (node.expanded || node.expanded_temporary);
                    node.expanded = new_expand_status;
                    node.expanded_temporary = new_expand_status;
                };

                /**
                 * tests if a node is selected
                 *
                 * @param node
                 *
                 * @returns {boolean}
                 */
                self.isSelected = function (node) {
                    return node === selectedNode || node === selectedItem;
                };

                /**
                 * tests if a node is selectable
                 * it is selectable by default (if not specified)
                 *
                 * @param node
                 * @returns {boolean}
                 */
                self.isSelectable = function (node) {
                    if (typeof options.isSelectable === "function") {
                        return options.isSelectable(node);
                    } else {
                        return true;
                    }
                };

                /**
                 * retuns the options
                 *
                 * @returns {void|*}
                 */
                self.getOptions = function () {
                    return options;
                };


                /**
                 * takes an event (usually the drop event) and returns the type of the dropped item.
                 *
                 * @param evt
                 * @returns string
                 */
                self.getNodeType = function(evt) {

                    if (evt.element[0].className.indexOf('tree-item') > -1) {
                        return 'item';
                    } else if (evt.element[0].className.indexOf('tree-folder') > -1) {
                        return 'folder';
                    } else {
                        return 'unknown';
                    }
                };
            }]
        };
    };

    var app = angular.module('ngTree');
    app.directive('treeView', ['$q', '$timeout', '$uibModal', 'treeViewDefaults', treeView]);

}(angular));
