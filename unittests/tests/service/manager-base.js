(function () {
    describe('Service: managerBase test suite', function () {

        beforeEach(module('passwordManagerApp'));

        // other users public / private key pair
        var other_public_key = 'ed7293c239164855aca4c2e6edb19e09bba41e3451603ec427782d45f2d57b39';
        var other_private_key = '035f8aa4c86658a36d995df47c8e3d1e9a7a2a2f3efdcbdc1451ed4354350660';

        var fake_user_token = '3d451915-59e4-433a-8065-bff590fbf0f2';
        var fake_session_secret_key = '49293902-0852-4df6-9595-924d65741ce5';
        var fake_user_public_key = '57531faba711e6e9bdea25229e63db4ce6eb79f0872d97cbfec74df0382dbf3a';
        var fake_user_private_key = 'a04c3fbcb4dcf5df44bc433668bb686aac8991f83e993b971e73a0b37ace362c';
        var fake_user_secret_key = '9f3edbf7760d8ec1e8fd4a9c623b4fe569f324bf42c78770ef0a40a56495f92d';
        var dummy_not_blocked = '1234567';


        // beforeEach(inject(function (storage) {
        //     try {
        //         storage.insert('config', {key: 'user_token', value: fake_user_token});
        //         storage.insert('config', {key: 'session_secret_key', value: fake_session_secret_key});
        //         storage.insert('config', {key: 'user_private_key', value: fake_user_private_key});
        //         storage.insert('config', {key: 'user_secret_key', value: fake_user_secret_key});
        //         storage.insert('config', {key: 'dummy_not_blocked', value: dummy_not_blocked});
        //     } catch(e) {
        //         storage.update('config', {key: 'user_token', value: fake_user_token});
        //         storage.update('config', {key: 'session_secret_key', value: fake_session_secret_key});
        //         storage.update('config', {key: 'user_private_key', value: fake_user_private_key});
        //         storage.update('config', {key: 'user_secret_key', value: fake_user_secret_key});
        //         storage.update('config', {key: 'dummy_not_blocked', value: dummy_not_blocked});
        //     }
        // }));



        var mockedStorage;
        beforeEach(function () {
            mockedStorage = {
                find_one: function (db, search) {
                    switch (search['key']) {
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

                }
            };

            module(function ($provide) {
                $provide.value('storage', mockedStorage);
            });

        });


        it('managerBase exists', inject(function (managerBase) {
            expect(managerBase).toBeDefined();
        }));

        it('get_token', inject(function (managerBase) {
            expect(managerBase.get_token()).toBe(fake_user_token);
        }));

        it('get_session_secret_key', inject(function (managerBase) {
            expect(managerBase.get_session_secret_key()).toBe(fake_session_secret_key);
        }));

        it('encrypt_private_key', inject(function (managerBase, cryptoLibrary) {
            var data = 'testdata';
            var encrypted_data = managerBase.encrypt_private_key(data, other_public_key);
            var decrypted_data = cryptoLibrary.decrypt_data_public_key(encrypted_data['text'], encrypted_data['nonce'], fake_user_public_key, other_private_key);
            expect(decrypted_data).toBe(data);
        }));

        it('decrypt_private_key', inject(function (managerBase) {
            var original_data = 'testdata';
            var text = 'e3123b24b1b0ffe4ffa1baa146dbafe2c9a64c9f032e0f93';
            var nonce = '56a6cd040078fb1d1f30e968102789950dfdaaa63fe51cd4';
            var data = managerBase.decrypt_private_key(text, nonce, other_public_key);
            expect(data).toBe(original_data);
        }));

        it('encrypt_secret_key', inject(function (managerBase, cryptoLibrary) {
            var data = "testdata";

            var encrypted_data = managerBase.encrypt_secret_key(data);
            var decrypted_data = cryptoLibrary.decrypt_data(encrypted_data['text'], encrypted_data['nonce'],fake_user_secret_key);
            expect(decrypted_data).toBe(data);
        }));

        it('decrypt_secret_key', inject(function (managerBase) {
            var original_data = "testdata";
            var text = 'f449ef030f04043e18f85ba06c9f8b6f45168e3feb55257e';
            var nonce = '55b616322656a5100e99ec7230e0ae619294b1ebd33bbf96';
            var data = managerBase.decrypt_secret_key(text, nonce);
            expect(data).toBe(original_data);
        }));

        it('decrypt_secret_key', inject(function (managerBase) {
            var data = managerBase.find_one_nolimit('config', 'does_not_exist');
            expect(data).toBe('');
        }));

        it('find_one: regular key', inject(function (managerBase) {
            var data = managerBase.find_one('config', 'dummy_not_blocked');
            expect(data).toBe(dummy_not_blocked);
        }));

        it('find_one: check protection of user_token', inject(function (managerBase) {
            var data = managerBase.find_one('config', 'user_token');
            expect(data).toBe('');
        }));

        it('find_one: check protection of session_secret_key', inject(function (managerBase) {
            var data = managerBase.find_one('config', 'session_secret_key');
            expect(data).toBe('');
        }));

        it('find_one: check protection of user_private_key', inject(function (managerBase) {
            var data = managerBase.find_one('config', 'user_private_key');
            expect(data).toBe('');
        }));

        it('find_one: check protection of user_secret_key', inject(function (managerBase) {
            var data = managerBase.find_one('config', 'user_secret_key');
            expect(data).toBe('');
        }));

        it('find_one: check protection of user_sauce', inject(function (managerBase) {
            var data = managerBase.find_one('config', 'user_sauce');
            expect(data).toBe('');
        }));
    });

}).call();
