(function () {
    describe('Service: managerSecret test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        it('managerSecret exists', inject(function (managerSecret) {
            expect(managerSecret).toBeDefined();
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
                find_key_nolimit: function(db, key) {

                }
            };

            module(function ($provide) {
                $provide.value('managerBase', mockedManagerBase);
            });

        });

        var mockedWindow;
        beforeEach(function () {

            mockedWindow = {
                location: {
                    href: 'asdf'
                },
                open: function(url, target) {

                }
            };

            module(function ($provide) {
                $provide.value('$window', mockedWindow);
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
                        data: data,
                        secret_key: secret_key
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


            $httpBackend.when('GET', "view/datastore.html").respond({});

            $httpBackend.flush();
        }));

        it('create_secret', inject(function (managerSecret) {

            var content = 'my-dummy-content';
            var link_id = 'd70d204c-c70c-48a8-9ac7-4190967f7b0a';
            var parent_datastore_id = '99e1b07d-8088-43b4-bb3b-b5c67b14af41';
            var parent_share_id = 'd172ed52-be6f-43e2-89e7-5b5a80c69368';

            var secret_id = 'fce612de-cbc3-4c93-b2dc-a16e1acb78a7';

            $httpBackend.when('PUT', "https://www.psono.pw/server/secret/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    data = JSON.parse(data.data);

                    expect(headers.Authorization).toEqual('Token ' + token);
                    expect(headers['Authorization-Validator']).toEqual(jasmine.any(String));

                    expect(data.link_id).toEqual(link_id);
                    expect(data.parent_datastore_id).toEqual(parent_datastore_id);
                    expect(data.parent_share_id).toEqual(parent_share_id);

                    // return answer
                    return [200, {secret_id: secret_id}];
                });

            managerSecret.create_secret(content, link_id, parent_datastore_id, parent_share_id).then(function(data){
                expect(data).toEqual({secret_id: secret_id, secret_key: secret_key});
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();

        }));

        it('read_secret', inject(function (managerSecret) {

            var secret_id = '5881ae19-1358-4d99-826d-e9a634af0025';

            $httpBackend.when('GET', "https://www.psono.pw/server/secret/"+ secret_id +"/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);
                    expect(headers['Authorization-Validator']).toEqual(jasmine.any(String));

                    // return answer
                    return [200, {}];
                });

            managerSecret.read_secret(secret_id, secret_key).then(function(data){

                decrypted_data.create_date = undefined;
                decrypted_data.write_date = undefined;

                expect(data).toEqual(decrypted_data);
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();

        }));

        it('write_secret', inject(function (managerSecret) {

            var secret_id = '05ee5340-7171-41e7-b827-2546ee742466';
            var secret_key = 'my_fake_key';
            var content = 'my_fake_content';

            $httpBackend.when('POST', "https://www.psono.pw/server/secret/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    data = JSON.parse(data.data);

                    expect(headers.Authorization).toEqual('Token ' + token);
                    expect(headers['Authorization-Validator']).toEqual(jasmine.any(String));

                    expect(data.secret_id).toEqual(secret_id);

                    // return answer
                    return [200, {secret_id: secret_id}];
                });

            managerSecret.write_secret(secret_id, secret_key, content).then(function(data){
                expect(data).toEqual({ secret_id: secret_id });
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();

        }));

        it('redirect_secret', inject(function (managerSecret, cryptoLibrary, $window, browserClient) {

            var secret_id = '05ee5340-7171-41e7-b827-2546ee742466';
            var type = 'website_password';

            $window.location.href = 'http://example1.com';

            spyOn(browserClient, 'emit_sec');

            $httpBackend.when('GET', "https://www.psono.pw/server/secret/" + secret_id + "/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);
                    expect(headers['Authorization-Validator']).toEqual(jasmine.any(String));

                    // return answer
                    return [200, {}];
                });

            managerSecret.redirect_secret(type, secret_id);

            $httpBackend.flush();

            expect($window.location.href).toBe(decrypted_data.website_password_url);

            expect(browserClient.emit_sec).toHaveBeenCalledWith("fillpassword", {
                username: decrypted_data.website_password_username,
                password: decrypted_data.website_password_password,
                authority: decrypted_data.website_password_url_filter,
                auto_submit: decrypted_data.website_password_auto_submit
            });

        }));

        it('on_item_click_with_new_window', inject(function (managerSecret, cryptoLibrary, $window) {

            spyOn($window, 'open').and.returnValue({});

            var item = {
                type: 'website_password',
                secret_id: '8584a986-f5c5-4adc-928b-c0eab9f2d550',
                urlfilter: 'example.com'
            };

            managerSecret.on_item_click(item);

            expect($window.open).toHaveBeenCalledWith('open-secret.html#!/secret/'+item.type+'/'+item.secret_id, '_blank');

        }));

        it('on_item_click_with_no_new_window', inject(function (managerSecret, cryptoLibrary, $window) {

            spyOn($window, 'open').and.returnValue({});

            var item = {
                type: 'note',
                secret_id: '8584a986-f5c5-4adc-928b-c0eab9f2d550'
            };

            managerSecret.on_item_click(item);

            expect($window.open).not.toHaveBeenCalled();

        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

    });

}).call();
