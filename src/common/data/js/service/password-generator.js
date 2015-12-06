(function(angular, generatePassword) {
    'use strict';

    var passwordGenerator = function() {

        var letters_uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var letters_lowercase = 'abcdefghijklmnoprstuvwxyz';
        var letters_numbers = '1234567890';
        var letters_special_chars = ',.-;:_#\'+*~!"§$%&/()=?{[]}\\';

        var length;
        var memorable;
        var uppercaseMinCount;
        var lowercaseMinCount;
        var numberMinCount;
        var specialMinCount;
        var UPPERCASE_RE;
        var LOWERCASE_RE;
        var NUMBER_RE;
        var SPECIAL_CHAR_RE;

        var isStrongEnough = function (password) {
            var uc = password.match(UPPERCASE_RE);
            var lc = password.match(LOWERCASE_RE);
            var n = password.match(NUMBER_RE);
            var sc = password.match(SPECIAL_CHAR_RE);

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
                password = generatePassword(length, memorable,
                    new RegExp('['+escapeRegExp(letters_uppercase + letters_lowercase + letters_numbers + letters_special_chars)+']'));
                console.log(password);
            }
            return password;
        };

        var _init = function() {

            length = 16;
            memorable = false;

            uppercaseMinCount = 1;
            lowercaseMinCount = 1;
            numberMinCount = 1;
            specialMinCount = 1;

            UPPERCASE_RE = new RegExp("(["+escapeRegExp(letters_uppercase)+"])", "g");
            LOWERCASE_RE = new RegExp("(["+escapeRegExp(letters_lowercase)+"])", "g");
            NUMBER_RE = new RegExp("(["+escapeRegExp(letters_numbers)+"])", "g");
            SPECIAL_CHAR_RE = new RegExp("(["+escapeRegExp(letters_special_chars)+"])", "g");
        };
        _init();

        return {
            escapeRegExp: escapeRegExp,
            generate: generate
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("passwordGenerator", [passwordGenerator]);

}(angular, generatePassword));