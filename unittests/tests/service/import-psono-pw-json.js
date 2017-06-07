(function () {
    describe('Service: importPsonoPwJson test suite', function () {

        beforeEach(module('psonocli'));

        it('importPsonoPwJson exists', inject(function (importPsonoPwJson) {
            expect(importPsonoPwJson).toBeDefined();
        }));

        var generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa';
        var mockedCryptoLibrary;
        beforeEach(function () {
            mockedCryptoLibrary = {
                generate_uuid: function () {
                    return generic_uuid;
                }
            };

            module(function ($provide) {
                $provide.value('cryptoLibrary', mockedCryptoLibrary);
            });

        });


        it('parse', inject(function (importPsonoPwJson) {

            var input = '{"folders":[{"name":"A Folder"},{"name":"Company Passwords","folders":[{"name":"bla","items":[{"type":"website_password","urlfilter":"facebook.com","name":"Facebook","website_password_url_filter":"facebook.com","website_password_auto_submit":true,"website_password_password":"mypassword","website_password_username":"myusername","website_password_url":"https://de-de.facebook.com/","website_password_title":"Facebook"}]}]}],"items":[{"type":"website_password","urlfilter":"amazon.de","name":"Amazon.de","website_password_url_filter":"amazon.de","website_password_password":"mypw","website_password_username":"myuser","website_password_url":"https://www.amazon.de","website_password_title":"Amazon.de"},{"type":"note","name":"My secret note","note_notes":"Some nice secrets go in here!","note_title":"My secret note"}]}';

            var output = importPsonoPwJson.parser(input);

            var expected_output = {
                "datastore": {
                    "folders": [{
                        "name": "A Folder",
                        "id": generic_uuid
                    }, {
                        "name": "Company Passwords",
                        "folders": [{
                            "name": "bla",
                            "items": [{
                                "type": "website_password",
                                "urlfilter": "facebook.com",
                                "name": "Facebook",
                                "website_password_url_filter": "facebook.com",
                                "website_password_auto_submit": true,
                                "website_password_password": "mypassword",
                                "website_password_username": "myusername",
                                "website_password_url": "https://de-de.facebook.com/",
                                "website_password_title": "Facebook",
                                "id": generic_uuid
                            }],
                            "id": generic_uuid
                        }],
                        "id": generic_uuid
                    }],
                    "items": [{
                        "type": "website_password",
                        "urlfilter": "amazon.de",
                        "name": "Amazon.de",
                        "website_password_url_filter": "amazon.de",
                        "website_password_password": "mypw",
                        "website_password_username": "myuser",
                        "website_password_url": "https://www.amazon.de",
                        "website_password_title": "Amazon.de",
                        "id": generic_uuid
                    }, {
                        "type": "note",
                        "name": "My secret note",
                        "note_notes": "Some nice secrets go in here!",
                        "note_title": "My secret note",
                        "id": generic_uuid
                    }],
                    "name": output.datastore.name,
                    "id": generic_uuid
                },
                "secrets": [{
                    "type": "website_password",
                    "urlfilter": "facebook.com",
                    "name": "Facebook",
                    "website_password_url_filter": "facebook.com",
                    "website_password_auto_submit": true,
                    "website_password_password": "mypassword",
                    "website_password_username": "myusername",
                    "website_password_url": "https://de-de.facebook.com/",
                    "website_password_title": "Facebook",
                    "id": generic_uuid
                }, {
                    "type": "website_password",
                    "urlfilter": "amazon.de",
                    "name": "Amazon.de",
                    "website_password_url_filter": "amazon.de",
                    "website_password_password": "mypw",
                    "website_password_username": "myuser",
                    "website_password_url": "https://www.amazon.de",
                    "website_password_title": "Amazon.de",
                    "id": generic_uuid
                }, {
                    "type": "note",
                    "name": "My secret note",
                    "note_notes": "Some nice secrets go in here!",
                    "note_title": "My secret note",
                    "id": generic_uuid
                }]
            };

            expect(output).toEqual(expected_output);
        }));

    });

}).call();
