(function () {
    describe('Service: managerShareLink test suite', function () {

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
        }));

        it('managerShareLink exists', inject(function (managerShareLink) {
            expect(managerShareLink).toBeDefined();
        }));


        it('create_share_link', inject(function (managerShareLink) {

            var link_id = '8b1aaa0d-c63c-4bbd-be3b-84beceb69a9f';
            var share_id = '2efebaa8-1dc6-43bf-805d-6575b2f01f4b';
            var parent_share_id = '8c35872b-9323-4ce4-a5f3-fa851063628b';
            var parent_datastore_id = '87427b23-7d83-4fa0-8f32-5d4d128a6ce9';

            $httpBackend.when('PUT', "https://www.psono.pw/server/share/link/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.link_id).toEqual(link_id);
                    expect(data.share_id).toEqual(share_id);
                    expect(data.parent_share_id).toEqual(parent_share_id);
                    expect(data.parent_datastore_id).toEqual(parent_datastore_id);

                    // return answer
                    return [200, {}];
                });


            expect(managerShareLink.create_share_link(link_id, share_id, parent_share_id, parent_datastore_id)).toBeDefined();
            $httpBackend.flush();
        }));


        it('move_share_link', inject(function (managerShareLink) {

            var link_id = '3f172f90-ec49-421e-aa7c-036fabb0e68e';
            var new_parent_share_id = '6116d3ca-75de-4113-baa9-d5116f7cf96e';
            var new_parent_datastore_id = '4037b3ce-1ab9-4455-9591-f8ff7db7f856';

            $httpBackend.when('POST', "https://www.psono.pw/server/share/link/").respond(
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


            expect(managerShareLink.move_share_link(link_id, new_parent_share_id, new_parent_datastore_id)).toBeDefined();
            $httpBackend.flush();
        }));


        it('delete_share_link', inject(function (managerShareLink) {

            var link_id = '8482d452-ef99-46cd-bad9-186f0c6193e7';

            $httpBackend.when('DELETE', "https://www.psono.pw/server/share/link/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.link_id).toEqual(link_id);

                    // return answer
                    return [200, {}];
                });


            expect(managerShareLink.delete_share_link(link_id)).toBeDefined();
            $httpBackend.flush();
        }));


        it('on_share_moved_with_datastore', inject(function (managerShareLink) {

            var link_id = 'f1654f03-3415-4cd8-ad49-960300636f5f';
            var new_parent_share_id = null;
            var new_parent_datastore_id = '6cb1714c-e6ec-4fec-9203-2904171539b3';
            // fake datastore
            var parent = {
                'datastore_id': new_parent_datastore_id
            };

            $httpBackend.when('POST', "https://www.psono.pw/server/share/link/").respond(
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


            expect(managerShareLink.on_share_moved(link_id, parent)).toBeDefined();
            $httpBackend.flush();
        }));


        it('on_share_moved_with_store', inject(function (managerShareLink) {

            var link_id = '0838264a-5d7b-4a5f-9150-09890c5dfdea';
            var new_parent_share_id = 'b765577c-5183-4ef1-913f-3571d6a3c918';
            var new_parent_datastore_id = null;
            // fake datastore
            var parent = {
                'share_id': new_parent_share_id
            };

            $httpBackend.when('POST', "https://www.psono.pw/server/share/link/").respond(
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


            expect(managerShareLink.on_share_moved(link_id, parent)).toBeDefined();
            $httpBackend.flush();
        }));


        it('on_share_moved_neither_datastore_nor_share', inject(function (managerShareLink) {

            var link_id = 'bd970434-d644-4e7b-b050-8ec591ad4c13';
            // fake datastore
            var parent = {
                // no share_id nor datastore_id as attribute
            };

            managerShareLink.on_share_moved(link_id, parent).then(function(){
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


        it('on_share_deleted', inject(function (managerShareLink) {

            var link_id = '6b8e2d50-8684-4026-a5c4-e03a0fdbb2f7';

            $httpBackend.when('DELETE', "https://www.psono.pw/server/share/link/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.link_id).toEqual(link_id);

                    // return answer
                    return [200, {}];
                });


            expect(managerShareLink.on_share_deleted(link_id)).toBeDefined();
            $httpBackend.flush();
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

    });

}).call();
