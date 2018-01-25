(function () {
    describe('Service: managerShare test suite', function () {

        beforeEach(module('psonocli'));

        it('managerShare exists', inject(function (managerShare) {
            expect(managerShare).toBeDefined();
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
                        rights: {
                            'read': true,
                            'write': true,
                            'grant': true
                        }
                        //user_share_rights: ['a-right-obj', 'another-right-obj'],
                        //user_share_rights_inherited: ['an-inherited-right-obj', 'another-inherited-right-obj']
                    }];
                });


            managerShare.read_share(share_id, secret_key).then(function(data){
                expect(data).toEqual({
                    data: decrypted_data,
                    rights: {
                        'read': true,
                        'write': true,
                        'grant': true
                    }
                    // user_share_rights: ['a-right-obj', 'another-right-obj'],
                    // user_share_rights_inherited: ['an-inherited-right-obj', 'another-inherited-right-obj']
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

        // it('write_share_with_content_id', inject(function (managerShare, cryptoLibrary) {
        //
        //     var share_id = '2a33b3a1-a95f-4392-856a-5d5153bca78f';
        //     var content = {
        //         id: "b56be9dc-62ae-4610-8c71-e26b00b3263b",
        //         bla: "blu"
        //     };
        //     var content_without_id = {
        //         bla: "blu"
        //     };
        //
        //     spyOn(cryptoLibrary, 'encrypt_data').and.returnValue({
        //         text: encrypted_data,
        //         nonce: encrypted_data_nonce
        //     });
        //
        //     $httpBackend.when('PUT', "https://www.psono.pw/server/share/").respond(
        //         function(method, url, data, headers, params) {
        //             // Validate request parameters:
        //             data = JSON.parse(data);
        //
        //             expect(headers.Authorization).toEqual('Token ' + token);
        //
        //             expect(data.share_id).toEqual(share_id);
        //             expect(data.data).toEqual(encrypted_data);
        //             expect(data.data_nonce).toEqual(encrypted_data_nonce);
        //
        //             // return answer
        //             return [200, {}];
        //         });
        //
        //
        //     managerShare.write_share(share_id, content, secret_key).then(function(data){
        //         expect(data.data).toEqual({});
        //     },function(data){
        //         console.log(data);
        //         // should never be reached
        //         expect(true).toBeFalsy();
        //     });
        //
        //     $httpBackend.flush();
        //
        //     expect(cryptoLibrary.encrypt_data).toHaveBeenCalledWith(JSON.stringify(content_without_id), secret_key);
        //
        // }));

        // it('write_share_without_content_id', inject(function (managerShare, cryptoLibrary) {
        //
        //     var share_id = '2a33b3a1-a95f-4392-856a-5d5153bca78f';
        //     var content = {
        //         bla: "blu"
        //     };
        //     var content_without_id = {
        //         bla: "blu"
        //     };
        //
        //     spyOn(cryptoLibrary, 'encrypt_data').and.returnValue({
        //         text: encrypted_data,
        //         nonce: encrypted_data_nonce
        //     });
        //
        //     $httpBackend.when('PUT', "https://www.psono.pw/server/share/").respond(
        //         function(method, url, data, headers, params) {
        //             // Validate request parameters:
        //             data = JSON.parse(data);
        //
        //             expect(headers.Authorization).toEqual('Token ' + token);
        //
        //             expect(data.share_id).toEqual(share_id);
        //             expect(data.data).toEqual(encrypted_data);
        //             expect(data.data_nonce).toEqual(encrypted_data_nonce);
        //
        //             // return answer
        //             return [200, {}];
        //         });
        //
        //
        //     managerShare.write_share(share_id, content, secret_key).then(function(data){
        //         expect(data.data).toEqual({});
        //     },function(data){
        //         // should never be reached
        //         expect(true).toBeFalsy();
        //     });
        //
        //     $httpBackend.flush();
        //
        //     expect(cryptoLibrary.encrypt_data).toHaveBeenCalledWith(JSON.stringify(content_without_id), secret_key);
        //
        // }));

        // it('create_share', inject(function (managerShare, cryptoLibrary) {
        //
        //     var parent_share_id = 'ffd839da-e009-42ce-b522-e79c0224b308';
        //     var parent_datastore_id = '5a72c902-b54a-45e7-b191-3eefa6de9c62';
        //     var link_id = '356d3238-5642-43ed-991c-8c980b719107';
        //     var share_id = '88fd7918-eaa0-480b-8498-ef9b03c25ced';
        //     var content = {
        //         id: "b56be9dc-62ae-4610-8c71-e26b00b3263b",
        //         bla: "blu"
        //     };
        //     var content_without_id = {
        //         bla: "blu"
        //     };
        //
        //     spyOn(cryptoLibrary, 'encrypt_data').and.returnValue({
        //         text: encrypted_data,
        //         nonce: encrypted_data_nonce
        //     });
        //
        //     $httpBackend.when('POST', "https://www.psono.pw/server/share/").respond(
        //         function(method, url, data, headers, params) {
        //             // Validate request parameters:
        //             data = JSON.parse(data);
        //
        //             expect(headers.Authorization).toEqual('Token ' + token);
        //
        //             expect(data.data).toEqual(encrypted_data);
        //             expect(data.data_nonce).toEqual(encrypted_data_nonce);
        //             expect(data.key).toEqual(encrypted_data2);
        //             expect(data.key_nonce).toEqual(encrypted_data_nonce2);
        //             expect(data.parent_share_id).toEqual(parent_share_id);
        //             expect(data.parent_datastore_id).toEqual(parent_datastore_id);
        //             expect(data.link_id).toEqual(link_id);
        //
        //             // return answer
        //             return [200, { share_id: share_id }];
        //         });
        //
        //
        //     managerShare.create_share(content, parent_share_id, parent_datastore_id, link_id).then(function(data){
        //         expect(data).toEqual({ share_id: share_id, secret_key: secret_key });
        //     },function(data){
        //         // should never be reached
        //         expect(true).toBeFalsy();
        //     });
        //
        //     $httpBackend.flush();
        //
        //     expect(cryptoLibrary.encrypt_data).toHaveBeenCalledWith(JSON.stringify(content_without_id), secret_key);
        //
        // }));

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

        // it('create_share_right', inject(function (managerShare, cryptoLibrary) {
        //
        //     var title = '';
        //     var type = 'type';
        //     var share_id = '0d35d343-74e1-4573-abcb-4bbe81e3a35d';
        //     var user_id = 'a624d62d-3845-4da2-88ed-4ae73c0d94bb';
        //     var user_public_key = 'a_user_public_key';
        //     var key = 'a_key';
        //     var read = 'a-read';
        //     var write = 'a-write';
        //     var grant = 'a-grant';
        //
        //     var share_right_id = 'c8549188-12b8-402d-8767-54fd0e90a816';
        //
        //     $httpBackend.when('PUT', "https://www.psono.pw/server/share/right/").respond(
        //         function(method, url, data, headers, params) {
        //             // Validate request parameters:
        //             data = JSON.parse(data);
        //
        //             expect(headers.Authorization).toEqual('Token ' + token);
        //
        //             expect(data.title).toEqual(encrypted_data3 + title);
        //             expect(data.title_nonce).toEqual(encrypted_data_nonce3 + title);
        //             expect(data.type).toEqual(encrypted_data3 + type);
        //             expect(data.type_nonce).toEqual(encrypted_data_nonce3 + type);
        //             expect(data.share_id).toEqual(share_id);
        //             expect(data.user_id).toEqual(user_id);
        //             expect(data.key).toEqual(encrypted_data3 + key);
        //             expect(data.key_nonce).toEqual(encrypted_data_nonce3 + key);
        //             expect(data.read).toEqual(read);
        //             expect(data.write).toEqual(write);
        //             expect(data.grant).toEqual(grant);
        //
        //             // return answer
        //             return [200, { share_right_id: share_right_id}];
        //         });
        //
        //
        //     managerShare.create_share_right(title, type, share_id, user_id, user_public_key, key, read, write, grant).then(function(data){
        //         expect(data).toEqual({ share_right_id: share_right_id });
        //     },function(data){
        //         // should never be reached
        //         expect(true).toBeFalsy();
        //     });
        //
        //     $httpBackend.flush();
        //
        // }));

        // it('update_share_right', inject(function (managerShare, cryptoLibrary) {
        //
        //     var share_right_id = '695b2a45-45d0-4a15-bce6-c3119c6615e5';
        //
        //     var share_id = '6d78b935-cbff-435d-be40-1fcc1da54633';
        //     var user_id = '4f867a1d-1c71-4b6e-bc5b-7860163a42b0';
        //     var read = 'a-read';
        //     var write = 'a-write';
        //     var grant = 'a-grant';
        //
        //     $httpBackend.when('POST', "https://www.psono.pw/server/share/right/").respond(
        //         function(method, url, data, headers, params) {
        //             // Validate request parameters:
        //             data = JSON.parse(data);
        //
        //             expect(headers.Authorization).toEqual('Token ' + token);
        //
        //             expect(data.share_id).toEqual(share_id);
        //             expect(data.user_id).toEqual(user_id);
        //             expect(data.read).toEqual(read);
        //             expect(data.write).toEqual(write);
        //             expect(data.grant).toEqual(grant);
        //
        //             // return answer
        //             return [200, { share_right_id: share_right_id}];
        //         });
        //
        //
        //     managerShare.update_share_right(share_id, user_id, read, write, grant).then(function(data){
        //         expect(data).toEqual({ share_right_id: share_right_id });
        //     },function(data){
        //         // should never be reached
        //         expect(true).toBeFalsy();
        //     });
        //
        //     $httpBackend.flush();
        //
        // }));

        // it('delete_share_right', inject(function (managerShare, cryptoLibrary) {
        //
        //     var share_right_id = '695b2a45-45d0-4a15-bce6-c3119c6615e5';
        //
        //     $httpBackend.when('DELETE', "https://www.psono.pw/server/share/right/").respond(
        //         function(method, url, data, headers, params) {
        //             // Validate request parameters:
        //             data = JSON.parse(data);
        //
        //             expect(headers.Authorization).toEqual('Token ' + token);
        //
        //             expect(data.share_right_id).toEqual(share_right_id);
        //
        //             // return answer
        //             return [200, { share_right_id: share_right_id}];
        //         });
        //
        //
        //     managerShare.delete_share_right(share_right_id).then(function(data){
        //         expect(data).toEqual({ share_right_id: share_right_id });
        //     },function(data){
        //         // should never be reached
        //         expect(true).toBeFalsy();
        //     });
        //
        //     $httpBackend.flush();
        //
        // }));

    });

}).call();
