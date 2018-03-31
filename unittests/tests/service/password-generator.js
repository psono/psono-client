(function () {
    describe('Service: managerDatastorePassword generate test suite', function () {

        beforeEach(module('psonocli'));

        it('managerDatastorePassword exists', inject(function (managerDatastorePassword) {
            expect(managerDatastorePassword).toBeDefined();
        }));

        it('generate produces different passwords', inject(function (managerDatastorePassword) {
            var pw1 = managerDatastorePassword.generate();
            var pw2 = managerDatastorePassword.generate();
            return expect(pw1).not.toBe(pw2);
        }));

        it('password has the proper length', inject(function (managerDatastorePassword, settings) {
            var pw = managerDatastorePassword.generate();
            return expect(pw.length).toBe(settings.get_setting('setting_password_length'));
        }));

        it('password has more than 1 uppercase char', inject(function (managerDatastorePassword, settings) {
            var pw = managerDatastorePassword.generate();
            return expect(pw.match(new RegExp("(["+settings.get_setting('setting_password_letters_uppercase')
                    .replace(new RegExp('[|\\\\{}()[\\]^$+*?.]', 'g'),  '\\$&')+"])", "g")).length).toBeGreaterThanOrEqual(1);
        }));

        it('password has more than 1 lowercase char', inject(function (managerDatastorePassword, settings) {
            var pw = managerDatastorePassword.generate();
            return expect(pw.match(new RegExp("(["+settings.get_setting('setting_password_letters_lowercase')
                    .replace(new RegExp('[|\\\\{}()[\\]^$+*?.]', 'g'),  '\\$&')+"])", "g")).length).toBeGreaterThanOrEqual(1);
        }));

        it('password has more than 1 number', inject(function (managerDatastorePassword, settings) {
            var pw = managerDatastorePassword.generate();
            return expect(pw.match(new RegExp("(["+settings.get_setting('setting_password_numbers')
                    .replace(new RegExp('[|\\\\{}()[\\]^$+*?.]', 'g'),  '\\$&')+"])", "g")).length).toBeGreaterThanOrEqual(1);
        }));

        it('password has more than 1 special char', inject(function (managerDatastorePassword, settings) {
            var pw = managerDatastorePassword.generate();
            return expect(pw.match(new RegExp("(["+settings.get_setting('setting_password_special_chars')
                    .replace(new RegExp('[|\\\\{}()[\\]^$+*?.]', 'g'),  '\\$&')+"])", "g")).length).toBeGreaterThanOrEqual(1);
        }));
    });

}).call();
