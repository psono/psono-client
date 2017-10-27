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
        var public_private_keypair = {
            'private_key': 'private_key',
            'public_key': 'public_key'
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


        it('read_group', inject(function (managerGroups) {

            var group_id = "group_id"
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

            var group_id = "group_id"
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


    });

}).call();
