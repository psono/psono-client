(function () {
    describe('Service: managerShare test suite', function () {

        beforeEach(module('psonocli'));

        it('managerShare exists', inject(function (managerShare) {
            expect(managerShare).toBeDefined();
        }));

        var token = 'the_session_token';
        var session_secret = 'the_session_secret';

        var mockedManagerBase;
        beforeEach(function () {

            mockedManagerBase = {
                get_session_secret_key: function () {
                    return session_secret
                },
                get_token: function() {
                    return token
                },
                find_one_nolimit: function(db, key) {

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
        }));

        it('read_share', inject(function (managerShare) {

            var share_id = '5881ae19-1358-4d99-826d-e9a634af0025';

            $httpBackend.when('GET', "https://www.psono.pw/server/share/" + share_id + "/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {
                        data: 'my_data',
                        data_nonce: 'my_data',
                        user_share_rights: ['a-right-obj', 'another-right-obj'],
                        user_share_rights_inherited: ['an-inherited-right-obj', 'another-inherited-right-obj']
                    }];
                });


            managerShare.read_share(share_id, secret_key).then(function(data){
                expect(data).toEqual({
                    data: decrypted_data,
                    user_share_rights: ['a-right-obj', 'another-right-obj'],
                    user_share_rights_inherited: ['an-inherited-right-obj', 'another-inherited-right-obj']
                });
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();

        }));

    });

}).call();
