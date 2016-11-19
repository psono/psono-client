(function () {
    describe('Controller: PanelController test suite', function () {

        beforeEach(module('psonocli'));

        var $controller, $rootScope, $httpBackend, $scope, $location, storage;


        var fake_user_token = 'my-user-token';
        var fake_session_secret_key = 'my-user-token';
        var fake_user_private_key = 'my-user-token';
        var fake_user_secret_key = 'my-user-token';
        var dummy_not_blocked = 'my-user-token';

        beforeEach(inject(function($injector){
            // unwrap necessary services
            $controller = $injector.get('$controller'); // $controller is a special service to access controllers
            $rootScope = $injector.get('$rootScope');
            $location = $injector.get('$location');
            storage = $injector.get('storage');
            $httpBackend = $injector.get('$httpBackend');

            $scope = $rootScope.$new();
            $controller('PanelController', {
                $scope: $scope
            });

            spyOn(storage, "find_one").and.callFake(function(db, query) {
                switch (query['key']) {
                    case 'user_token':
                        return { 'value': fake_user_token };
                    case 'session_secret_key':
                        return { 'value': fake_session_secret_key };
                    case 'user_private_key':
                        return { 'value': fake_user_private_key };
                    case 'user_secret_key':
                        return { 'value': fake_user_secret_key };
                    case 'dummy_not_blocked':
                        return { 'value': dummy_not_blocked };
                    default:
                        return null;
                }
            });



            $httpBackend.when('GET', "https://www.psono.pw/server/datastore/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    // console.log(data);
                    // console.log(headers);
                    // console.log(params);

                    expect(headers.Authorization).toEqual('Token b5fdb5a2f2a8f84d4378c314eec433e0d04e11e034290c82efee6574ebf42e73429c6bec12f23818a7be44f14c17d21d63c9b99d322b68d51720e4bdc0a2612e');

                    return [200, {'datastores': [
                        {
                            'description': "default",
                            'id': "574404fa-2257-4a93-a078-64da6a6e7287",
                            'type': "user"
                        }, {
                            'description': "default",
                            'id': "5fb571e3-8d08-42d6-8105-fee8f9a0099b",
                            'type': "password"
                        }, {
                            'description': "key-value-settings",
                            'id': "1e2d915a-08df-4669-b6bd-903c7260604",
                            'type': "settings"
                        }
                    ]}];
                });

            $httpBackend.when('GET', "https://www.psono.pw/server/datastore/5fb571e3-8d08-42d6-8105-fee8f9a0099b/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);
                    console.log(data);
                    console.log(headers);
                    console.log(params);

                    expect(headers.Authorization).toEqual('Token b5fdb5a2f2a8f84d4378c314eec433e0d04e11e034290c82efee6574ebf42e73429c6bec12f23818a7be44f14c17d21d63c9b99d322b68d51720e4bdc0a2612e');

                    // TODO return real data
                    return [200, {
                        'data': '',
                        'data_nonce': '',
                        'description': 'default',
                        'secret_key': '',
                        'secret_key_nonce': '',
                        'type': 'password'
                    }];
                });
            $httpBackend.when('GET', "view/index.html").respond({});

            $httpBackend.flush();
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('version load', function() {

        });

    });

}).call();
