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
                    if (key === 'user_private_key') {
                        return 'user_private_key';
                    }
                },
                decrypt_private_key: function(text, nonce, public_key) {
                    return "decrypt_private_key return value"
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

        it('read_shares', inject(function (managerShare) {

            $httpBackend.when('GET', "https://www.psono.pw/server/share/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {
                        shares: [{
                            share_right_title: "share_right_title",
                            share_right_title_nonce: "share_right_title_nonce",
                            share_right_create_user_public_key: "share_right_create_user_public_key",
                        }]
                    }];
                });


            managerShare.read_shares().then(function(data){
                expect(data).toEqual({
                    shares: [{
                        share_right_title: 'decrypt_private_key return value',
                        share_right_title_nonce: 'share_right_title_nonce',
                        share_right_create_user_public_key: 'share_right_create_user_public_key'
                    }]
                });
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();

        }));

        it('write_share_with_content_id', inject(function (managerShare, cryptoLibrary) {

            var share_id = '2a33b3a1-a95f-4392-856a-5d5153bca78f';
            var content = {
                id: "b56be9dc-62ae-4610-8c71-e26b00b3263b",
                bla: "blu"
            };
            var content_without_id = {
                bla: "blu"
            };

            spyOn(cryptoLibrary, 'encrypt_data').and.returnValue({
                text: encrypted_data,
                nonce: encrypted_data_nonce
            });

            $httpBackend.when('PUT', "https://www.psono.pw/server/share/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.share_id).toEqual(share_id);
                    expect(data.data).toEqual(encrypted_data);
                    expect(data.data_nonce).toEqual(encrypted_data_nonce);

                    // return answer
                    return [200, {}];
                });


            managerShare.write_share(share_id, content, secret_key).then(function(data){
                expect(data.data).toEqual({});
            },function(data){
                console.log(data);
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();

            expect(cryptoLibrary.encrypt_data).toHaveBeenCalledWith(JSON.stringify(content_without_id), secret_key);

        }));

        it('write_share_without_content_id', inject(function (managerShare, cryptoLibrary) {

            var share_id = '2a33b3a1-a95f-4392-856a-5d5153bca78f';
            var content = {
                bla: "blu"
            };
            var content_without_id = {
                bla: "blu"
            };

            spyOn(cryptoLibrary, 'encrypt_data').and.returnValue({
                text: encrypted_data,
                nonce: encrypted_data_nonce
            });

            $httpBackend.when('PUT', "https://www.psono.pw/server/share/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.share_id).toEqual(share_id);
                    expect(data.data).toEqual(encrypted_data);
                    expect(data.data_nonce).toEqual(encrypted_data_nonce);

                    // return answer
                    return [200, {}];
                });


            managerShare.write_share(share_id, content, secret_key).then(function(data){
                expect(data.data).toEqual({});
            },function(data){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();

            expect(cryptoLibrary.encrypt_data).toHaveBeenCalledWith(JSON.stringify(content_without_id), secret_key);

        }));

        it('read_share_rights', inject(function (managerShare, cryptoLibrary) {

            var share_id = '2a33b3a1-a95f-4392-856a-5d5153bca78f';

            $httpBackend.when('GET', "https://www.psono.pw/server/share/rights/" + share_id + "/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });


            managerShare.read_share_rights(share_id).then(function(data){
                expect(data).toEqual({});
            },function(data){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();

        }));

        it('read_share_rights_overview', inject(function (managerShare, cryptoLibrary) {

            $httpBackend.when('GET', "https://www.psono.pw/server/share/right/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });


            managerShare.read_share_rights_overview().then(function(data){
                expect(data).toEqual({});
            },function(data){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();

        }));

    });

}).call();
