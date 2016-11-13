(function () {
    describe('Service: apiClient test suite', function () {

        beforeEach(module('passwordManagerApp'));

        var $httpBackend, cryptoLibrary;

        beforeEach(inject(function($injector){
            // unwrap necessary services
            $httpBackend = $injector.get('$httpBackend');
            cryptoLibrary = $injector.get('cryptoLibrary');
        }));

        it('apiClient exists', inject(function (apiClient) {
            expect(apiClient).toBeDefined();
        }));

        it('login', inject(function (apiClient) {

            var username = 'a-username';
            var authkey = 'a-authkey';
            var public_key = 'a-public_key';

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/login/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(data.username).toEqual(username);
                    expect(data.public_key).toEqual(public_key);
                    expect(data.authkey).toEqual(authkey);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.login(username, authkey, public_key)).toBeDefined();

            $httpBackend.flush();
        }));

        it('activate_token', inject(function (apiClient) {

            var token = 'a-token';
            var verification = 'a-verification';
            var verification_nonce = 'a-verification_nonce';

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/activate-token/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(data.token).toEqual(token);
                    expect(data.verification).toEqual(verification);
                    expect(data.verification_nonce).toEqual(verification_nonce);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.activate_token(token, verification, verification_nonce)).toBeDefined();

            $httpBackend.flush();
        }));

        it('logout', inject(function (apiClient) {

            var token = 'a-token';

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/logout/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.logout(token)).toBeDefined();

            $httpBackend.flush();
        }));

        it('register', inject(function (apiClient) {

            var email = 'a-email';
            var username = 'a-username';
            var authkey = 'a-authkey';
            var public_key = 'a-public_key';
            var private_key = 'a-private_key';
            var private_key_nonce = 'a-private_key_nonce';
            var secret_key = 'a-secret_key';
            var secret_key_nonce = 'a-secret_key_nonce';
            var user_sauce = 'a-user_sauce';
            var base_url = 'a-base_url';

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/register/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(data.email).toEqual(email);
                    expect(data.username).toEqual(username);
                    expect(data.authkey).toEqual(authkey);
                    expect(data.public_key).toEqual(public_key);
                    expect(data.private_key).toEqual(private_key);
                    expect(data.private_key_nonce).toEqual(private_key_nonce);
                    expect(data.secret_key).toEqual(secret_key);
                    expect(data.secret_key_nonce).toEqual(secret_key_nonce);
                    expect(data.user_sauce).toEqual(user_sauce);
                    expect(data.base_url).toEqual(base_url);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.register(email, username, authkey, public_key, private_key, private_key_nonce, secret_key, secret_key_nonce, user_sauce, base_url)).toBeDefined();

            $httpBackend.flush();
        }));

        it('verify_email', inject(function (apiClient) {

            var activation_code = 'a-activation_code';

            $httpBackend.when('POST', "https://www.psono.pw/server/authentication/verify-email/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(data.activation_code).toEqual(activation_code);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.verify_email(activation_code)).toBeDefined();

            $httpBackend.flush();
        }));

        it('update_user', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var email = 'a-email';
            var authkey = 'a-authkey';
            var authkey_old = 'a-authkey_old';
            var private_key = 'a-private_key';
            var private_key_nonce = 'a-private_key_nonce';
            var secret_key = 'a-secret_key';
            var secret_key_nonce = 'a-secret_key_nonce';
            var user_sauce = 'a-user_sauce';

            $httpBackend.when('POST', "https://www.psono.pw/server/user/update/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.email).toEqual(email);
                    expect(data.authkey).toEqual(authkey);
                    expect(data.authkey_old).toEqual(authkey_old);
                    expect(data.private_key).toEqual(private_key);
                    expect(data.private_key_nonce).toEqual(private_key_nonce);
                    expect(data.secret_key).toEqual(secret_key);
                    expect(data.secret_key_nonce).toEqual(secret_key_nonce);
                    expect(data.user_sauce).toEqual(user_sauce);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.update_user(token, session_secret_key, email, authkey, authkey_old, private_key, private_key_nonce, secret_key, secret_key_nonce, user_sauce)).toBeDefined();

            $httpBackend.flush();
        }));

        it('read_datastore', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var datastore_id = 'a-datastore_id';

            $httpBackend.when('GET', "https://www.psono.pw/server/datastore/a-datastore_id/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.read_datastore(token, session_secret_key, datastore_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('create_datastore', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var type = 'a-type';
            var description = 'a-description';
            var encrypted_data = 'a-encrypted_data';
            var encrypted_data_nonce = 'a-encrypted_data_nonce';
            var encrypted_data_secret_key = 'a-encrypted_data_secret_key';
            var encrypted_data_secret_key_nonce = 'a-encrypted_data_secret_key_nonce';

            $httpBackend.when('PUT', "https://www.psono.pw/server/datastore/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.type).toEqual(type);
                    expect(data.description).toEqual(description);
                    expect(data.data).toEqual(encrypted_data);
                    expect(data.data_nonce).toEqual(encrypted_data_nonce);
                    expect(data.secret_key).toEqual(encrypted_data_secret_key);
                    expect(data.secret_key_nonce).toEqual(encrypted_data_secret_key_nonce);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.create_datastore(token, session_secret_key, type, description, encrypted_data, encrypted_data_nonce, encrypted_data_secret_key, encrypted_data_secret_key_nonce)).toBeDefined();

            $httpBackend.flush();
        }));

        it('write_datastore', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var datastore_id = 'a-datastore_id';
            var encrypted_data = 'a-encrypted_data';
            var encrypted_data_nonce = 'a-encrypted_data';
            var encrypted_data_secret_key = 'a-encrypted_data_secret_key';
            var encrypted_data_secret_key_nonce = 'a-encrypted_data_secret_key_nonce';

            $httpBackend.when('POST', "https://www.psono.pw/server/datastore/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.datastore_id).toEqual(datastore_id);
                    expect(data.data).toEqual(encrypted_data);
                    expect(data.data_nonce).toEqual(encrypted_data_nonce);
                    expect(data.secret_key).toEqual(encrypted_data_secret_key);
                    expect(data.secret_key_nonce).toEqual(encrypted_data_secret_key_nonce);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.write_datastore(token, session_secret_key, datastore_id, encrypted_data, encrypted_data_nonce,
                encrypted_data_secret_key, encrypted_data_secret_key_nonce)).toBeDefined();

            $httpBackend.flush();
        }));

        it('read_secret', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var secret_id = 'a-secret_id';

            $httpBackend.when('GET', "https://www.psono.pw/server/secret/a-secret_id/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.read_secret(token, session_secret_key, secret_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('create_secret', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var encrypted_data = 'a-datastore_id';
            var encrypted_data_nonce = 'a-encrypted_data';
            var link_id = 'a-link_id';
            var parent_datastore_id = 'a-parent_datastore_id';
            var parent_share_id = 'a-parent_share_id';

            $httpBackend.when('PUT', "https://www.psono.pw/server/secret/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.data).toEqual(encrypted_data);
                    expect(data.data_nonce).toEqual(encrypted_data_nonce);
                    expect(data.link_id).toEqual(link_id);
                    expect(data.parent_datastore_id).toEqual(parent_datastore_id);
                    expect(data.parent_share_id).toEqual(parent_share_id);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.create_secret(token, session_secret_key, encrypted_data, encrypted_data_nonce, link_id, parent_datastore_id, parent_share_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('write_secret', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var secret_id = 'a-secret_id';
            var encrypted_data = 'a-encrypted_data';
            var encrypted_data_nonce = 'a-encrypted_data_nonce';

            $httpBackend.when('POST', "https://www.psono.pw/server/secret/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.secret_id).toEqual(secret_id);
                    expect(data.data).toEqual(encrypted_data);
                    expect(data.data_nonce).toEqual(encrypted_data_nonce);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.write_secret(token, session_secret_key, secret_id, encrypted_data, encrypted_data_nonce)).toBeDefined();

            $httpBackend.flush();
        }));

        it('move_secret_link', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var link_id = 'a-link_id';
            var new_parent_share_id = 'a-new_parent_share_id';
            var new_parent_datastore_id = 'a-new_parent_datastore_id';

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

            expect(apiClient.move_secret_link(token, session_secret_key, link_id, new_parent_share_id, new_parent_datastore_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('delete_secret_link', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var link_id = 'a-link_id';

            $httpBackend.when('DELETE', "https://www.psono.pw/server/secret/link/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.link_id).toEqual(link_id);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.delete_secret_link(token, session_secret_key, link_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('read_share', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var share_id = 'a-share_id';

            $httpBackend.when('GET', "https://www.psono.pw/server/share/a-share_id/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.read_share(token, session_secret_key, share_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('read_shares', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';

            $httpBackend.when('GET', "https://www.psono.pw/server/share/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.read_shares(token, session_secret_key)).toBeDefined();

            $httpBackend.flush();
        }));

        it('create_share', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var encrypted_data = 'a-encrypted_data';
            var encrypted_data_nonce = 'a-encrypted_data_nonce';
            var key = 'a-key';
            var key_nonce = 'a-key_nonce';
            var parent_share_id = 'a-parent_share_id';
            var parent_datastore_id = 'a-parent_datastore_id';
            var link_id = 'a-link_id';

            $httpBackend.when('PUT', "https://www.psono.pw/server/share/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.data).toEqual(encrypted_data);
                    expect(data.data_nonce).toEqual(encrypted_data_nonce);
                    expect(data.key).toEqual(key);
                    expect(data.key_nonce).toEqual(key_nonce);
                    expect(data.parent_share_id).toEqual(parent_share_id);
                    expect(data.parent_datastore_id).toEqual(parent_datastore_id);
                    expect(data.link_id).toEqual(link_id);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.create_share(token, session_secret_key, encrypted_data, encrypted_data_nonce, key, key_nonce, parent_share_id,
                parent_datastore_id, link_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('write_share', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var share_id = 'a-share_id';
            var encrypted_data = 'a-encrypted_data';
            var encrypted_data_nonce = 'a-encrypted_data_nonce';

            $httpBackend.when('POST', "https://www.psono.pw/server/share/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.share_id).toEqual(share_id);
                    expect(data.data).toEqual(encrypted_data);
                    expect(data.data_nonce).toEqual(encrypted_data_nonce);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.write_share(token, session_secret_key, share_id, encrypted_data, encrypted_data_nonce)).toBeDefined();

            $httpBackend.flush();
        }));

        it('read_share_rights', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var share_id = 'a-share_id';

            $httpBackend.when('GET', "https://www.psono.pw/server/share/rights/a-share_id/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.read_share_rights(token, session_secret_key, share_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('read_share_rights_overview', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';

            $httpBackend.when('GET', "https://www.psono.pw/server/share/right/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.read_share_rights_overview(token, session_secret_key)).toBeDefined();

            $httpBackend.flush();
        }));

        it('create_share_right', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var encrypted_title = 'a-encrypted_title';
            var encrypted_title_nonce = 'a-encrypted_title_nonce';
            var encrypted_type = 'a-encrypted_type';
            var encrypted_type_nonce = 'a-encrypted_type_nonce';
            var share_id = 'a-share_id';
            var user_id = 'a-user_id';
            var key = 'a-key';
            var key_nonce = 'a-key_nonce';
            var read = 'a-read';
            var write = 'a-write';
            var grant = 'a-grant';

            $httpBackend.when('PUT', "https://www.psono.pw/server/share/right/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.title).toEqual(encrypted_title);
                    expect(data.title_nonce).toEqual(encrypted_title_nonce);
                    expect(data.type).toEqual(encrypted_type);
                    expect(data.type_nonce).toEqual(encrypted_type_nonce);
                    expect(data.share_id).toEqual(share_id);
                    expect(data.user_id).toEqual(user_id);
                    expect(data.key).toEqual(key);
                    expect(data.key_nonce).toEqual(key_nonce);
                    expect(data.read).toEqual(read);
                    expect(data.write).toEqual(write);
                    expect(data.grant).toEqual(grant);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.create_share_right(token, session_secret_key, encrypted_title, encrypted_title_nonce, encrypted_type, encrypted_type_nonce, share_id,
                user_id, key, key_nonce, read, write, grant)).toBeDefined();

            $httpBackend.flush();
        }));

        it('update_share_right', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var share_id = 'a-share_id';
            var user_id = 'a-user_id';
            var read = 'a-read';
            var write = 'a-write';
            var grant = 'a-grant';

            $httpBackend.when('POST', "https://www.psono.pw/server/share/right/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.share_id).toEqual(share_id);
                    expect(data.user_id).toEqual(user_id);
                    expect(data.read).toEqual(read);
                    expect(data.write).toEqual(write);
                    expect(data.grant).toEqual(grant);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.update_share_right(token, session_secret_key, share_id,
                user_id, read, write, grant)).toBeDefined();

            $httpBackend.flush();
        }));

        it('delete_share_right', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var share_right_id = 'a-share_right_id';

            $httpBackend.when('DELETE', "https://www.psono.pw/server/share/right/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.share_right_id).toEqual(share_right_id);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.delete_share_right(token, session_secret_key, share_right_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('read_share_rights_inherit_overview', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';

            $httpBackend.when('GET', "https://www.psono.pw/server/share/right/inherit/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.read_share_rights_inherit_overview(token, session_secret_key)).toBeDefined();

            $httpBackend.flush();
        }));

        it('accept_share_right', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var share_right_id = 'a-share_right_id';
            var key = 'a-key';
            var key_nonce = 'a-key_nonce';
            var link_id = 'a-link_id';
            var parent_share_id = 'a-parent_share_id';
            var parent_datastore_id = 'a-parent_datastore_id';

            $httpBackend.when('POST', "https://www.psono.pw/server/share/right/accept/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.share_right_id).toEqual(share_right_id);
                    expect(data.key).toEqual(key);
                    expect(data.key_nonce).toEqual(key_nonce);
                    expect(data.link_id).toEqual(link_id);
                    expect(data.parent_share_id).toEqual(parent_share_id);
                    expect(data.parent_datastore_id).toEqual(parent_datastore_id);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.accept_share_right(token, session_secret_key, share_right_id, key, key_nonce, link_id, parent_share_id, parent_datastore_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('decline_share_right', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var share_right_id = 'a-share_right_id';

            $httpBackend.when('POST', "https://www.psono.pw/server/share/right/decline/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.share_right_id).toEqual(share_right_id);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.decline_share_right(token, session_secret_key, share_right_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('get_users_public_key', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var user_id = 'a-user_id';
            var user_username = 'a-user_username';

            $httpBackend.when('POST', "https://www.psono.pw/server/user/search/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.user_id).toEqual(user_id);
                    expect(data.user_username).toEqual(user_username);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.get_users_public_key(token, session_secret_key, user_id, user_username)).toBeDefined();

            $httpBackend.flush();
        }));

        it('create_share_link', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var link_id = 'a-link_id';
            var share_id = 'a-share_id';
            var parent_share_id = 'a-parent_share_id';
            var parent_datastore_id = 'a-parent_datastore_id';

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

            expect(apiClient.create_share_link(token, session_secret_key, link_id, share_id, parent_share_id, parent_datastore_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('move_share_link', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var link_id = 'a-link_id';
            var new_parent_share_id = 'a-new_parent_share_id';
            var new_parent_datastore_id = 'a-new_parent_datastore_id';

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

            expect(apiClient.move_share_link(token, session_secret_key, link_id, new_parent_share_id, new_parent_datastore_id)).toBeDefined();

            $httpBackend.flush();
        }));

        it('delete_share_link', inject(function (apiClient) {

            var token = 'a-token';
            var session_secret_key = 'a-session_secret_key';
            var link_id = 'a-link_id';

            $httpBackend.when('DELETE', "https://www.psono.pw/server/share/link/").respond(
                function(method, url, data, headers, params) {
                    // Validate request parameters:
                    data = JSON.parse(data);

                    expect(headers.Authorization).toEqual('Token ' + token);

                    expect(data.link_id).toEqual(link_id);

                    // return answer
                    return [200, {}];
                });

            expect(apiClient.delete_share_link(token, session_secret_key, link_id)).toBeDefined();

            $httpBackend.flush();
        }));

    });

}).call();
