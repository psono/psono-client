(function () {
    describe('Controller: ActivationCtrl test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        var $controller, $rootScope, $httpBackend, $scope, config, cryptoLibrary, storage;

        beforeEach(inject(function($injector){
            // unwrap necessary services
            $controller = $injector.get('$controller'); // $controller is a special service to access controllers
            $rootScope = $injector.get('$rootScope');
            $httpBackend = $injector.get('$httpBackend');
            cryptoLibrary = $injector.get('cryptoLibrary');
            storage = $injector.get('storage');

            $scope = $rootScope.$new();
            $controller('ActivationCtrl', {
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

        it('activate_code', function() {

            var activation_code = '1234567890';

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/verify-email/").respond(
                function(method, url, data) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(data.activation_code).toEqual(activation_code);

                    return [200, {"success": "Successfully activated."}];
                });

            $scope.activate_code(activation_code);
            $httpBackend.flush();
        });

    });

}).call();
