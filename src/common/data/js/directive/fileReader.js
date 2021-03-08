(function(angular) {
    'use strict';

    /**
     * @ngdoc directive
     * @name psonocli.directive:fileReader
     * @restrict EA
     *
     * @description
     * Directive to handle the file upload
     */
    var fileReader = function() {
        // Gratitude to Marian Ban
        // https://stackoverflow.com/questions/26353676/how-to-read-csv-file-content-in-angular-js
        return {
            scope: {
                fileReader:"="
            },
            link: function(scope, element, attrs) {
                $(element).on('change', function(changeEvent) {
                    var files = changeEvent.target.files;
                    if (files.length) {
                        var r = new FileReader();
                        r.onload = function(e) {
                            var contents = e.target.result;
                            scope.$apply(function () {
                                scope.fileReader = contents;
                            });
                        };
                        r.readAsText(files[0], attrs.fileEncoding);
                    }
                });
            }
        };
    };

    var app = angular.module('psonocli');
    app.directive('fileReader', [fileReader]);

}(angular));
