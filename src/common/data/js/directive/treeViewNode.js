(function(angular) {
    'use strict';

    /**
     * @ngdoc directive
     * @name ngTree.directive:treeViewNode
     * @restrict A
     *
     * @description
     * Directive for the node in a tree structure
     */
    var treeViewNode = function($q, $compile, dropDownMenuWatcher) {
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

                    if (node.hasOwnProperty('share_rights') && node.share_rights.write === false) {
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

                    if (node.hasOwnProperty('share_rights') && node.share_rights.write === false) {
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

                    if (node.hasOwnProperty('share_rights') && node.share_rights.write === false) {
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

                    if (controller.isDragStarted()) {
                        // Already started, fires a couple of time and only the first one has true data
                        return;
                    }
                    controller.setDragInProgress();

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
                    if (evt.data.id === target_path[target_path.length - 1]) {
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
                        '   ng-class="{disabled: node.share_rights.write === false && node.share_rights.grant === false && node.share_rights.delete === false}">' +
                        '<a class="btn btn-default editbutton"' +
                        '   ng-class="{disabled: node.share_rights.write === false && node.share_rights.grant === false && node.share_rights.delete === false}"' +
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
                        '       ng-class="{hidden: node.share_rights.write === false}">' +
                        '       <a href="#"><i class="fa fa-wrench"></i>Edit</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="newFolderNode(node, $event)"' +
                        '       ng-class="{hidden: node.share_rights.write === false}">' +
                        '       <a href="#"><i class="fa fa-folder"></i>New Folder</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="newEntryNode(node, $event)"' +
                        '       ng-class="{hidden: node.share_rights.write === false}">' +
                        '       <a href="#"><i class="{{ textConfig.new_entry.icon }}"></i>{{ textConfig.new_entry.name }}</a>' +
                        '    </li>' +
                        '    <li class="divider"' +
                        '       ng-class="{hidden: node.share_rights.delete === false || node.share_rights.write === false}"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-class="{hidden: node.share_rights.delete === false}"' +
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
                        '   ng-hide="node.share_rights.write === false && node.share_rights.grant === false && node.share_rights.delete === false">' +
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
                        '       ng-class="{hidden: node.share_rights.write === false}">' +
                        '       <a href="#"><i class="fa fa-wrench"></i>Edit</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="newFolderNode(node, $event)"' +
                        '       ng-class="{hidden: node.share_rights.write === false}">' +
                        '       <a href="#"><i class="fa fa-folder"></i>New Folder</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="newEntryNode(node, $event)"' +
                        '       ng-class="{hidden: node.share_rights.write === false}">' +
                        '       <a href="#"><i class="{{ textConfig.new_entry.icon }}"></i>{{ textConfig.new_entry.name }}</a>' +
                        '    </li>' +
                        '    <li class="divider"' +
                        '       ng-class="{hidden: node.share_rights.delete === false || node.share_rights.write === false}"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-class="{hidden: node.share_rights.delete === false}"' +
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
                        '       ng-class="{hidden: item.share_rights.write === false || item.share_rights.read === false}">' +
                        '       <a href="#"><i class="fa fa-wrench"></i>Show / Edit</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editItem(item, $event)"' +
                        '       ng-class="{hidden: item.share_rights.write === true || item.share_rights.read === false}">' +
                        '       <a href="#"><i class="fa fa-eye"></i>Show</a>' +
                        '    </li>' +
                        '    <li class="divider"' +
                        '       ng-class="{hidden: item.share_rights.delete === false || item.share_rights.read === false}"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-class="{hidden: item.share_rights.delete === false}"' +
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
                        '       ng-class="{hidden: item.share_rights.write === false || item.share_rights.read === false}">' +
                        '       <a href="#"><i class="fa fa-wrench"></i>Show / Edit</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editItem(item, $event)"' +
                        '       ng-class="{hidden: item.share_rights.write === true || item.share_rights.read === false}">' +
                        '       <a href="#"><i class="fa fa-eye"></i>Show</a>' +
                        '    </li>' +
                        '    <li class="divider"' +
                        '       ng-class="{hidden: item.share_rights.delete === false || item.share_rights.read === false}"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-class="{hidden: item.share_rights.delete === false}"' +
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
    };

    var app = angular.module('ngTree');
    app.directive('treeViewNode', ['$q', '$compile', 'dropDownMenuWatcher', treeViewNode]);

}(angular));