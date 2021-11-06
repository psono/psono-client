(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:LanguagePickerCtrl
     * @requires $scope
     * @requires $q
     * @requires psonocli.languagePicker
     *
     * @description
     * Controller for all language pickers.html
     */
    angular.module('psonocli').controller('LanguagePickerCtrl', ['$scope', '$q', 'languagePicker',
        function ($scope, $q, languagePicker) {

            $scope.languages = languagePicker.get_language_array();
            $scope.active = {
                'lang': languagePicker.get_active_language()
            };
            $scope.change_language = change_language;

            activate();

            function activate(){
                // pass
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LanguagePickerCtrl#change_language
             * @methodOf psonocli.controller:LanguagePickerCtrl
             *
             * @description
             * Changes the language
             *
             * @param {string} lang The language to use
             */
            function change_language(lang) {
                $scope.active['lang'] = lang;
                languagePicker.changeLanguage(lang.code)
            }
        }]);

}(angular));