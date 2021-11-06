(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.languagePicker
     * @requires $translate
     *
     * @description
     * Service that manages all translations
     */

    var languagePicker = function($translate, languages) {
        /**
         * @ngdoc
         * @name psonocli.languagePicker#get_languages
         * @methodOf psonocli.languagePicker
         *
         * @description
         * Returns a the language lookup dict
         *
         */
        var get_languages = function() {
            return languages.value
        };
        /**
         * @ngdoc
         * @name psonocli.languagePicker#get_language_array
         * @methodOf psonocli.languagePicker
         *
         * @description
         * Returns a list of languages
         *
         */
        var get_language_array = function() {

            var langs = get_languages();
            var lang_array = [];
            for (var lang in langs) {
                if ( ! langs.hasOwnProperty(lang)) {
                    continue;
                }
                lang_array.push(langs[lang]);
            }
            return lang_array
        };

        /**
         * @ngdoc
         * @name psonocli.languagePicker#get_active_language_code
         * @methodOf psonocli.languagePicker
         *
         * @description
         * Returns the active current language code
         *
         * @returns {string} Current Language Code
         */
        var get_active_language_code = function() {
            return $translate.use() || $translate.proposedLanguage();
        };

        /**
         * @ngdoc
         * @name psonocli.languagePicker#get_active_language
         * @methodOf psonocli.languagePicker
         *
         * @description
         * Returns the active current language
         *
         * @returns {string} Current Language
         */
        var get_active_language = function() {
            var code = get_active_language_code();
            var languages = get_languages();
            return languages[code];
        };

        /**
         * @ngdoc
         * @name psonocli.languagePicker#changeLanguage
         * @methodOf psonocli.languagePicker
         *
         * @description
         * Changes the language
         *
         * @param {string} langKey The key of the language to change to
         */
        var changeLanguage = function (langKey) {
            $translate.use(langKey);
        };

        return {
            get_active_language_code: get_active_language_code,
            get_active_language: get_active_language,
            get_languages: get_languages,
            get_language_array: get_language_array,
            changeLanguage: changeLanguage
        };
    };

    var app = angular.module('psonocli');
    app.factory("languagePicker", ['$translate', 'languages', languagePicker]);

}(angular));