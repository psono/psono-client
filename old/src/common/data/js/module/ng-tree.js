(function (angular) {
    var module = angular.module('ngTree', []);

    module.value('treeViewDefaults', {
        foldersProperty: 'folders',
        itemsProperty: 'items',
        displayProperty: 'name',
        idProperty: 'id',
        collapsible: true
    });

}(angular));