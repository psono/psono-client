(function () {
    describe('Service: browserClient test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        var mockedWindow;
        beforeEach(function () {
            mockedWindow = {
                open: function(url, target) {},
                location: {
                    href: 'asdf'
                }
            };

            module(function ($provide) {
                $provide.value('$window', mockedWindow);
            });

        });

        var $httpBackend;
        beforeEach(inject(function($injector){
            // unwrap necessary services
            $httpBackend = $injector.get('$httpBackend');
            $httpBackend.when('GET', "view/datastore.html").respond({});
        }));

        it('browserClient exists', inject(function (browserClient) {
            expect(browserClient).toBeDefined();
        }));

        it('browserClient:open_tab', inject(function (browserClient, $window) {
            var url = 'abcdef';
            spyOn($window, 'open');
            browserClient.open_tab(url);
            expect($window.open).toHaveBeenCalledWith(url, '_blank');
        }));

        it('browserClient:get_active_tab_url', inject(function ($rootScope, browserClient) {
            var called = false;
            browserClient.get_active_tab_url().then(function(url) {
                expect(url).toBe('asdf');
                called = true;
            });
            $rootScope.$digest();
            expect(called).toBe(true);
        }));

        it('browserClient:test_background_page', inject(function ($rootScope, browserClient) {
            expect(browserClient.test_background_page()).toBeFalsy();
        }));

        it('browserClient:emit_sec', inject(function ($rootScope, browserClient) {
            browserClient.emit_sec()
        }));

        it('browserClient:disable_browser_password_saving ', inject(function (browserClient) {

            browserClient.disable_browser_password_saving ().then(function(data){
                expect(data).toEqual('nothing done');
            },function(data){
                // should never be reached
                expect(true).toBeFalsy();
            });
        }));
    });

}).call();
