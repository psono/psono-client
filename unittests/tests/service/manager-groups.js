(function () {
    describe('Service: managerGroups test suite', function () {

        beforeEach(module('psonocli'));

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
                find_one_nolimit: function(db, key) {
                    if (key === 'user_private_key') {
                        return 'user_private_key';
                    }
                },
                decrypt_private_key: function(text, nonce, public_key) {
                    return "decrypt_private_key return: " + text + ' ' + nonce + ' ' + public_key
                },
                decrypt_secret_key: function(text, nonce) {
                    return "decrypt_secret_key return: " + text + ' ' + nonce
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
        var public_private_keypair = {
            'private_key': '81972fcf95422fb87a88372c0320612aeabeaf185119968c6b3b002034e6bdf5',
            'public_key': '89c4d51256420d1ac2d2e461b2c37aec36b362c9380f406a1d5dc2c3934e2d5f'
        };

        var mockedCryptoLibrary;
        beforeEach(function () {
            mockedCryptoLibrary = {
                generate_secret_key: function () {
                    return secret_key;
                },
                encrypt_data: function(data, secret_key) {
                    return  {
                        data: data,
                        secret_key: secret_key
                    };
                },
                encrypt_data_public_key: function(data, public_key, private_key) {
                    return  {
                        'text': 'encrypted: ' + data,
                        'nonce': 'nonce'
                    };
                },
                decrypt_data: function(text, nonce, secret_key) {
                    return JSON.stringify(decrypted_data)
                },
                generate_public_private_keypair: function() {
                    return  public_private_keypair;
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

        it('helper exists', inject(function (managerGroups) {
            expect(managerGroups).toBeDefined();
        }));


        it('read_groups', inject(function (managerGroups) {
            $httpBackend.when('GET', "https://www.psono.pw/server/group/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {'groups': [
                        {
                            'name': 'Group Name'
                        }
                    ]}];
                });

            managerGroups.read_groups().then(function(data){
                expect(data).toEqual([{
                    'name': 'Group Name'
                }]);
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


        it('get_group_secret_key:symmetric', inject(function (managerGroups) {
            var group_id = 'group_id';
            var group_secret_key = 'group_secret_key';
            var group_secret_key_nonce = 'group_secret_key_nonce';
            var group_secret_key_type = 'symmetric';

            var group_public_key = 'group_public_key';

            var group_secret_key_plain = managerGroups.get_group_secret_key(group_id, group_secret_key, group_secret_key_nonce, group_secret_key_type, group_public_key);

            expect(group_secret_key_plain).toEqual("decrypt_secret_key return: group_secret_key group_secret_key_nonce");
        }));


        it('get_group_secret_key:asymmetric', inject(function (managerGroups) {
            var group_id = 'group_id';
            var group_secret_key = 'group_secret_key';
            var group_secret_key_nonce = 'group_secret_key_nonce';
            var group_secret_key_type = 'asymmetric';

            var group_public_key = 'group_public_key';

            var group_secret_key_plain = managerGroups.get_group_secret_key(group_id, group_secret_key, group_secret_key_nonce, group_secret_key_type, group_public_key);

            expect(group_secret_key_plain).toEqual("decrypt_private_key return: group_secret_key group_secret_key_nonce group_public_key");
        }));


        it('get_group_private_key:symmetric', inject(function (managerGroups) {
            var group_id = 'group_id';
            var group_private_key = 'group_private_key';
            var group_private_key_nonce = 'group_private_key_nonce';
            var group_private_key_type = 'symmetric';

            var group_public_key = 'group_public_key';

            var group_private_key_plain = managerGroups.get_group_private_key(group_id, group_private_key, group_private_key_nonce, group_private_key_type, group_public_key);

            expect(group_private_key_plain).toEqual("decrypt_secret_key return: group_private_key group_private_key_nonce");
        }));


        it('get_group_private_key:asymmetric', inject(function (managerGroups) {
            var group_id = 'group_id';
            var group_private_key = 'group_private_key';
            var group_private_key_nonce = 'group_private_key_nonce';
            var group_private_key_type = 'asymmetric';

            var group_public_key = 'group_public_key';

            var group_private_key_plain = managerGroups.get_group_private_key(group_id, group_private_key, group_private_key_nonce, group_private_key_type, group_public_key);

            expect(group_private_key_plain).toEqual("decrypt_private_key return: group_private_key group_private_key_nonce group_public_key");
        }));


        it('read_group', inject(function (managerGroups) {

            var group_id = "group_id";
            var group = {
                'group_id': group_id,
                'name': 'Group Name'
            };

            $httpBackend.when('GET', "https://www.psono.pw/server/group/" + group_id + "/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, group];
                });

            managerGroups.read_group(group_id).then(function(data){
                expect(data).toEqual(group);
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


        it('create_group', inject(function (managerGroups) {

            var group_id = "group_id";
            var group = {
                'group_id': group_id,
                'name': 'Group Name'
            };

            $httpBackend.when('PUT', "https://www.psono.pw/server/group/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    data = JSON.parse(data.data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.name).toEqual(group['name']);
                    expect(data.secret_key).toBeDefined();
                    expect(data.secret_key_nonce).toBeDefined();
                    expect(data.private_key).toBeDefined();
                    expect(data.private_key_nonce).toBeDefined();
                    expect(data.public_key).toBeDefined();

                    // return answer
                    return [200, group];
                });
            managerGroups.create_group(group['name']).then(function(data){
                expect(data).toEqual(group);
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


        it('update_group', inject(function (managerGroups) {

            var group_id = "group_id";
            var group_name = "group_name";

            var group = {
                'group_id': group_id,
                'group_name': group_name
            };


            $httpBackend.when('POST', "https://www.psono.pw/server/group/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    data = JSON.parse(data.data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.group_id).toEqual(group_id);
                    expect(data.name).toEqual(group_name);

                    // return answer
                    return [200, group];
                });

            managerGroups.update_group(group_id, group_name).then(function(data){
                expect(data).toEqual(group);
            },function(data){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


        it('delete_group', inject(function (managerGroups) {

            var group_id = "group_id";

            $httpBackend.when('DELETE', "https://www.psono.pw/server/group/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    data = JSON.parse(data.data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.group_id).toEqual(group_id);

                    // return answer
                    return [200, {}];
                });

            managerGroups.delete_group(group_id).then(function(data){
                expect(data).toEqual({});
            },function(data){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


        it('read_group_rights', inject(function (managerGroups) {

            var group_id = "group_id";

            $httpBackend.when('GET', "https://www.psono.pw/server/group/rights/" + group_id + "/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });

            managerGroups.read_group_rights(group_id).then(function(data){
                expect(data).toEqual({});
            },function(data){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


        it('create_membership', inject(function (managerGroups) {

            var group = {
                'group_id': "group_id",
                'name': 'Group Name',
                'secret_key': 'secret_key',
                'secret_key_nonce': 'secret_key_nonce',
                'public_key': 'public_key',
                'private_key': 'private_key',
                'private_key_nonce': 'private_key_nonce',
                'private_key_type': 'private_key_type'
            };
            var group_admin = true;

            var user = {
                'id': 'user_id',
                'public_key': 'public_key'
            };

            $httpBackend.when('PUT', "https://www.psono.pw/server/membership/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    data = JSON.parse(data.data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.group_id).toEqual(group.group_id);
                    expect(data.user_id).toEqual(user.id);
                    expect(data.secret_key).toEqual('encrypted: decrypt_private_key return: secret_key secret_key_nonce public_key');
                    expect(data.secret_key_nonce).toEqual('nonce');
                    expect(data.secret_key_type).toEqual('asymmetric');
                    expect(data.private_key).toEqual('encrypted: decrypt_private_key return: private_key private_key_nonce public_key');
                    expect(data.private_key_nonce).toEqual('nonce');
                    expect(data.private_key_type).toEqual('asymmetric');
                    expect(data.group_admin).toEqual(group_admin);

                    // return answer
                    return [200, {}];
                });

            managerGroups.create_membership(user, group, group_admin).then(function(data){
                expect(data).toEqual({});
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


        it('update_membership', inject(function (managerGroups) {

            var membership_id = "membership_id";
            var group_admin = "group_admin";

            $httpBackend.when('POST', "https://www.psono.pw/server/membership/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    data = JSON.parse(data.data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.membership_id).toEqual(membership_id);
                    expect(data.group_admin).toEqual(group_admin);

                    // return answer
                    return [200, {}];
                });

            managerGroups.update_membership(membership_id, group_admin).then(function(data){
                expect(data).toEqual({});
            },function(data){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


        it('delete_membership', inject(function (managerGroups) {

            var membership_id = "membership_id";

            $httpBackend.when('DELETE', "https://www.psono.pw/server/membership/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    data = JSON.parse(data.data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.membership_id).toEqual(membership_id);

                    // return answer
                    return [200, {}];
                });

            managerGroups.delete_membership(membership_id).then(function(data){
                expect(data).toEqual({});
            },function(data){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


        // it('accept_membership', inject(function (managerGroups) {
        //
        //     var membership_id = "membership_id";
        //
        //     $httpBackend.when('POST', "https://www.psono.pw/server/membership/accept/").respond(
        //         function(method, url, data, headers, params) {
        //             // Validate request parameters:
        //             data = JSON.parse(data);
        //             data = JSON.parse(data.data);
        //
        //             expect(headers.Authorization).toEqual('Token ' + token);
        //
        //             expect(data.membership_id).toEqual(membership_id);
        //
        //             // return answer
        //             return [200, {}];
        //         });
        //
        //     managerGroups.accept_membership(membership_id).then(function(data){
        //         expect(data).toEqual({});
        //     },function(data){
        //         // should never be reached
        //         expect(true).toBeFalsy();
        //     });
        //
        //     $httpBackend.flush();
        // }));


        it('decline_membership', inject(function (managerGroups) {

            var membership_id = "membership_id";

            $httpBackend.when('POST', "https://www.psono.pw/server/membership/decline/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    data = JSON.parse(data.data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.membership_id).toEqual(membership_id);

                    // return answer
                    return [200, {}];
                });

            managerGroups.decline_membership(membership_id).then(function(data){
                expect(data).toEqual({});
            },function(data){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


    });

}).call();
