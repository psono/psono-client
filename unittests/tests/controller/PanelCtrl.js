(function () {
    describe('Controller: PanelCtrl test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

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
            $controller('PanelCtrl', {
                $scope: $scope
            });

            spyOn(storage, "find_key").and.callFake(function(db, key) {
                switch (key) {
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

                    expect(headers.Authorization).toEqual('Token ');

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

            $httpBackend.when('GET', "view/datastore.html").respond({});

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
