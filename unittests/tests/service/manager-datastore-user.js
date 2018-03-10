(function () {
    describe('Service: managerDatastoreUser test suite', function () {

        beforeEach(module('psonocli'));

        it('managerDatastoreUser exists', inject(function (managerDatastoreUser) {
            expect(managerDatastoreUser).toBeDefined();
        }));

        var token = 'the_session_token';
        var session_secret = 'the_session_secret';
        var encrypted_data2 = 'dummy_encrypt_data_text2';
        var encrypted_data_nonce2 = 'dummy_encrypt_data_nonce2';
        var encrypted_data3 = 'dummy_encrypt_data_text3';
        var encrypted_data_nonce3 = 'dummy_encrypt_data_nonce3';

        var mockedManagerBase;
        beforeEach(function () {

            mockedManagerBase = {
                get_session_secret_key: function () {
                    return session_secret
                },
                get_token: function() {
                    return token
                },
                find_key_nolimit: function(db, key) {
                    if (key === 'user_private_key') {
                        return 'user_private_key';
                    }
                },
                decrypt_private_key: function(text, nonce, public_key) {
                    return "decrypt_private_key return value"
                },
                encrypt_secret_key: function(text, nonce, public_key) {
                    return  {
                        text: encrypted_data2,
                        nonce: encrypted_data_nonce2
                    };
                },
                encrypt_private_key: function(text, public_key) {
                    return  {
                        text: encrypted_data3 + text,
                        nonce: encrypted_data_nonce3 + text
                    };
                }
            };

            module(function ($provide) {
                $provide.value('managerBase', mockedManagerBase);
            });

        });

        var secret_key = '77285ecc77ff7c8475d7866e1c7bcb382b7fdf9239b7f326299f1abf8d17dd81';
        var decrypted_data = {
            website_password_username: 'my-user',
            website_password_password: 'my-password',
            website_password_url_filter: 'example2.com',
            website_password_auto_submit: true,
            website_password_url: 'http://example2.com'
        };
        var encrypted_data = 'dummy_encrypt_data_text';
        var encrypted_data_nonce = 'dummy_encrypt_data_nonce';

        var mockedCryptoLibrary;
        beforeEach(function () {
            mockedCryptoLibrary = {
                generate_secret_key: function () {
                    return secret_key;
                },
                encrypt_data: function(data, secret_key) {
                    return  {
                        text: encrypted_data,
                        nonce: encrypted_data_nonce
                    };
                },
                decrypt_data: function(text, nonce, secret_key) {
                    return JSON.stringify(decrypted_data)
                }
            };

            module(function ($provide) {
                $provide.value('cryptoLibrary', mockedCryptoLibrary);
            });

        });

        var $httpBackend;
        beforeEach(inject(function($injector){
            // unwrap necessary services
            $httpBackend = $injector.get('$httpBackend');
            cryptoLibrary = $injector.get('cryptoLibrary');

            spyOn(cryptoLibrary, "encrypt_data").and.callFake(function(json_data, session_secret_key) {
                return JSON.parse(json_data);
            });
        }));

        it('delete_session', inject(function (managerDatastoreUser) {

            var session_id = '90457fb8-4472-49c5-925d-0a7044909a36';

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/logout/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(data.session_id).toEqual(session_id);
                    // will fail for everything that is no ISO date and return NAN which is not bigger than 0
                    expect(Date.parse(data.request_time) > 0).toBeTruthy();

                    expect(headers.Authorization).toEqual('Token ' + token);
                    expect(headers['Authorization-Validator']).toEqual(jasmine.any(String));

                    // return answer
                    return [200, {}];
                });


            managerDatastoreUser.delete_session(session_id, secret_key).then(function(data){
                // pass
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();

        }));

        it('ga_verify', inject(function (managerDatastoreUser) {

            var ga_token = '123456';

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/ga-verify/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(data.ga_token).toEqual(ga_token);

                    // return answer
                    return [200, {}];
                });


            managerDatastoreUser.ga_verify(ga_token).then(function(data){
                // pass
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();

        }));

        it('yubikey_otp_verify', inject(function (managerDatastoreUser) {

            var yubikey_otp = '123456';

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/yubikey-otp-verify/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(data.yubikey_otp).toEqual(yubikey_otp);

                    // return answer
                    return [200, {}];
                });


            managerDatastoreUser.yubikey_otp_verify(yubikey_otp).then(function(data){
                // pass
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();

        }));


    });

}).call();
