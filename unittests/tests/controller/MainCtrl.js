(function () {
    describe('Controller: MainCtrl test suite', function () {

        beforeEach(module('psonocli'));

        var $controller, $rootScope, $httpBackend, $scope, $location, version;

        beforeEach(inject(function($injector){
            // unwrap necessary services
            $controller = $injector.get('$controller'); // $controller is a special service to access controllers
            $rootScope = $injector.get('$rootScope');
            $location = $injector.get('$location');
            $httpBackend = $injector.get('$httpBackend');

            $scope = $rootScope.$new();
            $controller('MainCtrl', {
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

        it('get_link_state', function() {
            // $location.path() == ''
            expect($location.path()).toEqual('');
            expect($scope.get_link_state('/')).toEqual('active');
            expect($scope.get_link_state('/share/pendingshares')).toEqual('');

            spyOn($location, 'path').and.returnValue('/share/pendingsharest');
            expect($scope.get_link_state('/share/pendingshares')).toEqual('active');
        });

    });

}).call();
