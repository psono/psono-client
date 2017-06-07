(function () {
    describe('Service: importLastPassComCsv test suite', function () {

        beforeEach(module('psonocli'));

        it('importLastPassComCsv exists', inject(function (importLastPassComCsv) {
            expect(importLastPassComCsv).toBeDefined();
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

        it('parse', inject(function (importLastPassComCsv) {

            var input = "url,username,password,extra,name,grouping,fav\n" +
                "https://www.magentocommerce.com/products/customer/account/login/,username@gmail.net,2r4f4%$23,,magentocommerce.com,Passwords,0\n" +
                "https://www.spotify.com/de/login/,username,4ggga4aga4,,spotify,Passwords,0\n" +
                "http://www.hardwareluxx.com/community/,username,g4hw809hgßw4GH,,Password für hardwareluxx.com,Passwords,0\n" +
                "https://login.live.com/,username@gmail.com,ab4zab4z5abz5,\"live.com recovery code\n" +
                "Your new code is ABCDE-ABCDE-ABCDE-ABCDE-ABCDE\n" +
                "\n" +
                "App Password: bs4tzb4stbs4t\",login.live.com (Microsoft Windows Store),Passwords,0\n" +
                "http://php.net/manual/de/function.explode.php,,by4eyb4yb4yb4yb46yb4,,Generated Password for php.net,Passwords,0\n" +
                "https://login.veeam.com/,username@gmail.com,n46a6ab4a6b4,test,login.veeam.com,Passwords,0\n" +
                "http://sn,,,\"NoteType:Software License\n" +
                "License Key:ASDFG-ASDFG-ASDFG-ASDFG-ASDFG\n" +
                "Licensee:\n" +
                "Version:\n" +
                "Publisher:\n" +
                "Support Email:\n" +
                "Website:\n" +
                "Price:\n" +
                "Purchase Date:January,1,\n" +
                "Order Number:\n" +
                "Number of Licenses:\n" +
                "Order Total:\n" +
                "Notes:Installed on notebook\n" +
                "\",Microsoft ,Licenses,0";

            var output = importLastPassComCsv.parser(input);

            var expected_output = {
                "datastore": {
                    "id": generic_uuid,
                    "name": output.datastore.name,
                    "folders": [{
                        "id": generic_uuid,
                        "name": "Passwords",
                        "items": [{
                            "id": generic_uuid,
                            "type": "website_password",
                            "name": "magentocommerce.com",
                            "urlfilter": "magentocommerce.com",
                            "website_password_url_filter": "magentocommerce.com",
                            "website_password_password": "2r4f4%$23",
                            "website_password_username": "username@gmail.net",
                            "website_password_notes": "",
                            "website_password_url": "https://www.magentocommerce.com/products/customer/account/login/",
                            "website_password_title": "magentocommerce.com"
                        }, {
                            "id": generic_uuid,
                            "type": "website_password",
                            "name": "spotify",
                            "urlfilter": "spotify.com",
                            "website_password_url_filter": "spotify.com",
                            "website_password_password": "4ggga4aga4",
                            "website_password_username": "username",
                            "website_password_notes": "",
                            "website_password_url": "https://www.spotify.com/de/login/",
                            "website_password_title": "spotify"
                        }, {
                            "id": generic_uuid,
                            "type": "website_password",
                            "name": "Password für hardwareluxx.com",
                            "urlfilter": "hardwareluxx.com",
                            "website_password_url_filter": "hardwareluxx.com",
                            "website_password_password": "g4hw809hgßw4GH",
                            "website_password_username": "username",
                            "website_password_notes": "",
                            "website_password_url": "http://www.hardwareluxx.com/community/",
                            "website_password_title": "Password für hardwareluxx.com"
                        }, {
                            "id": generic_uuid,
                            "type": "website_password",
                            "name": "login.live.com (Microsoft Windows Store)",
                            "urlfilter": "login.live.com",
                            "website_password_url_filter": "login.live.com",
                            "website_password_password": "ab4zab4z5abz5",
                            "website_password_username": "username@gmail.com",
                            "website_password_notes": "live.com recovery code\nYour new code is ABCDE-ABCDE-ABCDE-ABCDE-ABCDE\n\nApp Password: bs4tzb4stbs4t",
                            "website_password_url": "https://login.live.com/",
                            "website_password_title": "login.live.com (Microsoft Windows Store)"
                        }, {
                            "id": generic_uuid,
                            "type": "website_password",
                            "name": "Generated Password for php.net",
                            "urlfilter": "php.net",
                            "website_password_url_filter": "php.net",
                            "website_password_password": "by4eyb4yb4yb4yb46yb4",
                            "website_password_username": "",
                            "website_password_notes": "",
                            "website_password_url": "http://php.net/manual/de/function.explode.php",
                            "website_password_title": "Generated Password for php.net"
                        }, {
                            "id": generic_uuid,
                            "type": "website_password",
                            "name": "login.veeam.com",
                            "urlfilter": "login.veeam.com",
                            "website_password_url_filter": "login.veeam.com",
                            "website_password_password": "n46a6ab4a6b4",
                            "website_password_username": "username@gmail.com",
                            "website_password_notes": "test",
                            "website_password_url": "https://login.veeam.com/",
                            "website_password_title": "login.veeam.com"
                        }]
                    }, {
                        "id": generic_uuid,
                        "name": "Licenses",
                        "items": [{
                            "id": generic_uuid,
                            "type": "note",
                            "name": "Microsoft ",
                            "note_title": "Microsoft ",
                            "note_notes": "NoteType:Software License\nLicense Key:ASDFG-ASDFG-ASDFG-ASDFG-ASDFG\nLicensee:\nVersion:\nPublisher:\nSupport Email:\nWebsite:\nPrice:\nPurchase Date:January,1,\nOrder Number:\nNumber of Licenses:\nOrder Total:\nNotes:Installed on notebook\n\n"
                        }]
                    }]
                },
                "secrets": [{
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "magentocommerce.com",
                    "urlfilter": "magentocommerce.com",
                    "website_password_url_filter": "magentocommerce.com",
                    "website_password_password": "2r4f4%$23",
                    "website_password_username": "username@gmail.net",
                    "website_password_notes": "",
                    "website_password_url": "https://www.magentocommerce.com/products/customer/account/login/",
                    "website_password_title": "magentocommerce.com"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "spotify",
                    "urlfilter": "spotify.com",
                    "website_password_url_filter": "spotify.com",
                    "website_password_password": "4ggga4aga4",
                    "website_password_username": "username",
                    "website_password_notes": "",
                    "website_password_url": "https://www.spotify.com/de/login/",
                    "website_password_title": "spotify"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Password für hardwareluxx.com",
                    "urlfilter": "hardwareluxx.com",
                    "website_password_url_filter": "hardwareluxx.com",
                    "website_password_password": "g4hw809hgßw4GH",
                    "website_password_username": "username",
                    "website_password_notes": "",
                    "website_password_url": "http://www.hardwareluxx.com/community/",
                    "website_password_title": "Password für hardwareluxx.com"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "login.live.com (Microsoft Windows Store)",
                    "urlfilter": "login.live.com",
                    "website_password_url_filter": "login.live.com",
                    "website_password_password": "ab4zab4z5abz5",
                    "website_password_username": "username@gmail.com",
                    "website_password_notes": "live.com recovery code\nYour new code is ABCDE-ABCDE-ABCDE-ABCDE-ABCDE\n\nApp Password: bs4tzb4stbs4t",
                    "website_password_url": "https://login.live.com/",
                    "website_password_title": "login.live.com (Microsoft Windows Store)"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Generated Password for php.net",
                    "urlfilter": "php.net",
                    "website_password_url_filter": "php.net",
                    "website_password_password": "by4eyb4yb4yb4yb46yb4",
                    "website_password_username": "",
                    "website_password_notes": "",
                    "website_password_url": "http://php.net/manual/de/function.explode.php",
                    "website_password_title": "Generated Password for php.net"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "login.veeam.com",
                    "urlfilter": "login.veeam.com",
                    "website_password_url_filter": "login.veeam.com",
                    "website_password_password": "n46a6ab4a6b4",
                    "website_password_username": "username@gmail.com",
                    "website_password_notes": "test",
                    "website_password_url": "https://login.veeam.com/",
                    "website_password_title": "login.veeam.com"
                }, {
                    "id": generic_uuid,
                    "type": "note",
                    "name": "Microsoft ",
                    "note_title": "Microsoft ",
                    "note_notes": "NoteType:Software License\nLicense Key:ASDFG-ASDFG-ASDFG-ASDFG-ASDFG\nLicensee:\nVersion:\nPublisher:\nSupport Email:\nWebsite:\nPrice:\nPurchase Date:January,1,\nOrder Number:\nNumber of Licenses:\nOrder Total:\nNotes:Installed on notebook\n\n"
                }]
            };

            expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
        }));

    });

}).call();