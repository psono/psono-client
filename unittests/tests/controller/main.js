(function () {
    describe('Controller: MainController test suite', function () {

        beforeEach(module('passwordManagerApp'));

        var $controller, $rootScope, $httpBackend, $scope, $location, version;

        beforeEach(inject(function($injector){
            // unwrap necessary services
            $controller = $injector.get('$controller'); // $controller is a special service to access controllers
            $rootScope = $injector.get('$rootScope');
            $location = $injector.get('$location');
            $httpBackend = $injector.get('$httpBackend');

            $scope = $rootScope.$new();
            $controller('MainController', {
                $scope: $scope
            });

            version = '1.2.3.4';

            $httpBackend.when('GET', "./VERSION.txt").respond(version);

            $httpBackend.when('GET', "view/index.html").respond({});

            $httpBackend.flush();
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('version load', function() {
            expect($scope.version).toEqual(version);
        });

        it('getLinkState', function() {
            // $location.path() == ''
            expect($location.path()).toEqual('');
            expect($scope.getLinkState('/')).toEqual('active');
            expect($scope.getLinkState('/share/pendingshares')).toEqual('');

            spyOn($location, 'path').and.returnValue('/share/pendingsharest');
            expect($scope.getLinkState('/share/pendingshares')).toEqual('active');
        });

    });

}).call();
