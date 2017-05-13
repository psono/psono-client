(function () {
    describe('Controller: OtherCtrl test suite', function () {

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

        var $controller, $rootScope, $httpBackend, $scope, config, cryptoLibrary, storage;

        beforeEach(inject(function($injector){
            // unwrap necessary services
            $controller = $injector.get('$controller'); // $controller is a special service to access controllers
            $rootScope = $injector.get('$rootScope');
            $httpBackend = $injector.get('$httpBackend');
            cryptoLibrary = $injector.get('cryptoLibrary');
            storage = $injector.get('storage');

            $scope = $rootScope.$new();
            $controller('OtherCtrl', {
                $scope: $scope
            });

            config = {
                "backend_servers": [{
                    "title": "Psono.pw",
                    "url": "https://www.psono.pw/server"
                }],
                "base_url": "https://www.psono.pw/",
                "allow_custom_server": true
            };

            $httpBackend.when('GET', "config.json").respond(config);
            $httpBackend.when('GET', "view/index.html").respond({});

            $httpBackend.flush();
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('delete_open_session', function() {

            var session_id = 'a8c92029-a268-4318-9981-cc24a1131638';
            var session_id_remaining= 'ed08aa95-b1cf-4ce2-8ec1-68febb465a65';

            $scope.sessions=[{
                id: session_id
            },{
                id: session_id_remaining
            }];

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/logout/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(data).toEqual({
                        'session_id': session_id
                    });

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });

            $scope.delete_open_session(session_id);
            $httpBackend.flush();

            expect($scope.sessions).toEqual([{
                id: session_id_remaining
            }])
        });

    });

}).call();
