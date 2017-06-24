(function () {
    describe('Service: managerHost test suite', function () {

        beforeEach(module('psonocli'));

        var $httpBackend;
        var $rootScope;
        beforeEach(inject(function($injector){
            // unwrap necessary services
            $httpBackend = $injector.get('$httpBackend');
            $rootScope = $injector.get('$rootScope');
        }));

        it('helper exists', inject(function (managerHost) {
            expect(managerHost).toBeDefined();
        }));


        it('get_known_hosts empty', inject(function (managerHost, storage) {
            managerHost.update_known_hosts([]);
            expect(managerHost.get_known_hosts()).toEqual([]);
            storage.remove('persistent', storage.find_one('persistent', {'key': 'known_hosts'}));
            expect(managerHost.get_known_hosts()).toEqual([]);
        }));


        it('approve_host: New', inject(function (managerHost) {
            managerHost.update_known_hosts([]);
            expect(managerHost.get_known_hosts()).toEqual([]);
            managerHost.approve_host('http://www.example.com', 'key');
            expect(managerHost.get_known_hosts()).toEqual([{ url: 'http://www.example.com', verify_key: 'key' }]);
        }));


        it('approve_host: Existing one', inject(function (managerHost) {
            managerHost.update_known_hosts([]);
            expect(managerHost.get_known_hosts()).toEqual([]);
            managerHost.approve_host('http://www.example1.com', 'key');
            managerHost.approve_host('http://www.example2.com', 'key2');
            expect(managerHost.get_known_hosts()).toEqual([
                { url: 'http://www.example1.com', verify_key: 'key' },
                { url: 'http://www.example2.com', verify_key: 'key2' }
            ]);
            managerHost.approve_host('http://www.example1.com', 'key3');
            expect(managerHost.get_known_hosts()).toEqual([
                { url: 'http://www.example1.com', verify_key: 'key3' },
                { url: 'http://www.example2.com', verify_key: 'key2' }
            ]);
        }));


        it('approve_host: Existing one', inject(function (managerHost) {
            managerHost.update_known_hosts([
                { url: 'http://www.example1.com', verify_key: 'key' },
                { url: 'http://www.example2.com', verify_key: 'key2' }
            ]);
            managerHost.delete_known_host('key');
            expect(managerHost.get_known_hosts()).toEqual([
                { url: 'http://www.example2.com', verify_key: 'key2' }
            ]);
        }));


        it('approve_host: Existing one', inject(function (managerHost, storage) {
            storage.upsert('config', {'key': 'server', 'value': {
                'url': 'http://www.Example.com'
            }});
            expect(managerHost.get_current_host_url()).toEqual('http://www.example.com');
        }));


        it('check_known_hosts: signature_changed', inject(function (managerHost) {
            managerHost.update_known_hosts([]);
            expect(managerHost.get_known_hosts()).toEqual([]);
            managerHost.approve_host('http://www.example.com', 'key');
            expect(managerHost.check_known_hosts('http://www.example.com', 'key2')).toEqual({
                status: 'signature_changed',
                verify_key_old: 'key'
            });
        }));


        it('check_known_hosts: matched', inject(function (managerHost) {
            managerHost.update_known_hosts([]);
            expect(managerHost.get_known_hosts()).toEqual([]);
            managerHost.approve_host('http://www.example.com', 'key');
            expect(managerHost.check_known_hosts('http://www.example.com', 'key')).toEqual({
                status: 'matched'
            });
        }));


        it('check_known_hosts: not_found', inject(function (managerHost) {
            managerHost.update_known_hosts([]);
            expect(managerHost.get_known_hosts()).toEqual([]);
            managerHost.approve_host('http://www.example.com', 'key');
            expect(managerHost.check_known_hosts('http://www.example2.com', 'key2')).toEqual({
                status: 'not_found'
            });
        }));

        // work in chrome but fail in phantomjs, waiting for chrome 59 and headless support

        // it('check_host: new_server', inject(function (managerHost, apiClient, $q) {
        //
        //     var url = 'https://www.example.com';
        //
        //
        //     spyOn(apiClient, 'info').and.callFake(function() {
        //         var query_response = {
        //             data: {
        //                 "verify_key": "a8e3d0004925352d78b967b33d6cfef67d364cf1aaf85e66b75404b98345f762",
        //                 "signature": "4b0fa89692069bd8714d88298d32ac276ca5c35f4176c890d1d757300233504b83753be199480de949d7d6567526b23ccbe514c53934a477004bbee06d5dd40b",
        //                 "info": "{\"log_audit\": true, \"version\": \"1.0.0\", \"api\": 1, \"public_key\": \"2e6bbc322f7b6c16de12bd9cf1bc3281f0d0e66e741a27678de8b778fdfbf249\"}"
        //             }
        //         };
        //         var deferred = $q.defer();
        //         deferred.resolve(query_response);
        //         return deferred.promise;
        //     });
        //     managerHost.check_host({url: url}).then(function(data){
        //         expect(data).toEqual({
        //             server_url: url,
        //             status: 'new_server',
        //             verify_key: 'a8e3d0004925352d78b967b33d6cfef67d364cf1aaf85e66b75404b98345f762',
        //             info: {
        //                 log_audit: true,
        //                 version: '1.0.0',
        //                 api: 1,
        //                 public_key: '2e6bbc322f7b6c16de12bd9cf1bc3281f0d0e66e741a27678de8b778fdfbf249'
        //             }
        //         });
        //     }, function (data) {
        //         console.log(data);
        //         // should never be reached
        //         expect(true).toBeFalsy();
        //     });
        //     $rootScope.$digest();
        // }));
        //
        //
        // it('check_host: invalid_signature', inject(function (managerHost, apiClient, $q) {
        //
        //     var url = 'https://www.example.com';
        //
        //     managerHost.approve_host(url, 'key');
        //
        //     spyOn(apiClient, 'info').and.callFake(function() {
        //         var query_response = {
        //             data: {
        //                 "verify_key": "a8e3d0004925352d78b967b33d6cfef67d364cf1aaf85e66b75404b98345f762",
        //                 "signature": "4b0fa89692069bd8714d88298d32ac276ca5c35f4176c890d1d757300233504b83753be199480de949d7d6567526b23ccbe514c53934a477004bbee06d5dd40c",
        //                 "info": "{\"log_audit\": true, \"version\": \"1.0.0\", \"api\": 1, \"public_key\": \"2e6bbc322f7b6c16de12bd9cf1bc3281f0d0e66e741a27678de8b778fdfbf249\"}"
        //             }
        //         };
        //         var deferred = $q.defer();
        //         deferred.resolve(query_response);
        //         return deferred.promise;
        //     });
        //     managerHost.check_host({url: url}).then(function(data){
        //         expect(data).toEqual({
        //             server_url: url,
        //             status: 'invalid_signature',
        //             verify_key: undefined,
        //             info: {
        //                 log_audit: true,
        //                 version: '1.0.0',
        //                 api: 1,
        //                 public_key: '2e6bbc322f7b6c16de12bd9cf1bc3281f0d0e66e741a27678de8b778fdfbf249'
        //             }
        //         });
        //     }, function (data) {
        //         console.log(data);
        //         // should never be reached
        //         expect(true).toBeFalsy();
        //     });
        //     $rootScope.$digest();
        //
        // }));
        //
        //
        // it('check_host: matched', inject(function (managerHost, apiClient, $q) {
        //
        //     var url = 'https://www.example.com';
        //
        //     managerHost.approve_host(url, 'a8e3d0004925352d78b967b33d6cfef67d364cf1aaf85e66b75404b98345f762');
        //
        //     spyOn(apiClient, 'info').and.callFake(function() {
        //         var query_response = {
        //             data: {
        //                 "verify_key": "a8e3d0004925352d78b967b33d6cfef67d364cf1aaf85e66b75404b98345f762",
        //                 "signature": "4b0fa89692069bd8714d88298d32ac276ca5c35f4176c890d1d757300233504b83753be199480de949d7d6567526b23ccbe514c53934a477004bbee06d5dd40b",
        //                 "info": "{\"log_audit\": true, \"version\": \"1.0.0\", \"api\": 1, \"public_key\": \"2e6bbc322f7b6c16de12bd9cf1bc3281f0d0e66e741a27678de8b778fdfbf249\"}"
        //             }
        //         };
        //         var deferred = $q.defer();
        //         deferred.resolve(query_response);
        //         return deferred.promise;
        //     });
        //     managerHost.check_host({url: url}).then(function(data){
        //         expect(data).toEqual({
        //             server_url: url,
        //             status: 'matched',
        //             verify_key: 'a8e3d0004925352d78b967b33d6cfef67d364cf1aaf85e66b75404b98345f762',
        //             info: {
        //                 log_audit: true,
        //                 version: '1.0.0',
        //                 api: 1,
        //                 public_key: '2e6bbc322f7b6c16de12bd9cf1bc3281f0d0e66e741a27678de8b778fdfbf249'
        //             }
        //         });
        //     }, function (data) {
        //         console.log(data);
        //         // should never be reached
        //         expect(true).toBeFalsy();
        //     });
        //     $rootScope.$digest();
        // }));
        //
        //
        // it('check_host: signature_changed', inject(function (managerHost, apiClient, $q) {
        //
        //     var url = 'https://www.example.com';
        //
        //     managerHost.approve_host(url, 'a8e3d0004925352d78b967b33d6cfef67d364cf1aaf85e66b75404b98345f763');
        //
        //     spyOn(apiClient, 'info').and.callFake(function() {
        //         var query_response = {
        //             data: {
        //                 "verify_key": "a8e3d0004925352d78b967b33d6cfef67d364cf1aaf85e66b75404b98345f762",
        //                 "signature": "4b0fa89692069bd8714d88298d32ac276ca5c35f4176c890d1d757300233504b83753be199480de949d7d6567526b23ccbe514c53934a477004bbee06d5dd40b",
        //                 "info": "{\"log_audit\": true, \"version\": \"1.0.0\", \"api\": 1, \"public_key\": \"2e6bbc322f7b6c16de12bd9cf1bc3281f0d0e66e741a27678de8b778fdfbf249\"}"
        //             }
        //         };
        //         var deferred = $q.defer();
        //         deferred.resolve(query_response);
        //         return deferred.promise;
        //     });
        //     managerHost.check_host({url: url}).then(function (data) {
        //         expect(data).toEqual({
        //             server_url: url,
        //             status: 'signature_changed',
        //             verify_key: 'a8e3d0004925352d78b967b33d6cfef67d364cf1aaf85e66b75404b98345f762',
        //             verify_key_old: 'a8e3d0004925352d78b967b33d6cfef67d364cf1aaf85e66b75404b98345f763',
        //             info: {
        //                 log_audit: true,
        //                 version: '1.0.0',
        //                 api: 1,
        //                 public_key: '2e6bbc322f7b6c16de12bd9cf1bc3281f0d0e66e741a27678de8b778fdfbf249'
        //             }
        //         });
        //     }, function (data) {
        //         console.log(data);
        //         // should never be reached
        //         expect(true).toBeFalsy();
        //     });
        //     $rootScope.$digest();
        // }));


    });

}).call();
