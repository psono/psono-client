/*
 *  Original:
 *  https://github.com/axel-zarate/angular-tree-view/
 *
 *  The MIT License (MIT)
 *
 *  Copyright (c) 2014 axel-zarate
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation items (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 *
 *  (modified by chickahoona)
 */

(function (angular, undefined) {
    var module = angular.module('ngTree', []);

    module.value('treeViewDefaults', {
        foldersProperty: 'folders',
        itemsProperty: 'items',
        displayProperty: 'name',
        idProperty: 'id',
        collapsible: true
    });


    var dropDownMenuWatcher = function() {

        var opened_dropdown_menu = '';

        var on_open = function(dropdown_menu_id) {
            if (opened_dropdown_menu !== '') {
                angular.element('#' + opened_dropdown_menu).parent().removeClass('open');
            }
            opened_dropdown_menu = dropdown_menu_id;
        };

        var on_close = function(dropdown_menu_id) {
            if (opened_dropdown_menu == dropdown_menu_id){
                opened_dropdown_menu = '';
            }
        };

        return {
            on_open: on_open,
            on_close: on_close
        };
    };

    module.factory("dropDownMenuWatcher", [dropDownMenuWatcher]);

    module.directive('treeView', ['$q', '$timeout', 'treeViewDefaults', function ($q, $timeout, treeViewDefaults) {
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

                /**
                 * searches a tree and marks all folders / items as invisible, only leaving nodes with search
                 *
                 * @param newValue
                 * @param oldValue
                 * @param searchTree
                 */
                var markSearchedNodesInvisible = function (newValue, oldValue, searchTree) {
                    if (typeof newValue === 'undefined') {
                        return;
                    }

                    var show = false;

                    var i, ii;
                    if (searchTree.hasOwnProperty('folders')) {
                        for (i = searchTree.folders.length - 1; searchTree.folders && i >= 0; i--) {
                            show = markSearchedNodesInvisible(newValue, oldValue, searchTree.folders[i]) || show;
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

                    return show;
                };

                $scope.$watch('tosearchTreeFilter', function(newValue, oldValue) {
                    markSearchedNodesInvisible(newValue, oldValue, $scope.treeView);
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
                    node.expanded = !node.expanded;
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

                    if (node_type == 'item' && typeof options.onItemDropComplete === "function") {
                        options.onItemDropComplete(dragged_item.path, target_path);
                    }

                    if (node_type == 'folder' && typeof options.onFolderDropComplete === "function") {
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
    }]);

    module.directive('treeViewNode', ['$q', '$compile', 'dropDownMenuWatcher', function ($q, $compile, dropDownMenuWatcher) {
        return {
            restrict: 'A',
            require: '^treeView',
            link: function (scope, element, attrs, controller) {

                var options = controller.getOptions(),
                    foldersProperty = options.foldersProperty,
                    itemsProperty = options.itemsProperty,
                    displayProperty = options.displayProperty,
                    idProperty = options.idProperty,
                    collapsible = options.collapsible;

                scope.blockMove = options.blockMove;

                /**
                 * registeres callback for contextMenu open
                 *
                 * @type {Function}
                 */
                scope.contextMenuOnShow = function(div_id) {
                    if ( typeof options.contextMenuOnShow === 'function' ) {
                        return options.contextMenuOnShow(div_id);
                    }
                };

                /**
                 * registeres callback for contextMenu close
                 *
                 * @type {Function}
                 */
                scope.contextMenuOnClose =  function(div_id) {
                    if ( typeof options.contextMenuOnClose === 'function' ) {
                        return options.contextMenuOnClose(div_id);
                    }
                };

                /**
                 * returns the icon class of folders
                 *
                 * @type {Function}
                 */
                scope.getFolderIconClass = typeof options.folderIcon === 'function'
                    ? options.folderIcon
                    : function (node) {
                        return 'fa fa-folder' + (node.expanded ? '-open' : '');
                    };

                /**
                 * returns the edit icon class of folders
                 *
                 * @type {Function}
                 */
                scope.getFolderEditIconClass = typeof options.folderEditIcon === 'function'
                    ? options.folderEditIcon
                    : function (node) {

                        return 'fa fa-cogs';
                    };

                /**
                 * returns the icon class of items
                 *
                 * @type {Function}
                 */
                scope.getItemIconClass = typeof options.item_icon === 'function'
                    ? options.item_icon
                    : function (item) {
                        return 'fa fa-item';
                    };

                /**
                 * Configuration for new_entry and new_folder
                 *
                 * @type {{new_entry: {name: string, icon: string}}}
                 */
                scope.textConfig = typeof options.textConfig !== 'undefined'
                    ? options.textConfig
                    : {
                        'new_entry': {name: 'New Entry', icon: 'fa fa-key'}
                    };

                /**
                 * returns a list of additional buttons to show, by default none
                 *
                 * @type {Array}
                 */
                scope.getAdditionalButtons = typeof options.getAdditionalButtons !== 'undefined'
                    ? options.getAdditionalButtons
                    : function(){return []};

                /**
                 * checks if the node in the current scope has children
                 *
                 * @returns {boolean}
                 */
                scope.hasChildren = function () {
                    var node = scope.node;
                    return Boolean(node && (node[foldersProperty] && node[foldersProperty].length) || (node[itemsProperty] && node[itemsProperty].length));
                };

                /**
                 * returns a list of the property of the nodes from root to the targeted item. Can be used for
                 * breadcrumbs for example.
                 *
                 * @param property The property that should be put into the list
                 * @param item The item up to which you want to generate the list
                 * @returns {Array.<T>} A list of the nodes property
                 */
                var getPropertyPath = function (property, item) {
                    var path = [];

                    if (typeof item !== 'undefined') {
                        if (typeof property === 'undefined') {
                            path.push(item);
                        } else {
                            path.push(item[property]);
                        }
                    }

                    var nodeScope = scope;
                    while (nodeScope.node) {
                        if (typeof property === 'undefined') {
                            path.push(nodeScope.node);
                        } else {
                            path.push(nodeScope.node[property]);
                        }
                        nodeScope = nodeScope.$parent;
                    }
                    return path.reverse();
                };

                /**
                 * fired if someone clicks "edit node" and triggers the function defined in the properties
                 *
                 * @param node
                 * @param event
                 */
                scope.editNode = function (node, event) {
                    event.preventDefault();

                    if (node.hasOwnProperty('share_rights') && node.share_rights.write == false) {
                        return;
                    }

                    if (typeof options.onEditNode === "function") {
                        options.onEditNode(node, getPropertyPath(idProperty));
                    }
                };


                /**
                 * fired if someone clicks an additional button on an item and triggers the function defined in the properties
                 *
                 * @param item
                 * @param event
                 * @param my_function
                 * @param folder
                 */
                scope.additionalButtonItem = function (item, event, my_function, folder) {
                    event.preventDefault();

                    if (typeof options.onAdditionalButtonItem === "function") {

                        if (folder) {
                            options.onAdditionalButtonItem(scope.node, getPropertyPath(idProperty), my_function);
                        } else {
                            options.onAdditionalButtonItem(item, getPropertyPath(idProperty, item), my_function);
                        }
                    }
                };

                /**
                 * fired if someone clicks "new folder" on a node and triggers the function defined in the properties
                 *
                 * @param node
                 * @param event
                 */
                scope.newFolderNode = function (node, event) {
                    event.preventDefault();

                    if (node.hasOwnProperty('share_rights') && node.share_rights.write == false) {
                        return;
                    }

                    if (typeof options.onNewFolder === "function") {
                        options.onNewFolder(node, getPropertyPath(idProperty));
                    }
                };

                /**
                 * fired if someone clicks "new entry" on a node and triggers the function defined in the properties
                 *
                 * @param node
                 * @param event
                 */
                scope.newEntryNode = function (node, event) {
                    event.preventDefault();

                    if (node.hasOwnProperty('share_rights') && node.share_rights.write == false) {
                        return;
                    }

                    if (typeof options.onNewItem === "function") {
                        options.onNewItem(node, getPropertyPath(idProperty));
                    }
                };

                /**
                 * fired if someone clicks "delete node" and triggers the function defined in the properties
                 *
                 * @param node
                 * @param event
                 */
                scope.deleteNode  = function (node, event) {
                    event.preventDefault();

                    if (typeof options.onDeleteNode === "function") {
                        options.onDeleteNode(node, getPropertyPath(idProperty));
                    }
                };

                /**
                 * fired if someone selects a node
                 *
                 * @param event
                 */
                scope.selectNode = function (event) {
                    event.preventDefault();

                    if (collapsible) {
                        controller.toggleExpanded(scope.node);
                    }

                    controller.selectNode(scope.node, getPropertyPath(), getPropertyPath(idProperty));
                };

                /**
                 * fired if someone clicks a node
                 *
                 * @param event
                 */
                scope.clickNode = function (event) {
                    event.preventDefault();
                    controller.clickNode(scope.node, getPropertyPath(idProperty));
                };

                /**
                 * fired if someone clicks "edit item" and triggers the function defined in the properties
                 *
                 * @param item
                 * @param event
                 */
                scope.editItem = function (item, event) {
                    event.preventDefault();

                    if (typeof options.onEditItem === "function") {
                        options.onEditItem(item, getPropertyPath(idProperty, item));
                    }
                };

                /**
                 * fired if someone clicks "new folder" on an item and triggers the function defined in the properties
                 *
                 * @param item
                 * @param event
                 */
                scope.newFolderItem = function (item, event) {
                    event.preventDefault();

                    if (typeof options.onNewFolder === "function") {
                        options.onNewFolder(scope.node, getPropertyPath(idProperty));
                    }
                };


                /**
                 * fired if someone clicks "new entry" on an item and triggers the function defined in the properties
                 *
                 * @param item
                 * @param event
                 */
                scope.newEntryItem = function (item, event) {
                    event.preventDefault();

                    if (typeof options.onNewItem === "function") {
                        options.onNewItem(scope.node, getPropertyPath(idProperty));
                    }
                };


                /**
                 * fired if someone clicks "delete item" and triggers the function defined in the properties
                 *
                 * @param item
                 * @param event
                 */
                scope.delete_item  = function (item, event) {
                    event.preventDefault();

                    if (typeof options.onDeleteItem === "function") {
                        options.onDeleteItem(item, getPropertyPath(idProperty, item));
                    }
                };
                /**
                 * fired if someone selects an item
                 *
                 * @param item
                 * @param event
                 */
                scope.selectItem = function (item, event) {
                    event.preventDefault();

                    if (!controller.isSelectable(item)) {
                        return;
                    }

                    controller.selectItem(item, getPropertyPath(displayProperty, item));
                };

                /**
                 * fired if someone clicks an item
                 *
                 * @param item
                 * @param event
                 */
                scope.clickItem = function (item, event) {
                    event.preventDefault();
                    if (!controller.isDragInProgress()) {
                        controller.clickItem(item, getPropertyPath(idProperty));
                    }
                };


                /**
                 * checks if the node has been selected
                 *
                 * @param node
                 */
                scope.isSelected = function (node) {
                    return controller.isSelected(node);
                };


                /**
                 * checks if the node is selectable
                 *
                 * @param node
                 */
                scope.isSelectable = function (node) {
                    return controller.isSelectable(node);
                };

                /**
                 * executed once a drag completes before the drop
                 *
                 * @param data
                 * @param evt
                 * @param type
                 */
                scope.onDragComplete = function(data, evt, type) {
                    controller.incCounter();

                    if (data === null) {
                        return;
                    }

                    var idPath = [];
                    if (type === 'item') {
                        idPath = getPropertyPath(idProperty, data);
                    } else {
                        idPath = getPropertyPath(idProperty);
                    }

                    controller.setLastDraggedItem(data, idPath, null);

                };

                /**
                 * executed multiple times when a drag starts and only the first execute holds the true data,
                 * therefore it remembers the data together with a 'I-already-run'-flag. This flag gets reset
                 * by the draggable:end event
                 *
                 * @param data
                 * @param evt
                 * @param type
                 */
                scope.onDragStart = function(data, evt, type) {
                    controller.setDragInProgress();

                    if (controller.isDragStarted()) {
                        // Already started, fires a couple of time and only the first one has true data
                        return;
                    }

                    controller.setDragStarted();

                    var idPath = [];
                    if (type === 'item') {
                        idPath = getPropertyPath(idProperty, data);
                    } else {
                        idPath = getPropertyPath(idProperty);
                    }

                    controller.setLastDraggedItem(data, idPath, type);
                };

                /**
                 * executed multiple times when a drag stops and only the first execute holds the true data
                 *
                 * @param data
                 * @param evt
                 * @param type
                 */
                scope.onDragStop = function(data, evt, type) {
                    controller.setDragFinished();
                };

                /**
                 * executed once a drop completes after the drag on top of another folder / item
                 *
                 * @param data
                 * @param evt
                 */
                scope.onDropComplete = function(data, evt) {
                    var counter = controller.decCounter();
                    if (counter !== 0 || evt.data === null) {
                        return;
                    }

                    var target_path = getPropertyPath(idProperty);
                    if (evt.data.id == target_path[target_path.length - 1]) {
                        return;
                    }

                    controller.cancel_draggable_end_timeouts();

                    controller.onAnyDrop(evt, target_path);
                };

                /**
                 * triggered once a dropdown menu opens or closes
                 *
                 * @param open
                 * @param div_id
                 */
                scope.toggled = function(open, div_id) {
                    if (open) {
                        scope.contextMenuOnShow(div_id);
                    } else {
                        scope.contextMenuOnClose(div_id);
                    }
                };

                function render() {

                    var template =
                        // Handle folders
                        '<div ng-drag="true" ng-drag-data="node" ng-drag-success="onDragComplete($data, $event, \'folder\')" ' +
                        '    ng-drag-start="onDragStart($data, $event, \'folder\')" prevent-move="blockMove()"' +
                        '    ng-drag-stop="onDragStop($data, $event, \'folder\')"' +
                        '    ng-drop="true" ng-drop-success="onDropComplete(node,$event)" ' +
                        '    ng-mousedown="$event.stopPropagation()" ng-show="!node.hidden"' +
                        '    class="tree-folder" ng-repeat="node in ' + attrs.treeViewNode + '.' + foldersProperty + ' track by $index">' +

                        '<div class="tree-folder-title" data-target="menu-{{ node.id }}"' +
                        '   context-menu="contextMenuOnShow(\'menu-\'+node.id)"' +
                        '   context-menu-close="contextMenuOnClose(\'menu-\'+node.id)">' +
                        '<div href="#" class="tree-folder-header"' +
                        '   ng-click="selectNode($event)" ng-class="{ selected: isSelected(node), notSelectable: ! isSelectable(node) }">' +
                        '<span class="fa-stack">' +
                        '<i class="" ng-class="getFolderIconClass(node)"></i>' +
                        '<i ng-if="node.share_id" class="fa fa-circle fa-stack-2x text-danger is-shared"></i>' +
                        '<i ng-if="node.share_id" class="fa fa-group fa-stack-2x is-shared"></i>' +
                        '</span>' +
                        '<span class="tree-folder-name">' +
                        '   <a href="#" ng-click="clickNode($event)">{{ node.' + displayProperty + ' }}</a>' +
                        '</span> ' +
                        '</div>' +
                        '<span class="node-dropdown" uib-dropdown on-toggle="toggled(open, \'drop_node_\' + node.id)"' +
                        '   ng-class="{disabled: node.share_rights.write == false && node.share_rights.grant == false && node.share_rights.delete == false}">' +
                        '<a class="btn btn-default editbutton"' +
                        '   ng-class="{disabled: node.share_rights.write == false && node.share_rights.grant == false && node.share_rights.delete == false}"' +
                        '   href="#" role="button" id="drop_node_{{node.id}}" uib-dropdown-toggle>' +
                        '    <i ng-class="getFolderEditIconClass(node)"></i>' +
                        '</a>' +
                        '<ul class="dropdown-menu dropdown-button-menu" aria-labelledby="drop_node_{{node.id}}">' +
                        '    <li role="menuitem"' +
                        '       ng-click="additionalButtonItem(node, $event, f.onClick, true)"' +
                        '       ng-class="f.ngClass(node)"' +
                        '       ng-repeat="f in getAdditionalButtons(node)">' +
                        '       <a href="#"><i ng-class="f.icon"></i>{{ f.name }}</a>' +
                        '    </li>' +
                        '    <li ng-if="getAdditionalButtons(node) && getAdditionalButtons(node).length > 0" class="divider"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editNode(node, $event)"' +
                        '       ng-class="{hidden: node.share_rights.write == false}">' +
                        '       <a href="#"><i class="fa fa-wrench"></i>Edit</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="newFolderNode(node, $event)"' +
                        '       ng-class="{hidden: node.share_rights.write == false}">' +
                        '       <a href="#"><i class="fa fa-folder"></i>New Folder</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="newEntryNode(node, $event)"' +
                        '       ng-class="{hidden: node.share_rights.write == false}">' +
                        '       <a href="#"><i class="{{ textConfig.new_entry.icon }}"></i>{{ textConfig.new_entry.name }}</a>' +
                        '    </li>' +
                        '    <li class="divider"' +
                        '       ng-class="{hidden: node.share_rights.delete == false || node.share_rights.write == false}"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-class="{hidden: node.share_rights.delete == false}"' +
                        '       ng-click="deleteNode(node, $event)">' +
                        '       <a href="#"><i class="fa fa-trash"></i>Delete</a>' +
                        '    </li>' +
                        '</ul>' +
                        '</span>' +
                        '</div>' +
                        '<div class="tree-folder-content"'+ (collapsible ? ' ng-show="node.expanded"' : '') + '>' +
                        '<div tree-view-node="node">' +
                        '</div>' +
                        '</div>' +

                        '<div class="dropdown position-fixed dropdown-rightclick" id="menu-{{ node.id }}"' +
                        '   ng-hide="node.share_rights.write == false && node.share_rights.grant == false && node.share_rights.delete == false">' +
                        '<ul class="dropdown-menu" role="menu">' +
                        '    <li role="menuitem"' +
                        '       ng-click="additionalButtonItem(node, $event, f.onClick, true)"' +
                        '       ng-class="f.ngClass(node)"' +
                        '       ng-repeat="f in getAdditionalButtons(node)">' +
                        '    <a href="#"><i ng-class="f.icon"></i>{{ f.name }}</a>' +
                        '    </li>' +
                        '    <li ng-if="getAdditionalButtons(node) && getAdditionalButtons(node).length > 0" class="divider"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editNode(node, $event)"' +
                        '       ng-class="{hidden: node.share_rights.write == false}">' +
                        '       <a href="#"><i class="fa fa-wrench"></i>Edit</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="newFolderNode(node, $event)"' +
                        '       ng-class="{hidden: node.share_rights.write == false}">' +
                        '       <a href="#"><i class="fa fa-folder"></i>New Folder</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="newEntryNode(node, $event)"' +
                        '       ng-class="{hidden: node.share_rights.write == false}">' +
                        '       <a href="#"><i class="{{ textConfig.new_entry.icon }}"></i>{{ textConfig.new_entry.name }}</a>' +
                        '    </li>' +
                        '    <li class="divider"' +
                        '       ng-class="{hidden: node.share_rights.delete == false || node.share_rights.write == false}"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-class="{hidden: node.share_rights.delete == false}"' +
                        '       ng-click="deleteNode(node, $event)">' +
                        '       <a href="#"><i class="fa fa-trash"></i>Delete</a>' +
                        '    </li>' +
                        '</ul>' +
                        '</div>'+

                        '</div>' + // end ng-repeat node

                        // Handle items
                        '<div ng-drag="true" ng-drag-data="item" ng-drag-success="onDragComplete($data, $event, \'item\')" ' +
                        '   ng-drag-start="onDragStart($data, $event, \'item\')" prevent-move="blockMove()"' +
                        '   ng-drag-stop="onDragStop($data, $event, \'item\')"' +
                        '   ng-mousedown="$event.stopPropagation()" ng-show="!item.hidden"' +
                        '   class="tree-item" ng-repeat="item in ' + attrs.treeViewNode + '.' + itemsProperty + ' track by $index">' +

                        '<div class="tree-item-object" ng-click="selectItem(item, $event)"' +
                        '   ng-class="{ selected: isSelected(item), notSelectable: ! isSelectable(node) }" data-target="menu-{{ item.id }}"' +
                        '   context-menu="contextMenuOnShow(\'menu-\'+item.id)"' +
                        '   context-menu-close="contextMenuOnClose(\'menu-\'+item.id)">' +
                        '<span class="fa-stack">' +
                        '<i ng-class="getItemIconClass(item)"></i>' +
                        '<i ng-if="item.share_id" class="fa fa-circle fa-stack-2x text-danger is-shared"></i>' +
                        '<i ng-if="item.share_id" class="fa fa-group fa-stack-2x is-shared"></i>' +
                        '</span>' +
                        '<span class="tree-item-name">' +
                        '   <a href="#" ng-click="clickItem(item, $event)">{{ item.' + displayProperty + ' }}</a>' +
                        '</span>' +
                        '<span class="node-dropdown" uib-dropdown on-toggle="toggled(open, \'drop_item_\' + item.id)">' +
                        '<a class="btn btn-default editbutton" href="#" role="button" id="drop_item_{{item.id}}" uib-dropdown-toggle>' +
                        '    <i ng-class="getFolderEditIconClass(item)"></i>' +
                        '</a>' +
                        '<ul class="dropdown-menu dropdown-button-menu" aria-labelledby="drop_item_{{item.id}}">' +
                        '    <li role="menuitem"' +
                        '       ng-click="additionalButtonItem(item, $event, f.onClick, false)"' +
                        '       ng-class="f.ngClass(item)"' +
                        '       ng-repeat="f in getAdditionalButtons(item)">' +
                        '       <a href="#"><i ng-class="f.icon"></i>{{ f.name }}</a>' +
                        '    </li>' +
                        '    <li ng-if="getAdditionalButtons(item) && getAdditionalButtons(item).length > 0" class="divider"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editItem(item, $event)"' +
                        '       ng-class="{hidden: item.share_rights.write == false || item.share_rights.read == false}">' +
                        '       <a href="#"><i class="fa fa-wrench"></i>Show / Edit</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editItem(item, $event)"' +
                        '       ng-class="{hidden: item.share_rights.write == true || item.share_rights.read == false}">' +
                        '       <a href="#"><i class="fa fa-eye"></i>Show</a>' +
                        '    </li>' +
                        '    <li class="divider"' +
                        '       ng-class="{hidden: item.share_rights.delete == false || item.share_rights.read == false}"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-class="{hidden: item.share_rights.delete == false}"' +
                        '       ng-click="delete_item(item, $event)">' +
                        '       <a href="#"><i class="fa fa-trash"></i>Delete</a>' +
                        '    </li>' +
                        '</ul>' +
                        '</span>' +
                        '</div>' +

                        '<div class="dropdown position-fixed dropdown-rightclick" id="menu-{{ item.id }}">' +
                        '<ul class="dropdown-menu" role="menu">' +
                        '    <li role="menuitem"' +
                        '       ng-click="additionalButtonItem(item, $event, f.onClick, false)"' +
                        '       ng-class="f.ngClass(item)"' +
                        '       ng-repeat="f in getAdditionalButtons(item)">' +
                        '       <a href="#"><i ng-class="f.icon"></i>{{ f.name }}</a>' +
                        '    </li>' +
                        '    <li ng-if="getAdditionalButtons(item) && getAdditionalButtons(item).length > 0" class="divider"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editItem(item, $event)"' +
                        '       ng-class="{hidden: item.share_rights.write == false || item.share_rights.read == false}">' +
                        '       <a href="#"><i class="fa fa-wrench"></i>Show / Edit</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editItem(item, $event)"' +
                        '       ng-class="{hidden: item.share_rights.write == true || item.share_rights.read == false}">' +
                        '       <a href="#"><i class="fa fa-eye"></i>Show</a>' +
                        '    </li>' +
                        '    <li class="divider"' +
                        '       ng-class="{hidden: item.share_rights.delete == false || item.share_rights.read == false}"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-class="{hidden: item.share_rights.delete == false}"' +
                        '       ng-click="delete_item(item, $event)">' +
                        '       <a href="#"><i class="fa fa-trash"></i>Delete</a>' +
                        '    </li>' +
                        '</ul>' +
                        '</div>'+

                        '</div>'; // end ng-repeat item

                    //Rendering template.
                    element.html('').append($compile(template)(scope));
                }

                render();
            }
        };
    }]);
})(angular);