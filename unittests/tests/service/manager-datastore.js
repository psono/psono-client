(function () {
    describe('Service: managerDatastore test suite', function () {

        beforeEach(module('psonocli'));

        var token = 'the_session_token';
        var session_secret = 'the_session_secret';
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
                    return "decrypt_private_key return: " + text + ' ' + nonce + ' ' + public_key
                },
                decrypt_secret_key: function(text, nonce) {
                    return "decrypt_secret_key return: " + text + ' ' + nonce
                },
                encrypt_secret_key: function(text, public_key) {
                    return  {
                        text: text,
                        nonce: 'nonce_' + text,
                        public_key: public_key
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
                        'nonce': 'nonce',
                        'public_key': public_key,
                        'private_key': private_key
                    };
                },
                decrypt_data: function(text, nonce, secret_key) {
                    return JSON.stringify({
                        'text': text,
                        'nonce': nonce,
                        'secret_key': secret_key
                    })
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

        it('managerDatastore exists', inject(function (managerDatastore) {
            expect(managerDatastore).toBeDefined();
        }));


        it('get_datastore_overview:force_fresh=true', inject(function (managerDatastore) {

            var force_fresh = true;

            $httpBackend.when('GET', "https://www.psono.pw/server/datastore/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });

            managerDatastore.get_datastore_overview(force_fresh).then(function(data){
                expect(data.status).toEqual(200);
                expect(data.data).toEqual({});
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


        it('get_datastore_overview:force_fresh=false', inject(function (managerDatastore) {

            var force_fresh = true;

            $httpBackend.when('GET', "https://www.psono.pw/server/datastore/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, 'datastore-1'];
                });

            managerDatastore.get_datastore_overview(force_fresh).then(function(data){
                expect(data.status).toEqual(200);
                expect(data.data).toEqual('datastore-1');


                managerDatastore.get_datastore_overview(false).then(function(data){
                    expect(data.status).toEqual(200);
                    expect(data.data).toEqual('datastore-1');
                },function(){
                    // should never be reached
                    expect(true).toBeFalsy();
                });

            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


        it('get_datastore_with_id', inject(function (managerDatastore) {

            var datastore_id = "75c46164-d74b-455c-854f-7008b9a31bf2";

            $httpBackend.when('GET', "https://www.psono.pw/server/datastore/"+ datastore_id + '/').respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {
                        'secret_key': 'datastore_secret_key',
                        'secret_key_nonce': 'datastore_secret_key_nonce',
                        'data ': 'datastore_data',
                        'data_nonce ': 'datastore_data_nonce'
                    }];
                });

            managerDatastore.get_datastore_with_id(datastore_id).then(function(data){
                expect(data).toEqual({
                    secret_key: 'decrypt_secret_key return: datastore_secret_key datastore_secret_key_nonce',
                    datastore_id: '75c46164-d74b-455c-854f-7008b9a31bf2'
                });
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));


        it('create_datastore', inject(function (managerDatastore) {

            var type = "datastore_type";
            var description = "datastore_description";
            var is_default = "is_default";

            $httpBackend.when('PUT', "https://www.psono.pw/server/datastore/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    data = JSON.parse(data.data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.type).toEqual(type);
                    expect(data.description).toEqual(description);
                    expect(data.data).toEqual("");
                    expect(data.data_nonce).toEqual("");
                    expect(data.is_default).toEqual(is_default);
                    expect(data.secret_key).toBeDefined();
                    expect(data.secret_key_nonce).toBeDefined();

                    // return answer
                    return [200, "datastore-1"];
                });

            managerDatastore.create_datastore(type, description, is_default).then(function(data){
                expect(data.status).toEqual(200);
                expect(data.data).toEqual("datastore-1");
            },function(){
                // should never be reached
                expect(true).toBeFalsy();
            });

            $httpBackend.flush();
        }));



    });

}).call();
