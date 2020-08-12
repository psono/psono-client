(function(angular) {
    'use strict';

    /**
     * @ngdoc directive
     * @name ngTree.directive:treeViewNode
     * @requires $rootScope
     * @requires $q
     * @requires $compile
     * @requires $timeout
     * @requires $uibModal
     * @requires psonocli.offlineCache
     * @restrict A
     *
     * @description
     * Directive for the node in a tree structure
     */
    var treeViewNode = function($rootScope, $q, $compile, $timeout, $uibModal, offlineCache) {
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

                $timeout(function(){
                    scope.treeView = scope.treeView;
                }, 5000);

                scope.attrs = attrs;
                scope.element = element;


                scope.offline = offlineCache.is_active();
                $rootScope.$on('offline_mode_enabled', function() {
                    scope.offline = true;
                });

                $rootScope.$on('offline_mode_disabled', function() {
                    scope.offline = false;
                });


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
                        return 'fa fa-folder' + (node.is_expanded ? '-open' : '');
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
                        'new_entry': {name: 'NEW_ENTRY', icon: 'fa fa-plus'}
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
                 * @param orig_path The path as array of IDs to the target
                 * @returns {Array.<T>} A list of the nodes property
                 */
                var getPropertyPath = function (orig_path){

                    var path = orig_path.slice();

                    var getPropertyPathRecursive = function(path, datastore, current_property_path) {

                        var to_search = path[0];
                        var n, l;
                        var rest = path.slice(1);

                        if (datastore.hasOwnProperty('folders')) {
                            for (n = 0, l= datastore.folders.length; n < l; n++) {
                                if (datastore.folders[n].id === to_search) {
                                    current_property_path.push(datastore.folders[n]);
                                    return getPropertyPathRecursive(rest, datastore.folders[n], current_property_path);
                                }
                            }
                        }
                        if (datastore.hasOwnProperty('items')) {
                            for (n = 0, l= datastore.items.length; n < l; n++) {
                                if (datastore.items[n].id === to_search) {
                                    current_property_path.push(datastore.items[n]);
                                    return getPropertyPathRecursive(rest, datastore.items[n], current_property_path);
                                }
                            }
                        }

                        return current_property_path;
                    };

                    return getPropertyPathRecursive(path, scope.treeView.data, [])
                };

                /**
                 * fired if someone clicks "edit node" and triggers the function defined in the properties
                 *
                 * @param node
                 * @param event
                 */
                scope.editNode = function (node, event) {

                    if (node.hasOwnProperty('share_rights') && node.share_rights.write === false) {
                        return;
                    }

                    if (typeof options.onEditNode === "function") {
                        options.onEditNode(node, node.path);
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

                    if (typeof options.onAdditionalButtonItem === "function") {
                        if (folder) {
                            options.onAdditionalButtonItem(item, item.path, my_function);
                        } else {
                            options.onAdditionalButtonItem(item, item.path, my_function);
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
                    if (node.hasOwnProperty('share_rights') && node.share_rights.write === false) {
                        return;
                    }

                    if (typeof options.onNewFolder === "function") {
                        options.onNewFolder(node, node.path);
                    }
                };

                /**
                 * fired if someone clicks "new entry" on a node and triggers the function defined in the properties
                 *
                 * @param node
                 * @param event
                 */
                scope.newEntryNode = function (node, event) {

                    if (node.hasOwnProperty('share_rights') && node.share_rights.write === false) {
                        return;
                    }

                    if (typeof options.onNewItem === "function") {
                        options.onNewItem(node, node.path);
                    }
                };

                /**
                 * fired if someone clicks "delete node" and triggers the function defined in the properties
                 *
                 * @param node
                 * @param event
                 */
                scope.deleteNode  = function (node, event) {

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/verify.html',
                        controller: 'ModalVerifyCtrl',
                        resolve: {
                            title: function () {
                                return 'DELETE_FOLDER';
                            },
                            description: function () {
                                return 'DELETE_FOLDER_WARNING';
                            },
                            entries: function () {
                                return [node.name];
                            },
                            affected_entries_text: function () {
                                return 'AFFECTED_FOLDERS';
                            }
                        }
                    });

                    modalInstance.result.then(function () {
                        // User clicked the yes button
                        if (typeof options.onDeleteNode === "function") {
                            options.onDeleteNode(node, node.path);
                        }

                    }, function () {
                        // cancel triggered
                    });
                };

                /**
                 * fired if someone clicks "move node" and triggers the function defined in the properties
                 *
                 * @param node
                 * @param event
                 */
                scope.moveNode  = function (node, event) {
                    var node_path = node.path.slice();
                    if (typeof options.onMoveItem === "function") {
                        options.onMoveNode(node_path);
                    }
                };

                /**
                 * fired if someone selects a node
                 *
                 * @param event
                 * @param node
                 */
                scope.selectNode = function (event, node) {

                    if (collapsible) {
                        controller.toggleExpanded(node);
                    }
                    controller.selectNode(node, getPropertyPath(node.path), node.path);
                };

                /**
                 * fired if someone clicks "edit item" and triggers the function defined in the properties
                 *
                 * @param item
                 * @param event
                 */
                scope.editItem = function (item, event) {
                    if (typeof options.onEditItem === "function") {
                        options.onEditItem(item, item.path);
                    }
                };

                /**
                 * fired if someone clicks "new folder" on an item and triggers the function defined in the properties
                 *
                 * @param item
                 * @param event
                 */
                scope.newFolderItem = function (item, event) {

                    if (typeof options.onNewFolder === "function") {
                        options.onNewFolder(item, item.path);
                    }
                };


                /**
                 * fired if someone clicks "new entry" on an item and triggers the function defined in the properties
                 *
                 * @param item
                 * @param event
                 */
                scope.newEntryItem = function (item, event) {

                    if (typeof options.onNewItem === "function") {
                        options.onNewItem(item, item.path);
                    }
                };


                /**
                 * fired if someone clicks "delete item" and triggers the function defined in the properties
                 *
                 * @param item
                 * @param event
                 */
                scope.deleteItem  = function (item, event) {

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/verify.html',
                        controller: 'ModalVerifyCtrl',
                        resolve: {
                            title: function () {
                                return 'DELETE_ENTRY';
                            },
                            description: function () {
                                return 'DELETE_ENTRY_WARNING';
                            },
                            entries: function () {
                                return [item.name];
                            },
                            affected_entries_text: function () {
                                return 'AFFECTED_ENTRIES';
                            }
                        }
                    });

                    modalInstance.result.then(function () {
                        // User clicked the yes button
                        if (typeof options.onDeleteItem === "function") {
                            options.onDeleteItem(item, item.path);
                        }

                    }, function () {
                        // cancel triggered
                    });
                };


                /**
                 * fired if someone clicks "move item" and triggers the function defined in the properties
                 *
                 * @param item
                 * @param event
                 */
                scope.moveItem  = function (item, event) {
                    var item_path = item.path;
                    if (typeof options.onMoveItem === "function") {
                        options.onMoveItem(item_path);
                    }
                };

                /**
                 * fired if someone clicks an item
                 *
                 * @param item
                 * @param event
                 */
                scope.clickItem = function (item, event) {
                    controller.clickItem(item, item.path);
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
                        '<div>' +
                        '<div ' +
                        '    ng-mousedown="$event.stopPropagation()" ng-if="!node.hidden && !node.deleted"' +
                        '    class="tree-folder" ng-repeat="node in ' + attrs.treeViewNode + '.data.' + foldersProperty + ' | orderBy:\'' + displayProperty + '\' track by $index">' +

                        '<div class="tree-folder-title" data-target="menu-{{ ::node.id }}"' +
                        '   context-menu="contextMenuOnShow(\'menu-\'+node.id)"' +
                        '   context-menu-close="contextMenuOnClose(\'menu-\'+node.id)">' +
                        '<div href="#" class="tree-folder-header"' +
                        '   ng-click="$event.stopPropagation(); selectNode($event, node)" ng-class="::{ selected: isSelected(node), notSelectable: ! isSelectable(node) }">' +
                        '<span class="fa-stack">' +
                        '<i class="" ng-class="getFolderIconClass(node)"></i>' +
                        '<i ng-if="node.share_id" class="fa fa-circle fa-stack-2x text-danger is-shared"></i>' +
                        '<i ng-if="node.share_id" class="fa fa-group fa-stack-2x is-shared"></i>' +
                        '</span>' +
                        '<span class="tree-folder-name">{{ node.' + displayProperty + ' }}</a></span> ' +
                        '</div>' +
                        '<span class="node-dropdown" uib-dropdown on-toggle="toggled(open, \'drop_node_\' + node.id)"' +
                        '   ng-class="::{disabled: node.share_rights.write === false && node.share_rights.grant === false && node.share_rights.delete === false}">' +
                        '<a class="btn btn-default editbutton"  ng-click="$event.stopPropagation()" ng-if="!offline"' +
                        '   ng-class="::{disabled: node.share_rights.write === false && node.share_rights.grant === false && node.share_rights.delete === false}"' +
                        '   href="#" role="button" id="drop_node_{{ ::node.id }}" uib-dropdown-toggle>' +
                        '    <i class="fa fa-cogs"></i>' +
                        '</a>' +
                        '<ul class="dropdown-menu dropdown-button-menu" aria-labelledby="drop_node_{{ ::node.id }}" ng-click="$event.preventDefault(); $event.stopPropagation();">' +
                        '    <li role="menuitem"' +
                        '       ng-if="!f.hide_offline || !offline"' +
                        '       ng-click="additionalButtonItem(node, $event, f.onClick, true)"' +
                        '       ng-class="::f.ngClass(node)"' +
                        '       ng-repeat="f in ::getAdditionalButtons(node)">' +
                        '       <a href="#"><i ng-class="::f.icon"></i>{{ ::f.name | translate }}</a>' +
                        '    </li>' +
                        '    <li ng-if="getAdditionalButtons(node) && getAdditionalButtons(node).length > 0 && !offline" class="divider"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editNode(node, $event)"' +
                        '       ng-class="::{hidden: node.share_rights.write === false}">' +
                        '       <a href="#"><i class="fa fa-wrench"></i>{{::\'EDIT\' | translate}}</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="newFolderNode(node, $event)"' +
                        '       ng-class="::{hidden: node.share_rights.write === false}">' +
                        '       <a href="#"><i class="fa fa-folder"></i>{{::\'NEW_FOLDER\' | translate}}</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="newEntryNode(node, $event)"' +
                        '       ng-class="::{hidden: node.share_rights.write === false}">' +
                        '       <a href="#"><i class="{{ ::textConfig.new_entry.icon }}"></i>{{ ::textConfig.new_entry.name | translate }}</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-class="::{hidden: node.share_rights.delete === false}"' +
                        '       ng-click="moveNode(node, $event)">' +
                        '       <a href="#"><i class="fa fa-arrows"></i>{{::\'MOVE\' | translate}}</a>' +
                        '    </li>' +
                        '    <li class="divider"' +
                        '       ng-class="::{hidden: node.share_rights.delete === false || node.share_rights.write === false}"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-class="::{hidden: node.share_rights.delete === false}"' +
                        '       ng-click="deleteNode(node, $event)">' +
                        '       <a href="#" alt="{{\'DELETE\' | translate}}"><i class="fa fa-trash"></i>{{::\'DELETE\' | translate}}</a>' +
                        '    </li>' +
                        '</ul>' +
                        '</span>' +
                        '</div>' +
                        '<div class="tree-folder-content"'+ (collapsible ? ' ng-if="node.is_expanded"' : '') + ' >' +
                        '<div tree-view-node="{\'data\': node}">' +
                        '</div>' +
                        '</div>' +

                        '<div class="dropdown position-fixed dropdown-rightclick" id="menu-{{ ::node.id }}"' +
                        '   ng-hide="(node.share_rights.write === false && node.share_rights.grant === false && node.share_rights.delete === false) || offline">' +
                        '<ul class="dropdown-menu" role="menu" ng-click="$event.preventDefault();">' +
                        '    <li role="menuitem"' +
                        '       ng-if="!f.hide_offline || !offline"' +
                        '       ng-click="additionalButtonItem(node, $event, f.onClick, true)"' +
                        '       ng-class="::f.ngClass(node)"' +
                        '       ng-repeat="f in ::getAdditionalButtons(node)">' +
                        '    <a href="#"><i ng-class="::f.icon"></i>{{ ::f.name | translate }}</a>' +
                        '    </li>' +
                        '    <li ng-if="getAdditionalButtons(node) && getAdditionalButtons(node).length > 0 && !offline" class="divider"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editNode(node, $event)"' +
                        '       ng-class="::{hidden: node.share_rights.write === false}">' +
                        '       <a href="#"><i class="fa fa-wrench"></i>{{ ::\'EDIT\' | translate }}</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="newFolderNode(node, $event)"' +
                        '       ng-class="::{hidden: node.share_rights.write === false}">' +
                        '       <a href="#"><i class="fa fa-folder"></i>{{ ::\'NEW_FOLDER\' | translate }}</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="newEntryNode(node, $event)"' +
                        '       ng-class="::{hidden: node.share_rights.write === false}">' +
                        '       <a href="#"><i class="{{ ::textConfig.new_entry.icon }}"></i>{{ ::textConfig.new_entry.name | translate }}</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-class="::{hidden: node.share_rights.delete === false}"' +
                        '       ng-click="moveNode(node, $event)">' +
                        '       <a href="#"><i class="fa fa-arrows"></i>{{ ::\'MOVE\' | translate }}</a>' +
                        '    </li>' +
                        '    <li class="divider"' +
                        '       ng-class="::{hidden: node.share_rights.delete === false || node.share_rights.write === false}"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-class="::{hidden: node.share_rights.delete === false}"' +
                        '       ng-click="deleteNode(node, $event)">' +
                        '       <a href="#" alt="{{\'DELETE\' | translate}}"><i class="fa fa-trash"></i>{{ ::\'DELETE\' | translate }}</a>' +
                        '    </li>' +
                        '</ul>' +
                        '</div>'+

                        '</div>' + // end ng-repeat node

                        // Handle items
                        '<div ' +
                        '   ng-mousedown="$event.stopPropagation()" ng-if="!item.hidden && !item.deleted"' +
                        '   class="tree-item" ng-repeat="item in ' + attrs.treeViewNode + '.data.' + itemsProperty + ' | orderBy:\'' + displayProperty + '\' track by $index">' +

                        '<div ng-click="$event.stopPropagation(); editItem(item, $event)" class="tree-item-object" ' +
                        '   ng-class="::{ selected: isSelected(item), notSelectable: ! isSelectable(item) }" data-target="menu-{{ ::item.id }}"' +
                        '   context-menu="contextMenuOnShow(\'menu-\'+item.id)"' +
                        '   context-menu-close="contextMenuOnClose(\'menu-\'+item.id)">' +
                        '<span class="fa-stack">' +
                        '<i ng-class="::getItemIconClass(item)"></i>' +
                        '<i ng-if="item.share_id" class="fa fa-circle fa-stack-2x text-danger is-shared"></i>' +
                        '<i ng-if="item.share_id" class="fa fa-group fa-stack-2x is-shared"></i>' +
                        '</span>' +
                        '<span class="tree-item-name">{{ item.' + displayProperty + ' }}</span>' +
                        '<span class="node-open-link" ng-if="item.type === \'website_password\' || item.type === \'bookmark\'">' +
                        '<a href="#" class="btn btn-default" ng-click="$event.preventDefault(); $event.stopPropagation(); clickItem(item, $event)">' +
                        '    <i class="fa fa-external-link"></i>' +
                        '</a>' +
                        '</span>' +
                        '<span class="node-open-link" ng-if="item.type === \'file\' && !offline">' +
                        '<a href="#" class="btn btn-default" ng-click="$event.preventDefault(); $event.stopPropagation(); clickItem(item, $event)">' +
                        '    <i class="fa fa-download"></i>' +
                        '</a>' +
                        '</span>' +
                        '<span class="node-dropdown" uib-dropdown on-toggle="toggled(open, \'drop_item_\' + item.id)">' +
                        '<a ng-if="!offline || item.type !== \'file\'"' +
                        '   class="btn btn-default editbutton" href="#" role="button" id="drop_item_{{ ::item.id }}" uib-dropdown-toggle  ng-click="$event.stopPropagation()">' +
                        '    <i class="fa fa-cogs"></i>' +
                        '</a>' +
                        '<ul class="dropdown-menu dropdown-button-menu" aria-labelledby="drop_item_{{ ::item.id }}" ng-click="$event.preventDefault(); $event.stopPropagation();">' +
                        '    <li role="menuitem"' +
                        '       ng-if="!f.hide_offline || !offline"' +
                        '       ng-click="additionalButtonItem(item, $event, f.onClick, false)"' +
                        '       ng-class="::f.ngClass(item)"' +
                        '       ng-repeat="f in ::getAdditionalButtons(item)">' +
                        '       <a href="#"><i ng-class="::f.icon"></i>{{ ::f.name | translate }}</a>' +
                        '    </li>' +
                        '    <li ng-if="getAdditionalButtons(item) && getAdditionalButtons(item).length > 0 && !offline" class="divider"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editItem(item, $event)"' +
                        '       ng-class="::{hidden: item.share_rights.write === false || item.share_rights.read === false}">' +
                        '       <a href="#"><i class="fa fa-wrench"></i>{{ ::\'SHOW_OR_EDIT\' | translate }}</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editItem(item, $event)"' +
                        '       ng-class="::{hidden: item.share_rights.write === true || item.share_rights.read === false || item.type === \'user\'}">' +
                        '       <a href="#"><i class="fa fa-eye"></i>{{ ::\'SHOW\' | translate }}</a>' +
                        '    </li>' +
                        '    <li role="menuitem" ng-if="!offline"' +
                        '       ng-class="::{hidden: item.share_rights.delete === false}"' +
                        '       ng-click="moveItem(item, $event)">' +
                        '       <a href="#"><i class="fa fa-arrows"></i>{{ ::\'MOVE\' | translate }}</a>' +
                        '    <li class="divider" ng-if="!offline"' +
                        '       ng-class="::{hidden: item.share_rights.delete === false || item.share_rights.read === false}"></li>' +
                        '    <li role="menuitem" ng-if="!offline"' +
                        '       ng-class="::{hidden: item.share_rights.delete === false}"' +
                        '       ng-click="deleteItem(item, $event)">' +
                        '       <a href="#" alt="{{\'DELETE\' | translate}}"><i class="fa fa-trash"></i>{{ ::\'DELETE\' | translate }}</a>' +
                        '    </li>' +
                        '</ul>' +
                        '</span>' +
                        '</div>' +

                        '<div class="dropdown position-fixed dropdown-rightclick" id="menu-{{ ::item.id }}">' +
                        '<ul class="dropdown-menu" role="menu" ng-click="$event.preventDefault(); ">' +
                        '    <li role="menuitem"' +
                        '       ng-if="!f.hide_offline || !offline"' +
                        '       ng-click="additionalButtonItem(item, $event, f.onClick, false)"' +
                        '       ng-class="::f.ngClass(item)"' +
                        '       ng-repeat="f in ::getAdditionalButtons(item)">' +
                        '       <a href="#"><i ng-class="::f.icon"></i>{{ ::f.name | translate }}</a>' +
                        '    </li>' +
                        '    <li ng-if="getAdditionalButtons(item) && getAdditionalButtons(item).length > 0 && !offline" class="divider"></li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editItem(item, $event)"' +
                        '       ng-class="::{hidden: item.share_rights.write === false || item.share_rights.read === false}">' +
                        '       <a href="#"><i class="fa fa-wrench"></i>{{::\'SHOW_OR_EDIT\' | translate}}</a>' +
                        '    </li>' +
                        '    <li role="menuitem"' +
                        '       ng-click="editItem(item, $event)"' +
                        '       ng-class="::{hidden: item.share_rights.write === true || item.share_rights.read === false || item.type === \'user\'}">' +
                        '       <a href="#"><i class="fa fa-eye"></i>{{::\'SHOW\' | translate}}</a>' +
                        '    </li>' +
                        '    <li role="menuitem" ng-if="!offline"' +
                        '       ng-class="::{hidden: item.share_rights.delete === false}"' +
                        '       ng-click="moveItem(item, $event)">' +
                        '       <a href="#"><i class="fa fa-arrows"></i>{{::\'MOVE\' | translate}}</a>' +
                        '    <li class="divider"' +
                        '       ng-class="::{hidden: item.share_rights.delete === false || item.share_rights.read === false}"></li>' +
                        '    <li role="menuitem" ng-if="!offline"' +
                        '       ng-class="::{hidden: item.share_rights.delete === false}"' +
                        '       ng-click="deleteItem(item, $event)">' +
                        '       <a href="#" alt="{{\'DELETE\' | translate}}"><i class="fa fa-trash"></i>{{::\'DELETE\' | translate}}</a>' +
                        '    </li>' +
                        '</ul>' +
                        '</div>'+

                        '</div>' + // end ng-repeat item
                        '</div>'; // end top div

                    //Rendering template.
                    element.html('').append($compile(template)(scope));
                }

                render();
            }
        };
    };

    var app = angular.module('ngTree');
    app.directive('treeViewNode', ['$rootScope', '$q', '$compile', '$timeout', '$uibModal', 'offlineCache', treeViewNode]);

}(angular));