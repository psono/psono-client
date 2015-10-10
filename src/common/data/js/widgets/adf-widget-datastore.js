'use strict';

angular.module('adf.widget.datastore', ['adf.provider'])
    .config(function(dashboardProvider){
        dashboardProvider
            .widget('datastore', {
                title: 'Datastore',
                description: 'provides the datastore',
                templateUrl: '{widgetsPath}/datastore/src/view.html',
                edit: {
                    templateUrl: '{widgetsPath}/datastore/src/edit.html'
                }
            });
    });

angular.module("adf.widget.datastore").run(["$templateCache", function($templateCache) {$templateCache.put("{widgetsPath}/datastore/src/edit.html","<form role=\"form\">\n  <div class=\"form-group\">\n    <label for=\"sample\">Sample</label>\n    <input type=\"text\" class=\"form-control\" id=\"sample\" ng-model=\"config.sample\" placeholder=\"Enter sample\">\n  </div>\n</form>\n");
    $templateCache.put("{widgetsPath}/datastore/src/view.html","<div>\n  <h1>Widget view</h1>\n  <p>Content of {{config.sample}}</p>\n</div>\n");}]);