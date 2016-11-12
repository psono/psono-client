(function () {
    describe('Service: passwordGenerator test suite', function () {

        beforeEach(module('passwordManagerApp'));

        it('passwordGenerator exists', inject(function (passwordGenerator) {
            expect(passwordGenerator).toBeDefined();
        }));

        it('generate produces different passwords', inject(function (passwordGenerator) {
            var pw1 = passwordGenerator.generate();
            var pw2 = passwordGenerator.generate();
            return expect(pw1).not.toBe(pw2);
        }));

        it('password has the proper length', inject(function (passwordGenerator, settings) {
            var pw = passwordGenerator.generate();
            return expect(pw.length).toBe(settings.get_setting('setting_password_length'));
        }));

        it('password has more than 1 uppercase char', inject(function (passwordGenerator, settings) {
            var pw = passwordGenerator.generate();
            return expect(pw.match(new RegExp("(["+settings.get_setting('setting_password_letters_uppercase')
                    .replace(new RegExp('[|\\\\{}()[\\]^$+*?.]', 'g'),  '\\$&')+"])", "g")).length).toBeGreaterThanOrEqual(1);
        }));

        it('password has more than 1 lowercase char', inject(function (passwordGenerator, settings) {
            var pw = passwordGenerator.generate();
            return expect(pw.match(new RegExp("(["+settings.get_setting('setting_password_letters_lowercase')
                    .replace(new RegExp('[|\\\\{}()[\\]^$+*?.]', 'g'),  '\\$&')+"])", "g")).length).toBeGreaterThanOrEqual(1);
        }));

        it('password has more than 1 number', inject(function (passwordGenerator, settings) {
            var pw = passwordGenerator.generate();
            return expect(pw.match(new RegExp("(["+settings.get_setting('setting_password_numbers')
                    .replace(new RegExp('[|\\\\{}()[\\]^$+*?.]', 'g'),  '\\$&')+"])", "g")).length).toBeGreaterThanOrEqual(1);
        }));

        it('password has more than 1 special char', inject(function (passwordGenerator, settings) {
            var pw = passwordGenerator.generate();
            return expect(pw.match(new RegExp("(["+settings.get_setting('setting_password_special_chars')
                    .replace(new RegExp('[|\\\\{}()[\\]^$+*?.]', 'g'),  '\\$&')+"])", "g")).length).toBeGreaterThanOrEqual(1);
        }));
    });

}).call();
