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

                self.selectNode = function (node, breadcrumbs) {
                    if (selectedItem) {
                        selectedItem = undefined;
                    }
                    selectedNode = node;

                    if (typeof options.onNodeSelect === "function") {
                        options.onNodeSelect(node, breadcrumbs);
                    }
                };

                self.selectItem = function (item, breadcrumbs) {
                    if (selectedNode) {
                        selectedNode = undefined;
                    }
                    selectedItem = item;

                    if (typeof options.onNodeSelect === "function") {
                        options.onNodeSelect(item, breadcrumbs);
                    }
                };

                self.isSelected = function (node) {
                    return node === selectedNode || node === selectedItem;
                };

                /*
                self.addNode = function (event, name, parent) {
                    if (typeof options.onAddNode === "function") {
                        options.onAddNode(event, name, parent);
                    }
                };
                self.removeNode = function (node, index, parent) {
                    if (typeof options.onRemoveNode === "function") {
                        options.onRemoveNode(node, index, parent);
                    }
                };

                self.renameNode = function (event, node, name) {
                    if (typeof options.onRenameNode === "function") {
                        return options.onRenameNode(event, node, name);
                    }
                    return true;
                };
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

                scope.hasChildren = function () {
                    var node = scope.node;
                    return Boolean(node && (node[foldersProperty] && node[foldersProperty].length) || (node[itemsProperty] && node[itemsProperty].length));
                };


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

                scope.editNode = function (node, event) {
                    event.preventDefault();

                    if (typeof options.onEditNode === "function") {
                        options.onEditNode(node, getPropertyPath(idProperty));
                    }
                };

                scope.newFolderNode = function (node, event) {
                    event.preventDefault();

                    if (typeof options.onNewFolder === "function") {
                        options.onNewFolder(node, getPropertyPath(idProperty));
                    }
                };

                scope.newEntryNode = function (node, event) {
                    event.preventDefault();

                    if (typeof options.onNewItem === "function") {
                        options.onNewItem(node, getPropertyPath(idProperty));
                    }
                };

                scope.deleteNode  = function (node, event) {
                    event.preventDefault();

                    if (typeof options.onDeleteNode === "function") {
                        options.onDeleteNode(node, getPropertyPath(idProperty));
                    }
                };

                scope.selectNode = function (event) {
                    event.preventDefault();

                    if (collapsible) {
                        toggleExpanded(scope.node);
                    }

                    controller.selectNode(scope.node, getPropertyPath(displayProperty));
                };



                scope.editItem = function (item, event) {
                    event.preventDefault();

                    if (typeof options.onEditItem === "function") {
                        options.onEditItem(item, getPropertyPath(idProperty, item));
                    }
                };

                scope.newFolderItem = function (item, event) {
                    event.preventDefault();

                    if (typeof options.onNewFolder === "function") {
                        options.onNewFolder(scope.node, getPropertyPath(idProperty));
                    }
                };

                scope.newEntryItem = function (item, event) {
                    event.preventDefault();

                    if (typeof options.onNewItem === "function") {
                        options.onNewItem(scope.node, getPropertyPath(idProperty));
                    }
                };

                scope.deleteItem  = function (item, event) {
                    event.preventDefault();

                    if (typeof options.onDeleteItem === "function") {
                        options.onDeleteItem(item, getPropertyPath(idProperty, item));
                    }
                };

                scope.selectItem = function (item, event) {
                    event.preventDefault();

                    controller.selectItem(item, getPropertyPath(displayProperty, item));
                };



                scope.isSelected = function (node) {
                    return controller.isSelected(node);
                };

                function toggleExpanded(node) {
                    //if (!scope.hasChildren()) return;
                    node.expanded = !node.expanded;
                }

                function render() {
                    var template =
                        '<div class="tree-folder" ng-repeat="node in ' + attrs.treeViewNode + '.' + foldersProperty + '">' +

                        '<div class="tree-folder-title" data-target="menu-{{ node.id }}" context-menu="">' +
                        '<a href="#" class="tree-folder-header" ng-click="selectNode($event)" ng-class="{ selected: isSelected(node) }">' +
                        '<i class="" ng-class="getFolderIconClass(node)"></i> ' +
                        '<span class="tree-folder-name">{{ node.' + displayProperty + ' }}</span> ' +
                        '</a>' +
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

                        '<div class="tree-item" ng-repeat="item in ' + attrs.treeViewNode + '.' + itemsProperty + '">' +

                        '<div class="tree-item-object" ng-click="selectItem(item, $event)" ng-class="{ selected: isSelected(item) }" data-target="menu-{{ item.id }}" context-menu="">' +
                        '<span class="tree-item-name"><i ng-class="getItemIconClass(item)"></i> {{ item.' + displayProperty + ' }}</span>' +
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