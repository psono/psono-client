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
 */

(function (angular, undefined) {
    var module = angular.module('AxelSoft', []);

    module.value('treeViewDefaults', {
        foldersProperty: 'folders',
        itemsProperty: 'items',
        displayProperty: 'name',
        idProperty: 'id',
        collapsible: true
    });

    module.directive('treeView', ['$q', 'treeViewDefaults', function ($q, treeViewDefaults) {
        return {
            restrict: 'A',
            scope: {
                treeView: '=treeView',
                treeViewOptions: '=treeViewOptions'
            },
            replace: true,
            template:
            '<div class="tree">' +
            '<div tree-view-node="treeView">' +
            '</div>' +
            '</div>',
            controller: ['$scope', function ($scope) {
                var self = this,
                    selectedNode,
                    selectedItem;

                var options = angular.extend({}, treeViewDefaults, $scope.treeViewOptions);

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

                scope.getFolderIconClass = typeof options.folderIcon === 'function'
                    ? options.folderIcon
                    : function (node) {
                    return 'fa fa-folder' + (node.expanded ? '-open' : '');
                };

                scope.getFolderEditIconClass = typeof options.folderEditIcon === 'function'
                    ? options.folderEditIcon
                    : function (node) {

                    return 'fa fa-cogs';
                };

                scope.getItemIconClass = typeof options.itemIcon === 'function'
                    ? options.itemIcon
                    : function (item) {
                    return 'fa fa-item';
                };

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
                 * expends or collapses the node
                 *
                 * @param node
                 */
                function toggleExpanded(node) {
                    node.expanded = !node.expanded;
                }

                function render() {
                    var template =
                        '<div class="tree-folder" ng-repeat="node in ' + attrs.treeViewNode + '.' + foldersProperty + ' track by $index">' +

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
                        '    <li role="menuitem" ng-click="editNode(node, $event)"><a href="#"><i class="fa fa-wrench"></i>Edit</a></li>' +
                        '    <li role="menuitem" ng-click="newFolderNode(node, $event)"><a href="#"><i class="fa fa-folder"></i>New Folder</a></li>' +
                        '    <li role="menuitem" ng-click="newEntryNode(node, $event)"><a href="#"><i class="fa fa-key"></i>New Entry</a></li>' +
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
                        '    <li role="menuitem" ng-click="editNode(node, $event)"><a href="#"><i class="fa fa-wrench"></i>Edit</a></li>' +
                        '    <li role="menuitem" ng-click="newFolderNode(node, $event)"><a href="#"><i class="fa fa-folder"></i>New Folder</a></li>' +
                        '    <li role="menuitem" ng-click="newEntryNode(node, $event)"><a href="#"><i class="fa fa-key"></i>New Entry</a></li>' +
                        '    <li class="divider"></li>' +
                        '    <li role="menuitem" ng-click="deleteNode(node, $event)"><a href="#"><i class="fa fa-trash"></i>Delete</a></li>' +
                        '</ul>' +
                        '</div>'+

                        '</div>' + // end ng-repeat node

                        '<div class="tree-item" ng-repeat="item in ' + attrs.treeViewNode + '.' + itemsProperty + ' track by $index">' +

                        '<div class="tree-item-object" ng-click="selectItem(item, $event)" ng-class="{ selected: isSelected(item) }" data-target="menu-{{ item.id }}" context-menu="">' +
                        '<i ng-class="getItemIconClass(item)"></i><span class="tree-item-name"><a href="#" ng-click="clickItem(item, $event)">{{ item.' + displayProperty + ' }}</a></span>' +
                        '<span class="node-dropdown" dropdown>' +
                        '<a class="btn btn-default editbutton" href="#" role="button" id="drop_item_{{item.id}}" dropdown-toggle>' +
                        '    <i ng-class="getFolderEditIconClass(item)"></i>' +
                        '</a>' +
                        '<ul class="dropdown-menu dropdown-button-menu" aria-labelledby="drop_item_{{item.id}}">' +
                        '    <li role="menuitem" ng-click="editItem(item, $event)"><a href="#"><i class="fa fa-wrench"></i>Edit</a></li>' +
                        '    <li role="menuitem" ng-click="newFolderItem(item, $event)"><a href="#"><i class="fa fa-folder"></i>New Folder</a></li>' +
                        '    <li role="menuitem" ng-click="newEntryItem(item, $event)"><a href="#"><i class="fa fa-key"></i>New Entry</a></li>' +
                        '    <li class="divider"></li>' +
                        '    <li role="menuitem" ng-click="deleteItem(item, $event)"><a href="#"><i class="fa fa-trash"></i>Delete</a></li>' +
                        '</ul>' +
                        '</span>' +
                        '</div>' +

                        '<div class="dropdown position-fixed droppdown-rightclick" id="menu-{{ item.id }}">' +
                        '<ul class="dropdown-menu" role="menu">' +
                        '    <li role="menuitem" ng-click="editItem(item, $event)"><a href="#"><i class="fa fa-wrench"></i>Edit</a></li>' +
                        '    <li role="menuitem" ng-click="newFolderItem(item, $event)"><a href="#"><i class="fa fa-folder"></i>New Folder</a></li>' +
                        '    <li role="menuitem" ng-click="newEntryItem(item, $event)"><a href="#"><i class="fa fa-key"></i>New Entry</a></li>' +
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