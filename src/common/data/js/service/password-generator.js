(function(angular, generatePassword) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.passwordGenerator
     * @requires psonocli.settings
     *
     * @description
     * Service to generate passwords with a specific complexity
     */

    var passwordGenerator = function(settings) {

        var memorable = false;

        var uppercaseMinCount = 1;
        var lowercaseMinCount = 1;
        var numberMinCount = 1;
        var specialMinCount = 1;

        /**
         * checks if the given password complies with the minimal complexity
         *
         * @param password
         * @returns {*}
         */
        var is_strong_enough = function (password) {

            if (uppercaseMinCount + lowercaseMinCount + numberMinCount + specialMinCount > settings.get_setting('setting_password_length')) {
                //password can never comply, so we skip check
                return true;
            }

            var uc = password.match(new RegExp("(["+escape_reg_exp(settings.get_setting('setting_password_letters_uppercase'))+"])", "g"));
            var lc = password.match(new RegExp("(["+escape_reg_exp(settings.get_setting('setting_password_letters_lowercase'))+"])", "g"));
            var n = password.match(new RegExp("(["+escape_reg_exp(settings.get_setting('setting_password_numbers'))+"])", "g"));
            var sc = password.match(new RegExp("(["+escape_reg_exp(settings.get_setting('setting_password_special_chars'))+"])", "g"));

            return uc && (settings.get_setting('setting_password_letters_uppercase').length == 0 || uc.length >= uppercaseMinCount) &&
                lc && (settings.get_setting('setting_password_letters_lowercase').length == 0 || lc.length >= lowercaseMinCount) &&
                n && (settings.get_setting('setting_password_numbers').length == 0 || n.length >= numberMinCount) &&
                sc && (settings.get_setting('setting_password_special_chars').length == 0 || sc.length >= specialMinCount);
        };

        /**
         * escapes regex string
         *
         * @param str
         * @returns {*}
         */
        var escape_reg_exp = function (str) {
            // from sindresorhus/escape-string-regexp under MIT License

            if (typeof str !== 'string') {
                throw new TypeError('Expected a string');
            }

            return str.replace(new RegExp('[|\\\\{}()[\\]^$+*?.]', 'g'),  '\\$&');
        };

        /**
         * @ngdoc
         * @name psonocli.passwordGenerator#generate
         * @methodOf psonocli.passwordGenerator
         *
         * @description
         * Main function to generate a random password based on the specified settings.
         *
         * @returns {string} Returns the generated random password
         */
        var generate = function () {
            var password = "";
            while (!is_strong_enough(password)) {
                password = generatePassword(settings.get_setting('setting_password_length'), memorable,
                    new RegExp('['+escape_reg_exp(settings.get_setting('setting_password_letters_uppercase') +
                            settings.get_setting('setting_password_letters_lowercase') +
                            settings.get_setting('setting_password_numbers') +
                            settings.get_setting('setting_password_special_chars'))+']'));
            }
            return password;
        };

        return {
            generate: generate
        };
    };

    var app = angular.module('psonocli');
    app.factory("passwordGenerator", ['settings', passwordGenerator]);

}(angular, generatePassword));