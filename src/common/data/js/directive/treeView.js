(function(angular) {
    'use strict';

    /**
     * @ngdoc directive
     * @name ngTree.directive:treeView
     * @requires $q
     * @requires $timeout
     * @requires treeViewDefaults
     * @scope
     * @restrict A
     *
     * @description
     * Directive for the tree structure
     */
    var treeView = function($q, $timeout, treeViewDefaults) {
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
                    selectedItem,
                    counter = 0;

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
                 * returns the global counter
                 * @returns {number}
                 */
                self.getCounter = function() {
                    return counter;
                };

                /**
                 * increases the global counter
                 *
                 * @returns {number}
                 */
                self.incCounter = function() {
                    counter = counter + 1;
                    return counter;
                };

                /**
                 * decreases the global counter
                 *
                 * @returns {number}
                 */
                self.decCounter = function() {
                    counter = counter - 1;
                    return counter;
                };

                var lastDraggedItem = null;
                var lastDraggedItemPath = null;
                var lastDraggedItemType = null;

                /**
                 * remembers the last dragged item and path to that item
                 *
                 * @param data
                 * @param idPath
                 * @param type
                 */
                self.setLastDraggedItem = function(data, idPath, type) {
                    lastDraggedItem = data;
                    lastDraggedItemPath = idPath;
                    lastDraggedItemType = type;
                };

                /**
                 * returns the last dragged item and the path to that item
                 *
                 * @returns {{data: *, path: *}}
                 */
                self.getLastDraggedItem = function() {
                    return {data: lastDraggedItem, path: lastDraggedItemPath, type: lastDraggedItemType};
                };

                /**
                 * the core function to actually do some of the drag and drop handling logic
                 *
                 * @param evt
                 * @param target_path
                 */
                self.onAnyDrop = function (evt, target_path) {

                    if (options.blockMove()) {
                        return;
                    }

                    var dragged_item = self.getLastDraggedItem();
                    var node_type;
                    if (dragged_item.type === null && evt.hasOwnProperty('element')) {
                        node_type = self.getNodeType(evt);
                    } else if (dragged_item.type !== null){
                        node_type = dragged_item.type;
                    } else {
                        // only a click, not a real drag n drop
                        return;
                    }

                    // lets avoid some unnecessary logic whenever the dragged item is already at the target position
                    if (dragged_item.path.length === 1 && target_path === null) {
                        // target is already at the top
                        return;
                    }

                    if (target_path !== null && dragged_item.path[dragged_item.path.length - 2] === target_path[target_path.length - 1]) {
                        // target folder location did not change
                        return;
                    }

                    if (node_type === 'item' && typeof options.onItemDropComplete === "function") {
                        options.onItemDropComplete(dragged_item.path, target_path);
                    }

                    if (node_type === 'folder' && typeof options.onFolderDropComplete === "function") {
                        options.onFolderDropComplete(dragged_item.path, target_path);
                    }
                };

                var dragstarted = false;

                /**
                 * retuns weather the the drag already started or not
                 *
                 * @returns {boolean}
                 */
                self.isDragStarted = function () {
                    return dragstarted;
                };

                /**
                 * sets the drag state to started
                 */
                self.setDragStarted = function (){
                    dragstarted = true;
                };

                /**
                 * resets the drag state
                 */
                self.resetDragStarted = function () {
                    dragstarted = false;
                };

                var drags_in_progress = 0;
                var drag_start_client_y = 0;
                /**
                 * increments the drag in progress counter.
                 */
                self.setDragInProgress = function (){
                    drags_in_progress = drags_in_progress + 1;
                };

                /**
                 * increments the drag in progress counter.
                 */
                self.isDragEvent = function (event){
                    return Math.abs(event.clientY - drag_start_client_y) > 3;
                };

                /**
                 * indicates if there is still a drag in progress
                 */
                self.isDragInProgress = function (){
                    return drags_in_progress > 0;
                };

                /**
                 * decrements the drag in progress counter.
                 */
                self.setDragFinished = function (){
                    if (self.isDragInProgress()) {
                        drags_in_progress = drags_in_progress - 1;
                    }
                };

                self.draggable_end_timeouts = [];

                /**
                 * triggered once a drag ends with or without dropping it on top of another folder / item
                 */
                $rootScope.$on('draggable:end', function(evt, args) {
                    self.resetDragStarted();

                    self.draggable_end_timeouts.push($timeout(function() {
                        self.onAnyDrop(evt, null)
                    }, 100));

                });

                /**
                 * triggered once a drag ends with or without dropping it on top of another folder / item
                 */
                $rootScope.$on('draggable:longpress', function(event, args) {
                    drag_start_client_y = args.event.clientY;
                });


                /**
                 * cancels all draggable end timeouts
                 */
                self.cancel_draggable_end_timeouts = function () {
                    for (var i = 0; i < self.draggable_end_timeouts.length; i++) {
                        $timeout.cancel(self.draggable_end_timeouts[i]);
                    }
                    self.draggable_end_timeouts = [];
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
    app.directive('treeView', ['$q', '$timeout', 'treeViewDefaults', treeView]);

}(angular));