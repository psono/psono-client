(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name ngTree.dropDownMenuWatcher
     *
     * @description
     * Service for the drop down menu in the tree structure
     */
    var dropDownMenuWatcher = function() {

        var opened_dropdown_menu = '';

        var on_open = function(dropdown_menu_id) {
            if (opened_dropdown_menu !== '') {
                angular.element('#' + opened_dropdown_menu).parent().removeClass('open');
            }
            opened_dropdown_menu = dropdown_menu_id;
        };

        var on_close = function(dropdown_menu_id) {
            if (opened_dropdown_menu === dropdown_menu_id){
                opened_dropdown_menu = '';
            }
        };

        return {
            on_open: on_open,
            on_close: on_close
        };
    };

    var app = angular.module('ngTree');
    app.factory("dropDownMenuWatcher", [dropDownMenuWatcher]);
}(angular));
