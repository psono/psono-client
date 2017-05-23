(function () {
    describe('Service: managerSecretLink test suite', function () {

        beforeEach(module('psonocli'));

        var token = 'the_session_token';
        var session_secret = 'the_session_secret';

        var mockedManagerBase;
        beforeEach(function () {

            mockedManagerBase = {
                get_session_secret_key: function () {
                    return session_secret
                },
                get_token: function() {
                    return token
                }
            };

            module(function ($provide) {
                $provide.value('managerBase', mockedManagerBase);
            });

        });

        var $httpBackend;
        beforeEach(inject(function($injector){
            // unwrap necessary services
            $httpBackend = $injector.get('$httpBackend');
            cryptoLibrary = $injector.get('cryptoLibrary');

            spyOn(cryptoLibrary, "encrypt_data").and.callFake(function(json_data, session_secret_key) {
                return JSON.parse(json_data);
            });
        }));

        it('managerSecretLink exists', inject(function (managerSecretLink) {
            expect(managerSecretLink).toBeDefined();
        }));

        it('move_secret_link', inject(function (managerSecretLink) {

            var link_id = '6899cc6b-b096-416f-b08a-6019c8cdc6a1';
            var new_parent_share_id = '6899cc6b-b096-416f-b08a-6019c8cdc6a1';
            var new_parent_datastore_id = 'c768179c-abb0-484c-961b-c809ab01bc33';

            $httpBackend.when('POST', "https://www.psono.pw/server/secret/link/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.link_id).toEqual(link_id);
                    expect(data.new_parent_share_id).toEqual(new_parent_share_id);
                    expect(data.new_parent_datastore_id).toEqual(new_parent_datastore_id);

                    // return answer
                    return [200, {}];
                });


            expect(managerSecretLink.move_secret_link(link_id, new_parent_share_id, new_parent_datastore_id)).toBeDefined();
            $httpBackend.flush();
        }));


        it('delete_secret_link', inject(function (managerSecretLink) {

            var link_id = 'e7c62a03-4c66-4b39-b90f-c87e11cdce56';

            $httpBackend.when('DELETE', "https://www.psono.pw/server/secret/link/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.link_id).toEqual(link_id);

                    // return answer
                    return [200, {}];
                });


            expect(managerSecretLink.delete_secret_link(link_id)).toBeDefined();
            $httpBackend.flush();
        }));


        it('on_secret_moved_with_datastore', inject(function (managerSecretLink) {

            var link_id = '6899cc6b-b096-416f-b08a-6019c8cdc6a1';
            var new_parent_share_id = null;
            var new_parent_datastore_id = '242f83c3-6076-46a0-acd3-abbde33429dd';
            // fake datastore
            var parent = {
                'datastore_id': new_parent_datastore_id
            };

            $httpBackend.when('POST', "https://www.psono.pw/server/secret/link/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.link_id).toEqual(link_id);
                    expect(data.new_parent_share_id).toEqual(new_parent_share_id);
                    expect(data.new_parent_datastore_id).toEqual(new_parent_datastore_id);

                    // return answer
                    return [200, {}];
                });


            expect(managerSecretLink.on_secret_moved(link_id, parent)).toBeDefined();
            $httpBackend.flush();
        }));


        it('on_secret_moved_with_share', inject(function (managerSecretLink) {

            var link_id = '6899cc6b-b096-416f-b08a-6019c8cdc6a1';
            var new_parent_share_id = '4243fdc6-8160-4247-909a-9e06b8ff41b5';
            var new_parent_datastore_id = null;
            // fake datastore
            var parent = {
                'share_id': new_parent_share_id
            };

            $httpBackend.when('POST', "https://www.psono.pw/server/secret/link/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.link_id).toEqual(link_id);
                    expect(data.new_parent_share_id).toEqual(new_parent_share_id);
                    expect(data.new_parent_datastore_id).toEqual(new_parent_datastore_id);

                    // return answer
                    return [200, {}];
                });


            expect(managerSecretLink.on_secret_moved(link_id, parent)).toBeDefined();
            $httpBackend.flush();
        }));


        it('on_secret_moved_neither_datastore_nor_share', inject(function (managerSecretLink) {

            var link_id = '6899cc6b-b096-416f-b08a-6019c8cdc6a1';
            // fake datastore
            var parent = {
                // no share_id nor datastore_id as attribute
            };

            managerSecretLink.on_secret_moved(link_id, parent).then(function(){
                    // should never be reached
                    expect(true).toBeFalsy();
                }, function(data){
                    expect(data.hasOwnProperty('response')).toBeTruthy();
                    expect(data.hasOwnProperty('error_data')).toBeTruthy();
                    expect(data['response']).toBe('error');
                    expect(data['error_data']).toBe('Could not determine if its a share or datastore parent');
                }
            );
        }));


        it('on_secret_deleted', inject(function (managerSecretLink) {

            var link_id = 'e7c62a03-4c66-4b39-b90f-c87e11cdce56';

            $httpBackend.when('DELETE', "https://www.psono.pw/server/secret/link/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.link_id).toEqual(link_id);

                    // return answer
                    return [200, {}];
                });


            expect(managerSecretLink.on_secret_deleted(link_id)).toBeDefined();
            $httpBackend.flush();
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });




    });

}).call();
