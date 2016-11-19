(function () {
    describe('Controller: LoginController test suite', function () {

        beforeEach(module('psonocli'));

        var $controller, $rootScope, $httpBackend, $scope, config, cryptoLibrary, storage;

        beforeEach(inject(function($injector){
            // unwrap necessary services
            $controller = $injector.get('$controller'); // $controller is a special service to access controllers
            $rootScope = $injector.get('$rootScope');
            $httpBackend = $injector.get('$httpBackend');
            cryptoLibrary = $injector.get('cryptoLibrary');
            storage = $injector.get('storage');

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

            $scope = $rootScope.$new();
            $controller('LoginController', {
                $scope: $scope
            });

            $httpBackend.flush();
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('config load', function() {
            expect($scope.servers).toEqual(config['backend_servers']);
            expect($scope.filtered_servers).toEqual(config['backend_servers']);
            expect($scope.selected_server).toEqual(config['backend_servers'][0]);
            expect($scope.selected_server_title).toEqual(config['backend_servers'][0].title);
            expect($scope.selected_server_url).toEqual(config['backend_servers'][0].url);
            expect($scope.selected_server_domain).toEqual('psono.pw');
        });

        it('select_server', function() {
            var new_server = {
                'title': 'my title',
                'url': 'https://www.example.com/server'
            };
            $scope.select_server(new_server);

            expect($scope.selected_server).toEqual(new_server);
            expect($scope.selected_server_title).toEqual(new_server.title);
            expect($scope.selected_server_url).toEqual(new_server.url);
            expect($scope.selected_server_domain).toEqual('example.com');
        });

        it('changing', function() {
            var url = 'https://www.example.com/server';
            $scope.changing(url);

            expect($scope.selected_server).toEqual({
                'title': url,
                'url': url
            });
            expect($scope.selected_server_url).toEqual(url);
            expect($scope.selected_server_domain).toEqual('example.com');
        });

        it('login', function() {

            $scope.loginFormUsername = 'test-username';
            $scope.loginFormPassword = 'test-password';

            var user_validator = cryptoLibrary.generate_secret_key();;
            var user_id = 'e2e85166-41bb-4a27-a99f-c73864182c14';
            var user_email = 'blub@example.com';
            var user_token = 'b5fdb5a2f2a8f84d4378c314eec433e0d04e11e034290c82efee6574ebf42e73429c6bec12f23818a7be44f14c17d21d63c9b99d322b68d51720e4bdc0a2612e';


            var user_sauce = '534152f8d93abcc89f855222d348ed042eb31541b2c8c0a768036a22a29d761b';
            var session_key_pair = cryptoLibrary.generate_public_private_keypair();
            var user_key_pair = cryptoLibrary.generate_public_private_keypair();
            var user_public_key = user_key_pair.public_key;
            var user_private_key = user_key_pair.private_key;
            var user_private_key_enc = cryptoLibrary.encrypt_secret(user_key_pair.private_key, $scope.loginFormPassword, user_sauce);
            var session_secret_key = cryptoLibrary.generate_secret_key();

            var user_secret_key = cryptoLibrary.generate_secret_key();
            var user_secret_key_enc = cryptoLibrary.encrypt_secret(user_secret_key, $scope.loginFormPassword, user_sauce);
            var user_validator_enc = cryptoLibrary.encrypt_data_public_key(user_validator, user_public_key, session_key_pair.private_key);

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/login/").respond(
                function(method, url, data) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    expect(data.username).toEqual($scope.loginFormUsername + '@psono.pw');
                    expect(data.authkey).toEqual('1b03cedd5c1d7816283bfd8ade4b7ca0d1e5e773bb54ceaa2d706a7a9efba6944404141e4944db7da01caa3ec8d53054f66158858dcef5f1934ea7d590198f36');

                    var session_secret_key_enc = cryptoLibrary.encrypt_data_public_key(session_secret_key, data.public_key, session_key_pair.private_key);

                    // return answer
                    return [200, {
                        'session_public_key': session_key_pair.public_key,
                        'session_secret_key': session_secret_key_enc.text,
                        'session_secret_key_nonce': session_secret_key_enc.nonce,
                        'token': user_token,
                        'user': {
                            'private_key': user_private_key_enc.text,
                            'private_key_nonce': user_private_key_enc.nonce,
                            'public_key': user_public_key,
                            'user_sauce': user_sauce
                        },
                        'user_validator': user_validator_enc.text,
                        'user_validator_nonce': user_validator_enc.nonce
                    }];
                });

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/activate-token/").respond(
                function(method, url, data) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    var verification = cryptoLibrary.decrypt_data(
                        data.verification,
                        data.verification_nonce,
                        session_secret_key
                    );

                    expect(data.token).toEqual(user_token);
                    expect(verification).toEqual(user_validator);

                    // return answer
                    return [200, {
                        "user": {
                            "id": user_id,
                            "email": user_email,
                            "secret_key": user_secret_key_enc.text,
                            "secret_key_nonce": user_secret_key_enc.nonce
                        }
                    }];
                });

            $scope.login($scope.loginFormUsername, $scope.loginFormPassword);
            $httpBackend.flush();

            expect(storage.find_one('config', {'key': 'user_id'})['value']).toEqual(user_id);
            expect(storage.find_one('config', {'key': 'user_token'})['value']).toEqual(user_token);
            expect(storage.find_one('config', {'key': 'user_email'})['value']).toEqual(user_email);
            expect(storage.find_one('config', {'key': 'session_secret_key'})['value']).toEqual(session_secret_key);
            expect(storage.find_one('config', {'key': 'user_public_key'})['value']).toEqual(user_public_key);
            expect(storage.find_one('config', {'key': 'user_private_key'})['value']).toEqual(user_private_key);
            expect(storage.find_one('config', {'key': 'user_secret_key'})['value']).toEqual(user_secret_key);
            expect(storage.find_one('config', {'key': 'user_sauce'})['value']).toEqual(user_sauce);

        });

    });

}).call();
