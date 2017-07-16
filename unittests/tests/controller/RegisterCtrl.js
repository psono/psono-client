(function () {
    describe('Controller: RegisterCtrl test suite', function () {

        beforeEach(module('psonocli'));

        var $controller, $rootScope, $httpBackend, $scope, config, cryptoLibrary, storage;

        beforeEach(inject(function($injector){
            // unwrap necessary services
            $controller = $injector.get('$controller'); // $controller is a special service to access controllers
            $rootScope = $injector.get('$rootScope');
            $httpBackend = $injector.get('$httpBackend');
            cryptoLibrary = $injector.get('cryptoLibrary');
            storage = $injector.get('storage');

            $scope = $rootScope.$new();
            $controller('RegisterCtrl', {
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
            $httpBackend.when('GET', "view/datastore.html").respond({});

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

        it('register', function() {

            $scope.registerFormEmail = "register@example.com";
            $scope.registerFormUsername = "register";
            $scope.registerFormPassword = "my-registration-password";
            $scope.registerFormPasswordRepeat = "my-registration-password";

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/register/").respond(
                function(method, url, data) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(data.email).toEqual($scope.registerFormEmail);
                    expect(data.username).toEqual($scope.registerFormUsername + '@psono.pw');
                    expect(data.authkey).toEqual('24902e051d5e4413fc98eccf3f7773d90c298a02b3ba851ca8ac1313e403118088617ab28f6ad26639551f1db73d4f15a5ba8997182019d3ac3fb50872b6f4e7');

                    expect(data.public_key.length).toEqual(64);
                    expect(data.private_key.length).toEqual(160);
                    expect(data.private_key_nonce.length).toEqual(48);
                    expect(data.secret_key.length).toEqual(160);
                    expect(data.secret_key_nonce.length).toEqual(48);
                    expect(data.user_sauce.length).toEqual(64);
                    expect(data.base_url).toEqual(config['base_url']);

                    return [201, {"success": "Successfully registered."}];
                });

            $scope.register($scope.registerFormEmail, $scope.registerFormUsername, $scope.registerFormPassword, $scope.registerFormPasswordRepeat);
            $httpBackend.flush();

        });

    });

}).call();
