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
            template: '<div class="tree-container">\n    ' +
            '<form name="searchTreeForm" class="widget-searchform">\n        ' +
            '<div class="row">\n            ' +
            '<div class="col-xs-offset-4 col-xs-8 col-sm-offset-6 col-sm-6 col-md-offset-8 col-md-4">\n                ' +
            '<div class="input-group">\n                    ' +
            '<input type="text" class="form-control" id="tosearchTreeForm" placeholder="search"\n                           ng-model="tosearchTreeFilter">\n                    ' +
            '<span class="input-group-btn">\n                        ' +
            '<button class="btn btn-default" ng-disabled="!tosearchTreeFilter"\n                                                        ng-click="clearSearchTreeForm()" type="button">\n                            <i class="fa fa-ban"></i>\n                        </button>\n                    ' +
            '</span>\n                ' +
            '</div>\n            ' +
            '</div>\n        ' +
            '</div>\n    ' +
            '</form>\n    ' +
            '<div class="tree">\n        ' +
            '<div tree-view-node="treeView">' +
            '</div>\n    ' +
            '</div>\n' +
            '</div>',
            controller: ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {
                var self = this,
                    selectedNode,
                    selectedItem,
                    counter = 0;

                var options = angular.extend({}, treeViewDefaults, $scope.treeViewOptions);

                if (typeof options.getDefaultSearch === "function") {
                    $scope.tosearchTreeFilter = options.getDefaultSearch();
                }

                /**
                 * searches a tree and marks all folders / items as invisible, only leaving nodes with search
                 *
                 * @param newValue
                 * @param oldValue
                 * @param searchTree
                 */
                var modifyTreeForSearch = function (newValue, oldValue, searchTree) {
                    if (typeof newValue === 'undefined') {
                        return;
                    }

                    var show = false;

                    var i, ii;
                    if (searchTree.hasOwnProperty('folders')) {
                        for (i = searchTree.folders.length - 1; searchTree.folders && i >= 0; i--) {
                            show = modifyTreeForSearch(newValue, oldValue, searchTree.folders[i]) || show;
                        }
                    }

                    newValue = newValue.toLowerCase();
                    var searchStrings = newValue.split(" ");

                    // Test title of the items
                    var containCounter = 0;
                    if (searchTree.hasOwnProperty('items')) {
                        for (i = searchTree.items.length - 1; searchTree.items && i >= 0; i--) {
                            containCounter = 0;
                            for (ii = searchStrings.length - 1; ii >= 0; ii--) {
                                if (typeof(searchTree.items[i].name) === 'undefined') {
                                    continue;
                                }
                                if (searchTree.items[i].name.toLowerCase().indexOf(searchStrings[ii]) > -1) {
                                    containCounter++
                                }
                            }
                            if (containCounter === searchStrings.length) {
                                searchTree.items[i].hidden = false;
                                show = true;
                            } else {
                                searchTree.items[i].hidden = true;
                            }
                        }
                    }
                    // Test title of the folder
                    if (typeof searchTree.name !== 'undefined') {
                        containCounter = 0;
                        for (ii = searchStrings.length - 1; ii >= 0; ii--) {
                            if (searchTree.name.toLowerCase().indexOf(searchStrings[ii]) > -1) {
                                containCounter++
                            }
                        }
                        if (containCounter === searchStrings.length) {
                            show = true;
                        }
                    }
                    searchTree.hidden = !show;
                    searchTree.expanded_temporary = newValue !== '';

                    return show;
                };

                $scope.$watch('tosearchTreeFilter', function(newValue, oldValue) {
                    modifyTreeForSearch(newValue, oldValue, $scope.treeView);
                });

                /**
                 * clears the input field for the tree search
                 */
                $scope.clearSearchTreeForm = function () {
                    $scope.tosearchTreeFilter = '';
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

                /**
                 * increments the drag in progress counter.
                 */
                self.setDragInProgress = function (){
                    drags_in_progress = drags_in_progress + 1;
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


                    if (evt.element.context.className.indexOf('tree-item') > -1) {
                        return 'item';
                    } else if (evt.element.context.className.indexOf('tree-folder') > -1) {
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