(function () {
    describe('Service: importChromeCsv test suite', function () {

        beforeEach(module('psonocli'));

        it('importChromeCsv exists', inject(function (importChromeCsv) {
            expect(importChromeCsv).toBeDefined();
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

        it('parse', inject(function (importChromeCsv) {

            var input = "name,url,username,password\n" +
                "www.amazon.com,https://www.amazon.com/ap/signin,narf.narf@gmail.com,asdfasdf\n" +
                "";

            var output = importChromeCsv.parser(input);

            var expected_output = {
                "datastore": {
                    "id": generic_uuid,
                    "name": output.datastore.name,
                    "folders": [],
                    "items": [{
                        "id": generic_uuid,
                        "type": "website_password",
                        "name": "www.amazon.com",
                        "urlfilter": "amazon.com",
                        "website_password_url_filter": "amazon.com",
                        "website_password_password": "asdfasdf",
                        "website_password_username": "narf.narf@gmail.com",
                        "website_password_notes": "",
                        "website_password_url": "https://www.amazon.com/ap/signin",
                        "website_password_title": "www.amazon.com"
                    }]
                },
                "secrets": [{
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "www.amazon.com",
                    "urlfilter": "amazon.com",
                    "website_password_url_filter": "amazon.com",
                    "website_password_password": "asdfasdf",
                    "website_password_username": "narf.narf@gmail.com",
                    "website_password_notes": "",
                    "website_password_url": "https://www.amazon.com/ap/signin",
                    "website_password_title": "www.amazon.com"
                }]
            };

            expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
        }));

    });

}).call();
