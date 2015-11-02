/*
 *  https://github.com/axel-zarate/angular-tree-view/
 *
 *  The MIT License (MIT)
 *
 *  Copyright (c) 2014 axel-zarate
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
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
        filesProperty: 'files',
        displayProperty: 'name',
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
                    selectedFile;

                var options = angular.extend({}, treeViewDefaults, $scope.treeViewOptions);

                self.selectNode = function (node, breadcrumbs) {
                    if (selectedFile) {
                        selectedFile = undefined;
                    }
                    selectedNode = node;

                    if (typeof options.onNodeSelect === "function") {
                        options.onNodeSelect(node, breadcrumbs);
                    }
                };

                self.selectFile = function (file, breadcrumbs) {
                    if (selectedNode) {
                        selectedNode = undefined;
                    }
                    selectedFile = file;

                    if (typeof options.onNodeSelect === "function") {
                        options.onNodeSelect(file, breadcrumbs);
                    }
                };

                self.isSelected = function (node) {
                    return node === selectedNode || node === selectedFile;
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
                    filesProperty = options.filesProperty,
                    displayProperty = options.displayProperty,
                    collapsible = options.collapsible;
                //var isEditing = false;

                //scope.expanded = collapsible == false;
                //scope.newNodeName = '';
                //scope.addErrorMessage = '';
                //scope.editName = '';
                //scope.editErrorMessage = '';

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

                scope.getFileIconClass = typeof options.fileIcon === 'function'
                    ? options.fileIcon
                    : function (file) {
                    return 'fa fa-file';
                };

                scope.hasChildren = function () {
                    var node = scope.node;
                    return Boolean(node && (node[foldersProperty] && node[foldersProperty].length) || (node[filesProperty] && node[filesProperty].length));
                };

                scope.selectNode = function (event) {
                    event.preventDefault();
                    //if (isEditing) return;

                    if (collapsible) {
                        toggleExpanded(scope.node);
                    }

                    var breadcrumbs = [];
                    var nodeScope = scope;
                    while (nodeScope.node) {
                        breadcrumbs.push(nodeScope.node[displayProperty]);
                        nodeScope = nodeScope.$parent;
                    }
                    controller.selectNode(scope.node, breadcrumbs.reverse());
                };

                scope.editNode = function (node) {
                    // TODO edit node and maybe rename
                    if (typeof options.onEditNode === "function") {
                        options.onEditNode(node);
                    }
                };
                scope.deleteNode  = function (node) {
                    // TODO delete node
                    if (typeof options.onDeleteNode === "function") {
                        options.onDeleteNode(node);
                    }
                };

                scope.editFile = function (file) {
                    // TODO edit file and maybe rename
                    if (typeof options.onEditFile === "function") {
                        options.onEditFile(file);
                    }
                };
                scope.deleteFile  = function (file) {
                    // TODO delete file
                    if (typeof options.onDeleteFile === "function") {
                        options.onDeleteFile(file);
                    }
                };

                scope.selectFile = function (file, event) {
                    event.preventDefault();
                    //if (isEditing) return;

                    var breadcrumbs = [file[displayProperty]];
                    var nodeScope = scope;
                    while (nodeScope.node) {
                        breadcrumbs.push(nodeScope.node[displayProperty]);
                        nodeScope = nodeScope.$parent;
                    }
                    controller.selectFile(file, breadcrumbs.reverse());
                };

                scope.isSelected = function (node) {
                    return controller.isSelected(node);
                };

                /*
                 scope.addNode = function () {
                 var addEvent = {
                 commit: function (error) {
                 if (error) {
                 scope.addErrorMessage = error;
                 }
                 else {
                 scope.newNodeName = '';
                 scope.addErrorMessage = '';
                 }
                 }
                 };

                 controller.addNode(addEvent, scope.newNodeName, scope.node);
                 };

                 scope.isEditing = function () {
                 return isEditing;
                 };

                 scope.canRemove = function () {
                 return !(scope.hasChildren());
                 };

                 scope.remove = function (event, index) {
                 event.stopPropagation();
                 controller.removeNode(scope.node, index, scope.$parent.node);
                 };

                 scope.edit = function (event) {
                 isEditing = true;
                 controller.editingScope = scope;
                 //expanded = false;
                 scope.editName = scope.node[displayProperty];
                 event.stopPropagation();
                 };

                 scope.canEdit = function () {
                 return !controller.editingScope || scope == controller.editingScope;
                 };

                 scope.canAdd = function () {
                 return !isEditing && scope.canEdit();
                 };

                 scope.rename = function (event) {
                 event.stopPropagation();

                 var renameEvent = {
                 commit: function (error) {
                 if (error) {
                 scope.editErrorMessage = error;
                 }
                 else {
                 scope.cancelEdit();
                 }
                 }
                 };

                 controller.renameNode(renameEvent, scope.node, scope.editName);
                 };

                 scope.cancelEdit = function (event) {
                 if (event) {
                 event.stopPropagation();
                 }

                 isEditing = false;
                 scope.editName = '';
                 scope.editErrorMessage = '';
                 controller.editingScope = undefined;
                 };
                 */

                function toggleExpanded(node) {
                    //if (!scope.hasChildren()) return;
                    node.expanded = !node.expanded;
                }

                function render() {
                    var template =
                        '<div class="tree-folder" ng-repeat="node in ' + attrs.treeViewNode + '.' + foldersProperty + '">' +
                        '<div class="tree-folder-title">' +
                        '<a href="#" class="tree-folder-header" ng-click="selectNode($event)" ng-class="{ selected: isSelected(node) }">' +
                        '<i class="" ng-class="getFolderIconClass(node)"></i> ' +
                        '<span class="tree-folder-name">{{ node.' + displayProperty + ' }}</span> ' +
                        '</a>' +
                        '<span class="node-dropdown" dropdown>' +
                        '<a class="btn btn-default editbutton" href="#" role="button" id="drop_node_{{$index}}" dropdown-toggle>' +
                        '    <i ng-class="getFolderEditIconClass(node)"></i>' +
                        '</a>' +
                        '<ul class="dropdown-menu" aria-labelledby="drop_node_{{$index}}">' +
                        '    <li role="menuitem" ng-click="editNode(node)"><a href="#"><i class="fa fa-wrench"></i>Edit</a></li>' +
                        '    <li class="divider"></li>' +
                        '    <li role="menuitem" ng-click="deleteNode(node)"><a href="#"><i class="fa fa-trash"></i>Delete</a></li>' +
                        '</ul>' +
                        '</span>' +
                        '</div>' +
                        '<div class="tree-folder-content"'+ (collapsible ? ' ng-show="node.expanded"' : '') + '>' +
                        '<div tree-view-node="node">' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '<div class="tree-item" ng-repeat="file in ' + attrs.treeViewNode + '.' + filesProperty + '">' +
                        '<div class="tree-item-object" ng-click="selectFile(file, $event)" ng-class="{ selected: isSelected(file) }">' +
                        '<span class="tree-item-name"><i ng-class="getFileIconClass(file)"></i> {{ file.' + displayProperty + ' }}</span>' +
                        '<span class="node-dropdown" dropdown>' +
                        '<a class="btn btn-default editbutton" href="#" role="button" id="drop_node_{{$index}}" dropdown-toggle>' +
                        '    <i ng-class="getFolderEditIconClass(file)"></i>' +
                        '</a>' +
                        '<ul class="dropdown-menu" aria-labelledby="drop_file_{{$index}}">' +
                        '    <li role="menuitem" ng-click="editFile(file)"><a href="#"><i class="fa fa-wrench"></i>Edit</a></li>' +
                        '    <li class="divider"></li>' +
                        '    <li role="menuitem" ng-click="deleteFile(file)"><a href="#"><i class="fa fa-trash"></i>Delete</a></li>' +
                        '</ul>' +
                        '</span>' +
                        '</div>' +
                        '</div>';

                    //Rendering template.
                    element.html('').append($compile(template)(scope));
                }

                render();
            }
        };
    }]);
})(angular);