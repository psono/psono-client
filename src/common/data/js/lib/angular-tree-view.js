/*
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

    module.directive('treeView', ['$q', '$timeout', 'treeViewDefaults', function ($q, $timeout, treeViewDefaults) {
        return {
            restrict: 'A',
            scope: {
                treeView: '=treeView',
                treeViewOptions: '=treeViewOptions'
            },
            replace: true,
            template:
            '<div class="tree-container">' +
            '<form name="searchTreeForm" class=" widget-searchform">' +
            '<div class="row">' +
            '<div class="col-xs-offset-4 col-xs-8 col-sm-offset-6 col-sm-6 col-md-offset-8 col-md-4">' +
            '<div class="input-group">' +
            '<input type="text" class="form-control" id="tosearchTreeForm" placeholder="search" ng-model="tosearchTreeFilter">' +
            '<span class="input-group-btn">' +
            '<button class="btn btn-default" ng-disabled="!tosearchTreeFilter" ng-click="clearSearchTreeForm()" type="button"><i class="fa fa-ban"></i></button>' +
            '</span>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</form>' +
            '<div class="tree">' +
            '<div tree-view-node="treeView">' +
            '</div>' +
            '</div>' +
            '</div>',
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {
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
                    for (i = 0; searchTree.folders && i < searchTree.folders.length; i++) {
                        show = markSearchedNodesInvisible(newValue, oldValue, searchTree.folders[i]) || show;
                    }

                    newValue = newValue.toLowerCase();
                    var searchStrings = newValue.split(" ");

                    // Test title of the items
                    var containCounter = 0;
                    for (i = 0; searchTree.items && i < searchTree.items.length; i++) {
                        containCounter = 0;
                        for (ii = 0; ii < searchStrings.length; ii++) {
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
                    // Test title of the folder
                    if (typeof searchTree.name !== 'undefined') {
                        containCounter = 0;
                        for (ii = 0; ii < searchStrings.length; ii++) {
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
                 */
                self.selectNode = function (node, breadcrumbs) {
                    if (selectedItem) {
                        selectedItem = undefined;
                    }
                    selectedNode = node;

                    if (typeof options.onNodeSelect === "function") {
                        options.onNodeSelect(node, breadcrumbs);
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
                    if (typeof options.onItemSelect === "function") {
                        options.onItemClick(item);
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

                // some helpers for the timer

                var timer = null;

                /**
                 * cancels the timer
                 */
                self.cancelTimer = function() {
                    $timeout.cancel(timer);
                };

                // some helpers to remember the drag state

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

                $rootScope.$on('draggable:end', function(evt, args) {

                    self.resetDragStarted();

                    timer = $timeout(function() {
                        // maybe someone wanted to drag an element to the top of the tree?
                        // noone yet executed a onAnyDrop, so lets do it
                        self.onAnyDrop(evt, null);
                    }, 200);

                });

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

    module.directive('treeViewNode', ['$q', '$compile', function ($q, $compile) {
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
                scope.getItemIconClass = typeof options.itemIcon === 'function'
                    ? options.itemIcon
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
                scope.additionalButtons = typeof options.additionalButtons !== 'undefined'
                    ? options.additionalButtons
                    : [];

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
                        path.push(item[property]);
                    }

                    var nodeScope = scope;
                    while (nodeScope.node) {
                        path.push(nodeScope.node[property]);
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
                        toggleExpanded(scope.node);
                    }

                    controller.selectNode(scope.node, getPropertyPath(displayProperty));
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
                scope.deleteItem  = function (item, event) {
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

                    controller.clickItem(item, getPropertyPath(idProperty));
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
                 * executed once a drop completes after the drag
                 *
                 * @param data
                 * @param evt
                 */
                scope.onDropComplete = function(data, evt) {

                    controller.cancelTimer();

                    var counter = controller.decCounter();
                    if (counter !== 0 || evt.data === null) {
                        return;
                    }

                    var target_path = getPropertyPath(idProperty);
                    if (evt.data.id == target_path[target_path.length - 1]) {
                        return;
                    }

                    controller.onAnyDrop(evt, target_path);
                };


                /**
                 * expends or collapses the node
                 *
                 * @param node
                 */
                function toggleExpanded(node) {
                    node.expanded = !node.expanded;
                }

                function render() {

                    // console.log(attrs.treeViewNode);
                    //  {{ tosearchTreeFilter }}

                    var template =
                        // Handle folders
                        '<div ng-drag="true" ng-drag-data="node" ng-drag-success="onDragComplete($data, $event, \'folder\')" ' +
                        'ng-drag-start="onDragStart($data, $event, \'folder\')"' +
                        'ng-drop="true" ng-drop-success="onDropComplete(node,$event)" ' +
                        'ng-mousedown="$event.stopPropagation()" ng-show="!node.hidden"' +
                        'class="tree-folder" ng-repeat="node in ' + attrs.treeViewNode + '.' + foldersProperty + ' track by $index">' +

                        '<div class="tree-folder-title" data-target="menu-{{ node.id }}" context-menu="">' +
                        '<div href="#" class="tree-folder-header" ng-click="selectNode($event)" ng-class="{ selected: isSelected(node) }">' +
                        '<i class="" ng-class="getFolderIconClass(node)"></i>' +
                        '<span class="tree-folder-name"><a href="#" ng-click="clickNode($event)">{{ node.' + displayProperty + ' }}</a></span> ' +
                        '</div>' +
                        '<span class="node-dropdown" dropdown>' +
                        '<a class="btn btn-default editbutton" href="#" role="button" id="drop_node_{{node.id}}" dropdown-toggle>' +
                        '    <i ng-class="getFolderEditIconClass(node)"></i>' +
                        '</a>' +
                        '<ul class="dropdown-menu dropdown-button-menu" aria-labelledby="drop_node_{{node.id}}">' +
                        '    <li role="menuitem" ng-click="additionalButtonItem(node, $event, f.onClick, true)" ng-repeat="f in additionalButtons"><a href="#"><i ng-class="f.icon"></i>{{ f.name }}</a></li>' +
                        '    <li ng-if="additionalButtons && additionalButtons.length" class="divider"></li>' +
                        '    <li role="menuitem" ng-click="editNode(node, $event)"><a href="#"><i class="fa fa-wrench"></i>Edit</a></li>' +
                        '    <li role="menuitem" ng-click="newFolderNode(node, $event)"><a href="#"><i class="fa fa-folder"></i>New Folder</a></li>' +
                        '    <li role="menuitem" ng-click="newEntryNode(node, $event)"><a href="#"><i class="{{ textConfig.new_entry.icon }}"></i>{{ textConfig.new_entry.name }}</a></li>' +
                        '    <li class="divider"></li>' +
                        '    <li role="menuitem" ng-click="deleteNode(node, $event)"><a href="#"><i class="fa fa-trash"></i>Delete</a></li>' +
                        '</ul>' +
                        '</span>' +
                        '</div>' +
                        '<div class="tree-folder-content"'+ (collapsible ? ' ng-show="node.expanded"' : '') + '>' +
                        '<div tree-view-node="node">' +
                        '</div>' +
                        '</div>' +

                        '<div class="dropdown position-fixed droppdown-rightclick" id="menu-{{ node.id }}">' +
                        '<ul class="dropdown-menu" role="menu">' +
                        '    <li role="menuitem" ng-click="additionalButtonItem(node, $event, f.onClick, true)" ng-repeat="f in additionalButtons"><a href="#"><i ng-class="f.icon"></i>{{ f.name }}</a></li>' +
                        '    <li ng-if="additionalButtons && additionalButtons.length" class="divider"></li>' +
                        '    <li role="menuitem" ng-click="editNode(node, $event)"><a href="#"><i class="fa fa-wrench"></i>Edit</a></li>' +
                        '    <li role="menuitem" ng-click="newFolderNode(node, $event)"><a href="#"><i class="fa fa-folder"></i>New Folder</a></li>' +
                        '    <li role="menuitem" ng-click="newEntryNode(node, $event)"><a href="#"><i class="{{ textConfig.new_entry.icon }}"></i>{{ textConfig.new_entry.name }}</a></li>' +
                        '    <li class="divider"></li>' +
                        '    <li role="menuitem" ng-click="deleteNode(node, $event)"><a href="#"><i class="fa fa-trash"></i>Delete</a></li>' +
                        '</ul>' +
                        '</div>'+

                        '</div>' + // end ng-repeat node

                        // Handle items
                        '<div ng-drag="true" ng-drag-data="item" ng-drag-success="onDragComplete($data, $event, \'item\')" ' +
                        'ng-drag-start="onDragStart($data, $event, \'item\')"' +
                        'ng-mousedown="$event.stopPropagation()" ng-show="!item.hidden"' +
                        ' class="tree-item" ng-repeat="item in ' + attrs.treeViewNode + '.' + itemsProperty + ' track by $index">' +

                        '<div class="tree-item-object" ng-click="selectItem(item, $event)" ng-class="{ selected: isSelected(item) }" data-target="menu-{{ item.id }}" context-menu="">' +
                        '<i ng-class="getItemIconClass(item)"></i><span class="tree-item-name"><a href="#" ng-click="clickItem(item, $event)">{{ item.' + displayProperty + ' }}</a></span>' +
                        '<span class="node-dropdown" dropdown>' +
                        '<a class="btn btn-default editbutton" href="#" role="button" id="drop_item_{{item.id}}" dropdown-toggle>' +
                        '    <i ng-class="getFolderEditIconClass(item)"></i>' +
                        '</a>' +
                        '<ul class="dropdown-menu dropdown-button-menu" aria-labelledby="drop_item_{{item.id}}">' +
                        '    <li role="menuitem" ng-click="additionalButtonItem(item, $event, f.onClick, false)" ng-repeat="f in additionalButtons"><a href="#"><i ng-class="f.icon"></i>{{ f.name }}</a></li>' +
                        '    <li ng-if="additionalButtons && additionalButtons.length" class="divider"></li>' +
                        '    <li role="menuitem" ng-click="editItem(item, $event)"><a href="#"><i class="fa fa-wrench"></i>Edit</a></li>' +
                        '    <li role="menuitem" ng-click="newFolderItem(item, $event)"><a href="#"><i class="fa fa-folder"></i>New Folder</a></li>' +
                        '    <li role="menuitem" ng-click="newEntryItem(item, $event)"><a href="#"><i class="{{ textConfig.new_entry.icon }}"></i>{{ textConfig.new_entry.name }}</a></li>' +
                        '    <li class="divider"></li>' +
                        '    <li role="menuitem" ng-click="deleteItem(item, $event)"><a href="#"><i class="fa fa-trash"></i>Delete</a></li>' +
                        '</ul>' +
                        '</span>' +
                        '</div>' +

                        '<div class="dropdown position-fixed droppdown-rightclick" id="menu-{{ item.id }}">' +
                        '<ul class="dropdown-menu" role="menu">' +
                        '    <li role="menuitem" ng-click="additionalButtonItem(item, $event, f.onClick, false)" ng-repeat="f in additionalButtons"><a href="#"><i ng-class="f.icon"></i>{{ f.name }}</a></li>' +
                        '    <li ng-if="additionalButtons && additionalButtons.length" class="divider"></li>' +
                        '    <li role="menuitem" ng-click="editItem(item, $event)"><a href="#"><i class="fa fa-wrench"></i>Edit</a></li>' +
                        '    <li role="menuitem" ng-click="newFolderItem(item, $event)"><a href="#"><i class="fa fa-folder"></i>New Folder</a></li>' +
                        '    <li role="menuitem" ng-click="newEntryItem(item, $event)"><a href="#"><i class="{{ textConfig.new_entry.icon }}"></i>{{ textConfig.new_entry.name }}</a></li>' +
                        '    <li class="divider"></li>' +
                        '    <li role="menuitem" ng-click="deleteItem(item, $event)"><a href="#"><i class="fa fa-trash"></i>Delete</a></li>' +
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