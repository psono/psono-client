(function () {
    describe('Service: managerDatastore test suite', function () {

        beforeEach(module('psonocli'));

        it('managerDatastore exists', inject(function (managerDatastore) {
            expect(managerDatastore).toBeDefined();
        }));

        // var $httpBackend;
        //
        // beforeEach(inject(function($injector){
        //     // unwrap necessary services
        //     $httpBackend = $injector.get('$httpBackend');
        // }));
        //
        //
        // it('parse_url www domain', inject(function (managerDatastore) {
        //
        //
        //     var onSuccess = function (result) {
        //         console.log(result);
        //
        //         return result
        //     };
        //     var onError = function (result) {
        //         console.log(result);
        //         // pass
        //     };
        //
        //     $httpBackend.when('GET', "https://www.psono.pw/server/datastore/").respond({'datastores': [
        //         {
        //             'description': "default",
        //             'id': "574404fa-2257-4a93-a078-64da6a6e7287",
        //             'type': "user"
        //         }, {
        //             'description': "default",
        //             'id': "5fb571e3-8d08-42d6-8105-fee8f9a0099b",
        //             'type': "password"
        //         }, {
        //             'description': "key-value-settings",
        //             'id': "1e2d915a-08df-4669-b6bd-903c7260604",
        //             'type': "settings"
        //         }
        //     ]});
        //
        //     managerDatastore.get_datastore('my-type', 'my-description').then(onSuccess, onError);
        //     $httpBackend.flush();
        //
        //     // expect().toEqual('');
        // }));
    });

}).call();
