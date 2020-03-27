(function () {
    describe('Service: settings test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        it('settings exists', inject(function (settings) {
            expect(settings).toBeDefined();
        }));


        var mockedStorage;
        beforeEach(function () {

            var my_vars = {
                'my_setting': 'fake_my_setting'
            };

            mockedStorage = {
                find_key: function (db, key) {
                    if (my_vars.hasOwnProperty(key)) {
                        return { 'key': key, 'value': my_vars[key] };
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
                },
                register: function (key, func) {
                    // don't do anything
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

        it('get_default_tab', inject(function (settings) {
            expect(settings.get_default_tab()).toBe('password-generator');
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

        it('get_setting(undefined) = null', inject(function (settings) {
            expect(settings.get_setting()).toBeNull();
        }));

        it('default get_settings', inject(function (managerDatastorePassword, settings) {
            var set = settings.get_settings();
            expect(set.hasOwnProperty('fields')).toBeTruthy();
        }));

        it('default get_account_detail:user_id', inject(function (settings) {
            expect(settings.get_setting('my_setting')).toBe('fake_my_setting');
        }));

        it('default set_settings:user_id', inject(function (managerDatastorePassword, settings) {
            settings.set_settings('my_settings_key', 'my_settings_value');
            expect(settings.get_setting('my_settings_key')).toBe('my_settings_value');
        }));

        it('default set_settings:user_id2', inject(function (managerDatastorePassword, settings) {
            settings.set_settings('my_settings_key', 'my_settings_value');
            settings.set_settings('my_settings_key', 'my_settings_value2');
            expect(settings.get_setting('my_settings_key')).toBe('my_settings_value2');
        }));

        it('save', inject(function (managerDatastorePassword, storage, settings) {
            spyOn(storage, 'insert');
            settings.save();
            expect(storage.insert).toHaveBeenCalledWith('settings', {key: 'setting_password_special_chars', value: undefined});
            expect(storage.insert).toHaveBeenCalledWith('settings', {key: 'setting_password_numbers', value: undefined});
            expect(storage.insert).toHaveBeenCalledWith('settings', {key: 'setting_password_letters_lowercase', value: undefined});
            expect(storage.insert).toHaveBeenCalledWith('settings', {key: 'setting_password_letters_uppercase', value: undefined});
            expect(storage.insert).toHaveBeenCalledWith('settings', {key: 'setting_password_length', value: undefined});
        }));


    });

}).call();
