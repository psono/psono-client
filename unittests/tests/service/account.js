(function () {
    describe('Service: account test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        it('account exists', inject(function (account) {
            expect(account).toBeDefined();
        }));


        var mockedStorage;
        beforeEach(function () {
            mockedStorage = {
                find_key: function (db, key) {
                    switch (key) {
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
                        case 'server_info':
                            return { 'value': {
                                    'allowed_second_factors': ['yubikey_otp', 'google_authenticator', 'duo']
                                }
                            };
                        case 'server_verify_key':
                            return { 'value': 'fake_server_verify_key' };
                        default:
                            return null;
                    }
                },
                register: function (key, func) {
                    // don't do anything
                }
            };

            module(function ($provide) {
                $provide.value('storage', mockedStorage);
            });

        });
        //
        // var fakeModal = {
        //     result: {
        //         then: function (confirmCallback, cancelCallback) {
        //             this.confirmCallBack = confirmCallback;
        //             this.cancelCallback = cancelCallback;
        //             return this;
        //         },
        //         catch: function (cancelCallback) {
        //             this.cancelCallback = cancelCallback;
        //             return this;
        //         },
        //         finally: function (finallyCallback) {
        //             this.finallyCallback = finallyCallback;
        //             return this;
        //         }
        //     },
        //     close: function (item) {
        //         this.result.confirmCallBack(item);
        //     },
        //     dismiss: function (item) {
        //         this.result.cancelCallback(item);
        //     },
        //     finally: function () {
        //         this.result.finallyCallback();
        //     }
        // };

        // Test Default account

        it('get_tabs', inject(function (account) {
            var tabs = account.get_tabs();

            expect(Object.prototype.toString.call( tabs ) === '[object Array]').toBeTruthy();
            for(var i = 0; i < tabs.length; i++) {
                expect(tabs[i].hasOwnProperty('key')).toBeTruthy();
                expect(tabs[i].hasOwnProperty('title')).toBeTruthy();
            }
        }));

        it('get_default_tab', inject(function (account) {
            expect(account.get_default_tab()).toBe('overview');
        }));

        it('get_account_detail:user_id', inject(function (account) {
            expect(account.get_account_detail('user_id')).toBe('fake_user_id');
        }));

        it('get_account_detail:user_username', inject(function (account) {
            expect(account.get_account_detail('user_username')).toBe('fake_user_username');
        }));

        it('get_account_detail:user_public_key', inject(function (account) {
            expect(account.get_account_detail('user_public_key')).toBe('fake_user_public_key');
        }));

        it('get_account_detail:user_email', inject(function (account) {
            expect(account.get_account_detail('user_email')).toBe('fake_user_email');
        }));

        it('get_account_detail:setting_email', inject(function (account) {
            expect(account.get_account_detail('setting_email')).toBe('fake_user_email');
        }));

        it('get_account ', inject(function (account) {
            var acc = account.get_account();
            expect(acc.hasOwnProperty('fields')).toBeTruthy();
        }));

        it('check all onClicks existence', inject(function (account) {
            var acc = account.get_account();

            for (var i = 0; i < acc['fields'].length; i++) {
                if (acc['fields'][i].hasOwnProperty('onClick')) {
                    expect(acc.hasOwnProperty(acc['fields'][i]['onClick'])).toBeTruthy();
                }
            }
        }));

        it('check all onClicks to be functions', inject(function (account) {
            var acc = account.get_account();

            for (var i = 0; i < acc['fields'].length; i++) {
                if (acc['fields'][i].hasOwnProperty('onClick')) {
                    expect(typeof acc[acc['fields'][i]['onClick']] === "function").toBeTruthy();
                }
            }
        }));

        it('onClickGenerateNewPasswordRecoveryCode', inject(function (account) {
            var acc = account.get_account();

            acc['onClickGenerateNewPasswordRecoveryCode']();
        }));

        it('onClickConfigureGoogleAuthenticator', inject(function (account) {
            var acc = account.get_account();

            acc['onClickConfigureGoogleAuthenticator']();
        }));

        it('onClickConfigureYubiKeyOTP', inject(function (account) {
            var acc = account.get_account();

            acc['onClickConfigureYubiKeyOTP']();
        }));



    });

}).call();
