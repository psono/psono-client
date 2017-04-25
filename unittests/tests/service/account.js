(function () {
    describe('Service: account test suite', function () {

        beforeEach(module('psonocli'));

        it('account exists', inject(function (account) {
            expect(account).toBeDefined();
        }));


        var mockedStorage;
        beforeEach(function () {
            mockedStorage = {
                find_one: function (db, search) {
                    switch (search['key']) {
                        case 'user_id':
                            return { 'value': 'fake_user_id' };
                        case 'user_username':
                            return { 'value': 'fake_user_username' };
                        case 'user_public_key':
                            return { 'value': 'fake_user_public_key' };
                        case 'user_email':
                            return { 'value': 'fake_user_email' };
                        case 'setting_email':
                            return { 'value': 'fake_setting_email' };
                        default:
                            return null;
                    }

                }
            };

            module(function ($provide) {
                $provide.value('storage', mockedStorage);
            });

        });

        // Test Default account

        it('default get_tabs', inject(function (account) {
            var tabs = account.get_tabs();

            expect(Object.prototype.toString.call( tabs ) === '[object Array]').toBeTruthy();
            for(var i = 0; i < tabs.length; i++) {
                expect(tabs[i].hasOwnProperty('key')).toBeTruthy();
                expect(tabs[i].hasOwnProperty('title')).toBeTruthy();
            }
        }));

        it('default get_account_detail:user_id', inject(function (account) {
            expect(account.get_account_detail('user_id')).toBe('fake_user_id');
        }));

        it('default get_account_detail:user_username', inject(function (account) {
            expect(account.get_account_detail('user_username')).toBe('fake_user_username');
        }));

        it('default get_account_detail:user_public_key', inject(function (account) {
            expect(account.get_account_detail('user_public_key')).toBe('fake_user_public_key');
        }));

        it('default get_account_detail:user_email', inject(function (account) {
            expect(account.get_account_detail('user_email')).toBe('fake_user_email');
        }));

        it('default get_account_detail:setting_email', inject(function (account) {
            expect(account.get_account_detail('setting_email')).toBe('fake_user_email');
        }));

        it('default get_account ', inject(function (account) {
            var acc = account.get_account();
            expect(acc.hasOwnProperty('fields')).toBeTruthy();
        }));

    });

}).call();
