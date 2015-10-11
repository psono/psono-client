'use strict';

angular.module('adf.widget.datastore', ['adf.provider'])
    .config(function(dashboardProvider){
        dashboardProvider
            .widget('datastore', {
                title: 'Datastore',
                description: 'provides the datastore',
                templateUrl: '{widgetsPath}.datastore.view.html',
                controller: 'datastoreController',
                controllerAs: 'datastore',
                edit: {
                    templateUrl: '{widgetsPath}.datastore.edit.html'
                }
            });
    })
    .controller('datastoreController', ["$scope", "$interval", "config", function($scope, $interval, config){

        /* For tree View */
        $scope.structure = { folders: [
            { name: 'Folder 1', files: [{ name: 'File 1.jpg' }, { name: 'File 2.png' }, { name: 'File 2.7zip' }], folders: [
                { name: 'Subfolder 1', files: [{ name: 'Subfile 1' }] },
                { name: 'Subfolder 2' },
                { name: 'Subfolder 3' }
            ]},
            { name: 'Folder 2', share: "12345" }
        ]};

        $scope.options = {
            onNodeSelect: function (node, breadcrums) {
                $scope.breadcrums = breadcrums;
                $scope.node = node;
            },
            mapIcon: function (file) {

                var iconClassMap = {
                        txt: 'fa fa-file-text-o',
                        log: 'fa fa-file-text-o',
                        jpg: 'fa fa-file-image-o blue',
                        jpeg: 'fa fa-file-image-o blue',
                        png: 'fa fa-file-image-o orange',
                        gif: 'fa fa-file-image-o',
                        pdf: 'fa fa-file-pdf-o',
                        wav: 'fa fa-file-audio-o',
                        mp3: 'fa fa-file-audio-o',
                        wma: 'fa fa-file-audio-o',
                        avi: 'fa fa-file-video-o',
                        mov: 'fa fa-file-video-o',
                        mkv: 'fa fa-file-video-o',
                        flv: 'fa fa-file-video-o',
                        mp4: 'fa fa-file-video-o',
                        mpg: 'fa fa-file-video-o',
                        doc: 'fa fa-file-word-o',
                        dot: 'fa fa-file-word-o',
                        docx: 'fa fa-file-word-o',
                        docm: 'fa fa-file-word-o',
                        dotx: 'fa fa-file-word-o',
                        dotm: 'fa fa-file-word-o',
                        docb: 'fa fa-file-word-o',
                        xls: 'fa fa-file-excel-o',
                        xlt: 'fa fa-file-excel-o',
                        xlm: 'fa fa-file-excel-o',
                        xla: 'fa fa-file-excel-o',
                        xll: 'fa fa-file-excel-o',
                        xlw: 'fa fa-file-excel-o',
                        xlsx: 'fa fa-file-excel-o',
                        xlsm: 'fa fa-file-excel-o',
                        xlsb: 'fa fa-file-excel-o',
                        xltx: 'fa fa-file-excel-o',
                        xltm: 'fa fa-file-excel-o',
                        xlam: 'fa fa-file-excel-o',
                        csv: 'fa fa-file-excel-o',
                        ppt: 'fa fa-file-powerpoint-o',
                        pptx: 'fa fa-file-powerpoint-o',
                        zip: 'fa fa-file-archive-o',
                        tar: 'fa fa-file-archive-o',
                        gz: 'fa fa-file-archive-o',
                        '7zip': 'fa fa-file-archive-o'
                    },
                    defaultIconClass = 'fa fa-file-o';

                var pattern = /\.(\w+)$/,
                    match = pattern.exec(file.name),
                    ext = match && match[1];

                return iconClassMap[ext] || defaultIconClass;
            }
        };

    }]);

/*
angular.module("adf.widget.datastore").run(["$templateCache", function ($templateCache) {
    $templateCache.put("{widgetsPath}.datastore.edit.html", "<form role=\"form\">\n  <div class=\"form-group\">\n    <label for=\"sample\">Sample</label>\n    <input type=\"text\" class=\"form-control\" id=\"sample\" ng-model=\"config.sample\" placeholder=\"Enter sample\">\n  </div>\n</form>\n");
    $templateCache.put("{widgetsPath}.datastore.view.html", "<div>\n  <a ng-href='#here' ng-click='count = count + 1' >click me {{count}}</a><h1>Widget view</h1>\n  <p>Content of {{config.sample}}</p>\n<div tree-view=\"structure\" tree-view-options=\"options\"></div></div>\n");
}]);
*/

