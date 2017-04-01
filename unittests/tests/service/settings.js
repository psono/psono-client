(function () {
    describe('Service: settings test suite', function () {

        beforeEach(module('psonocli'));

        it('settings exists', inject(function (settings) {
            expect(settings).toBeDefined();
        }));

        // Test Default settings

        it('default setting_password_length = 16', inject(function (settings) {
            expect(settings.get_setting('setting_password_length')).toBe(16);
        }));

        it('default setting_password_letters_uppercase = ABCDEFGHIJKLMNOPQRSTUVWXYZ', inject(function (settings) {
            expect(settings.get_setting('setting_password_letters_uppercase')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        }));

        it('default setting_password_letters_lowercase = abcdefghijklmnopqrstuvwxyz', inject(function (settings) {
            expect(settings.get_setting('setting_password_letters_lowercase')).toBe('abcdefghijklmnopqrstuvwxyz');
        }));

        it('default setting_password_numbers = 0123456789', inject(function (settings) {
            expect(settings.get_setting('setting_password_numbers')).toBe('0123456789');
        }));

        it('default setting_password_special_chars = ,.-;:_#\'+*~!"§$%&/()=?{[]}\\', inject(function (settings) {
            expect(settings.get_setting('setting_password_special_chars')).toBe(',.-;:_#\'+*~!"§$%&/()=?{[]}\\');
        }));
    });

}).call();
