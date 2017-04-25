(function () {
    describe('Service: settings test suite', function () {

        beforeEach(module('psonocli'));

        it('settings exists', inject(function (settings) {
            expect(settings).toBeDefined();
        }));


        var mockedStorage;
        beforeEach(function () {

            var my_vars = {
                'my_setting': 'fake_my_setting'
            };

            mockedStorage = {
                find_one: function (db, search) {
                    if (my_vars.hasOwnProperty(search['key'])) {
                        return { 'key': search['key'], 'value': my_vars[search['key']] };
                    } else {
                        return null;
                    }
                },
                insert: function(db, entry) {
                    my_vars[entry.key] = entry.value;
                },
                save: function() {
                },
                update: function(db, entry) {
                    my_vars[entry.key] = entry.value;
                }
            };

            module(function ($provide) {
                $provide.value('storage', mockedStorage);
            });

        });

        // Test Default settings

        it('default get_tabs', inject(function (settings) {
            var tabs = settings.get_tabs();

            expect(Object.prototype.toString.call( tabs ) === '[object Array]').toBeTruthy();
            for(var i = 0; i < tabs.length; i++) {
                expect(tabs[i].hasOwnProperty('key')).toBeTruthy();
                expect(tabs[i].hasOwnProperty('title')).toBeTruthy();
            }
        }));

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

        it('default get_settings', inject(function (settings) {
            var acc = settings.get_settings();
            expect(acc.hasOwnProperty('fields')).toBeTruthy();
        }));

        it('default get_account_detail:user_id', inject(function (settings) {
            expect(settings.get_setting('my_setting')).toBe('fake_my_setting');
        }));

        it('default set_settings:user_id', inject(function (settings) {
            settings.set_settings('my_settings_key', 'my_settings_value');
            expect(settings.get_setting('my_settings_key')).toBe('my_settings_value');
        }));

        it('default set_settings:user_id', inject(function (settings) {
            settings.set_settings('my_settings_key', 'my_settings_value');
            settings.set_settings('my_settings_key', 'my_settings_value2');
            expect(settings.get_setting('my_settings_key')).toBe('my_settings_value2');
        }));


    });

}).call();
