(function(angular, generatePassword) {
    'use strict';

    var passwordGenerator = function(settings) {

        var memorable;
        var uppercaseMinCount;
        var lowercaseMinCount;
        var numberMinCount;
        var specialMinCount;

        var isStrongEnough = function (password) {
            var uc = password.match(new RegExp("(["+escapeRegExp(settings.get_setting('setting_password_letters_uppercase'))+"])", "g"));
            var lc = password.match(new RegExp("(["+escapeRegExp(settings.get_setting('setting_password_letters_lowercase'))+"])", "g"));
            var n = password.match(new RegExp("(["+escapeRegExp(settings.get_setting('setting_password_numbers'))+"])", "g"));
            var sc = password.match(new RegExp("(["+escapeRegExp(settings.get_setting('setting_password_special_chars'))+"])", "g"));

            return uc && uc.length >= uppercaseMinCount &&
                lc && lc.length >= lowercaseMinCount &&
                n && n.length >= numberMinCount &&
                sc && sc.length >= specialMinCount;
        };

        var escapeRegExp = function (str) {
            // from sindresorhus/escape-string-regexp under MIT License

            if (typeof str !== 'string') {
                throw new TypeError('Expected a string');
            }

            return str.replace(new RegExp('[|\\\\{}()[\\]^$+*?.]', 'g'),  '\\$&');
        };

        var generate = function () {
            var password = "";
            while (!isStrongEnough(password)) {
                password = generatePassword(settings.get_setting('setting_password_length'), memorable,
                    new RegExp('['+escapeRegExp(settings.get_setting('setting_password_letters_uppercase') +
                            settings.get_setting('setting_password_letters_lowercase') +
                            settings.get_setting('setting_password_numbers') +
                            settings.get_setting('setting_password_special_chars'))+']'));
            }
            return password;
        };

        var _init = function() {
            memorable = false;

            uppercaseMinCount = 1;
            lowercaseMinCount = 1;
            numberMinCount = 1;
            specialMinCount = 1;

        };
        _init();

        return {
            escapeRegExp: escapeRegExp,
            generate: generate
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("passwordGenerator", ['settings', passwordGenerator]);

}(angular, generatePassword));