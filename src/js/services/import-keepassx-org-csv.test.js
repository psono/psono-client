import cryptoLibrary from "./crypto-library";
import importKeePassXOrgCsv from './import-keepassx-org-csv';

describe('Service: importKeePassXOrgCsv test suite', function () {

    it('importKeePassXOrgCsv exists', function () {
        expect(importKeePassXOrgCsv).toBeDefined();
    });

    it('parse', function () {

        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

        const input = "\"Group\",\"Title\",\"Username\",\"Password\",\"URL\",\"Notes\"\n" +
            "\"Root\",\"home dir \",\"meldron\",\"xxxx\",\"\",\"xxx\"\n" +
            "\"Root\",\"CA\",\"\",\"xxx\"\"xxx\",\"\",\"\"\n" +
            "\"Root/Internet\",\"tunnelbroker\",\"xxx\",\"xxx\",\"tunnelbroker.net\",\"\"\n" +
            "\"Root/Internet/shops\",\"Shellsmart Bruno\",\"47544645854646\",\"xxx\",\"https://www.shellsmart.com/smart/index.htm\",\"\"\n" +
            "\"Root/Company\",\"WLAN Passwort\",\"company\",\"xxasd22das\",\"\",\"wlanname: company \"\n" +
            "\"Root/Company\",\"vSphere\",\"root\",\"4z4wzws4F\",\"\",\"vSphere Client on 192.168.200.248\n" +
            "for\n" +
            "192.168.200.249\n" +
            "192.168.200.250\"\n" +
            "\"Root/Company\",\"Portal\",\"pp\",\"4wtw4gws4g4g\",\"https://park.company-asd.com/path/to/login.jspx\",\"\"\n" +
            "\"Root/Company\",\"repP production\",\"bernd.bernd@company-asd.com\",\"NSUjBlkFpRKZqkYV\",\"http://192.168.200.6:8069/\",\"\"\n" +
            "\"Root/Company/Shortlinks\",\"MySQL DB (DB28571)\",\"asd-d.dd\",\"asd35F233f\",\"80.81.241.58\",\"Datenbank:\n" +
            "DB28571\"\n" +
            "\"Root/Company/Shortlinks\",\"FTP \",\"asd-t-de\",\"asdasdDasd3s\",\"asd-t.de\",\"\"\n" +
            "\"Root/Company/website\",\"company-asd.com\",\"companycom\",\"a5asSASss\",\"http://www.company-asd.com/\",\"\"\n" +
            "\"Root/Company/website\",\"asdf access\",\"companycom\",\"asd5asdasd2\",\"https://dcp18-v2.c.asdf.com/\",\"\"\n" +
            "\"Root/Company/DB\",\"DCParis\",\"my_user\",\"af3!%%$aA'4gk\",\"192.168.90.12\",\"Hostname: 192.168.90.12\n" +
            "Port: 1521\n" +
            "SID: akdb\"\n" +
            "\"Root/Company/ABC API\",\"MusicService_v1\",\"abctest\",\"5/a5F3asdas\",\"https://park.company-technologies.com/AWasdasdS/asdas\",\"SOAP\"\n" +
            "";

        const output = importKeePassXOrgCsv.parser(input);

        const expected_output = {
                "datastore": {
                    "id": generic_uuid,
                    "name": output.datastore.name,
                    "folders": [{
                        "id": generic_uuid,
                        "name": "Internet",
                        "folders": [{
                            "id": generic_uuid,
                            "name": "shops",
                            "folders": [],
                            "items": [{
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "Shellsmart Bruno",
                                "urlfilter": "www.shellsmart.com",
                                "website_password_url_filter": "www.shellsmart.com",
                                "website_password_password": "xxx",
                                "website_password_username": "47544645854646",
                                "website_password_notes": "",
                                "website_password_url": "https://www.shellsmart.com/smart/index.htm",
                                "website_password_title": "Shellsmart Bruno"
                            }
                            ]
                        }
                        ],
                        "items": [{
                            "id": generic_uuid,
                            "type": "website_password",
                            "name": "tunnelbroker",
                            "website_password_password": "xxx",
                            "website_password_username": "xxx",
                            "website_password_notes": "",
                            "website_password_url": "tunnelbroker.net",
                            "website_password_title": "tunnelbroker"
                        }
                        ]
                    }, {
                        "id": generic_uuid,
                        "name": "Company",
                        "folders": [{
                            "id": generic_uuid,
                            "name": "Shortlinks",
                            "folders": [],
                            "items": [{
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "MySQL DB (DB28571)",
                                "website_password_password": "asd35F233f",
                                "website_password_username": "asd-d.dd",
                                "website_password_notes": "Datenbank:\nDB28571",
                                "website_password_url": "80.81.241.58",
                                "website_password_title": "MySQL DB (DB28571)"
                            }, {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "FTP ",
                                "website_password_password": "asdasdDasd3s",
                                "website_password_username": "asd-t-de",
                                "website_password_notes": "",
                                "website_password_url": "asd-t.de",
                                "website_password_title": "FTP "
                            }
                            ]
                        }, {
                            "id": generic_uuid,
                            "name": "website",
                            "folders": [],
                            "items": [{
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "company-asd.com",
                                "urlfilter": "www.company-asd.com",
                                "website_password_url_filter": "www.company-asd.com",
                                "website_password_password": "a5asSASss",
                                "website_password_username": "companycom",
                                "website_password_notes": "",
                                "website_password_url": "http://www.company-asd.com/",
                                "website_password_title": "company-asd.com"
                            }, {
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "asdf access",
                                "urlfilter": "dcp18-v2.c.asdf.com",
                                "website_password_url_filter": "dcp18-v2.c.asdf.com",
                                "website_password_password": "asd5asdasd2",
                                "website_password_username": "companycom",
                                "website_password_notes": "",
                                "website_password_url": "https://dcp18-v2.c.asdf.com/",
                                "website_password_title": "asdf access"
                            }
                            ]
                        }, {
                            "id": generic_uuid,
                            "name": "DB",
                            "folders": [],
                            "items": [{
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "DCParis",
                                "website_password_password": "af3!%%$aA'4gk",
                                "website_password_username": "my_user",
                                "website_password_notes": "Hostname: 192.168.90.12\nPort: 1521\nSID: akdb",
                                "website_password_url": "192.168.90.12",
                                "website_password_title": "DCParis"
                            }
                            ]
                        }, {
                            "id": generic_uuid,
                            "name": "ABC API",
                            "folders": [],
                            "items": [{
                                "id": generic_uuid,
                                "type": "website_password",
                                "name": "MusicService_v1",
                                "urlfilter": "park.company-technologies.com",
                                "website_password_url_filter": "park.company-technologies.com",
                                "website_password_password": "5/a5F3asdas",
                                "website_password_username": "abctest",
                                "website_password_notes": "SOAP",
                                "website_password_url": "https://park.company-technologies.com/AWasdasdS/asdas",
                                "website_password_title": "MusicService_v1"
                            }
                            ]
                        }
                        ],
                        "items": [{
                            "id": generic_uuid,
                            "type": "website_password",
                            "name": "WLAN Passwort",
                            "website_password_password": "xxasd22das",
                            "website_password_username": "company",
                            "website_password_notes": "wlanname: company ",
                            "website_password_url": "",
                            "website_password_title": "WLAN Passwort"
                        }, {
                            "id": generic_uuid,
                            "type": "website_password",
                            "name": "vSphere",
                            "website_password_password": "4z4wzws4F",
                            "website_password_username": "root",
                            "website_password_notes": "vSphere Client on 192.168.200.248\nfor\n192.168.200.249\n192.168.200.250",
                            "website_password_url": "",
                            "website_password_title": "vSphere"
                        }, {
                            "id": generic_uuid,
                            "type": "website_password",
                            "name": "Portal",
                            "urlfilter": "park.company-asd.com",
                            "website_password_url_filter": "park.company-asd.com",
                            "website_password_password": "4wtw4gws4g4g",
                            "website_password_username": "pp",
                            "website_password_notes": "",
                            "website_password_url": "https://park.company-asd.com/path/to/login.jspx",
                            "website_password_title": "Portal"
                        }, {
                            "id": generic_uuid,
                            "type": "website_password",
                            "name": "repP production",
                            "urlfilter": "192.168.200.6:8069",
                            "website_password_url_filter": "192.168.200.6:8069",
                            "website_password_password": "NSUjBlkFpRKZqkYV",
                            "website_password_username": "bernd.bernd@company-asd.com",
                            "website_password_notes": "",
                            "website_password_url": "http://192.168.200.6:8069/",
                            "website_password_title": "repP production"
                        }
                        ]
                    }
                    ],
                    "items": [{
                        "id": generic_uuid,
                        "type": "website_password",
                        "name": "home dir ",
                        "website_password_password": "xxxx",
                        "website_password_username": "meldron",
                        "website_password_notes": "xxx",
                        "website_password_url": "",
                        "website_password_title": "home dir "
                    }, {
                        "id": generic_uuid,
                        "type": "website_password",
                        "name": "CA",
                        "website_password_password": "xxx\"xxx",
                        "website_password_username": "",
                        "website_password_notes": "",
                        "website_password_url": "",
                        "website_password_title": "CA"
                    }
                    ]
                },
                "secrets": [{
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "home dir ",
                    "website_password_password": "xxxx",
                    "website_password_username": "meldron",
                    "website_password_notes": "xxx",
                    "website_password_url": "",
                    "website_password_title": "home dir "
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "CA",
                    "website_password_password": "xxx\"xxx",
                    "website_password_username": "",
                    "website_password_notes": "",
                    "website_password_url": "",
                    "website_password_title": "CA"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "tunnelbroker",
                    "website_password_password": "xxx",
                    "website_password_username": "xxx",
                    "website_password_notes": "",
                    "website_password_url": "tunnelbroker.net",
                    "website_password_title": "tunnelbroker"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Shellsmart Bruno",
                    "urlfilter": "www.shellsmart.com",
                    "website_password_url_filter": "www.shellsmart.com",
                    "website_password_password": "xxx",
                    "website_password_username": "47544645854646",
                    "website_password_notes": "",
                    "website_password_url": "https://www.shellsmart.com/smart/index.htm",
                    "website_password_title": "Shellsmart Bruno"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "WLAN Passwort",
                    "website_password_password": "xxasd22das",
                    "website_password_username": "company",
                    "website_password_notes": "wlanname: company ",
                    "website_password_url": "",
                    "website_password_title": "WLAN Passwort"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "vSphere",
                    "website_password_password": "4z4wzws4F",
                    "website_password_username": "root",
                    "website_password_notes": "vSphere Client on 192.168.200.248\nfor\n192.168.200.249\n192.168.200.250",
                    "website_password_url": "",
                    "website_password_title": "vSphere"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Portal",
                    "urlfilter": "park.company-asd.com",
                    "website_password_url_filter": "park.company-asd.com",
                    "website_password_password": "4wtw4gws4g4g",
                    "website_password_username": "pp",
                    "website_password_notes": "",
                    "website_password_url": "https://park.company-asd.com/path/to/login.jspx",
                    "website_password_title": "Portal"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "repP production",
                    "urlfilter": "192.168.200.6:8069",
                    "website_password_url_filter": "192.168.200.6:8069",
                    "website_password_password": "NSUjBlkFpRKZqkYV",
                    "website_password_username": "bernd.bernd@company-asd.com",
                    "website_password_notes": "",
                    "website_password_url": "http://192.168.200.6:8069/",
                    "website_password_title": "repP production"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "MySQL DB (DB28571)",
                    "website_password_password": "asd35F233f",
                    "website_password_username": "asd-d.dd",
                    "website_password_notes": "Datenbank:\nDB28571",
                    "website_password_url": "80.81.241.58",
                    "website_password_title": "MySQL DB (DB28571)"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "FTP ",
                    "website_password_password": "asdasdDasd3s",
                    "website_password_username": "asd-t-de",
                    "website_password_notes": "",
                    "website_password_url": "asd-t.de",
                    "website_password_title": "FTP "
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "company-asd.com",
                    "urlfilter": "www.company-asd.com",
                    "website_password_url_filter": "www.company-asd.com",
                    "website_password_password": "a5asSASss",
                    "website_password_username": "companycom",
                    "website_password_notes": "",
                    "website_password_url": "http://www.company-asd.com/",
                    "website_password_title": "company-asd.com"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "asdf access",
                    "urlfilter": "dcp18-v2.c.asdf.com",
                    "website_password_url_filter": "dcp18-v2.c.asdf.com",
                    "website_password_password": "asd5asdasd2",
                    "website_password_username": "companycom",
                    "website_password_notes": "",
                    "website_password_url": "https://dcp18-v2.c.asdf.com/",
                    "website_password_title": "asdf access"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "DCParis",
                    "website_password_password": "af3!%%$aA'4gk",
                    "website_password_username": "my_user",
                    "website_password_notes": "Hostname: 192.168.90.12\nPort: 1521\nSID: akdb",
                    "website_password_url": "192.168.90.12",
                    "website_password_title": "DCParis"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "MusicService_v1",
                    "urlfilter": "park.company-technologies.com",
                    "website_password_url_filter": "park.company-technologies.com",
                    "website_password_password": "5/a5F3asdas",
                    "website_password_username": "abctest",
                    "website_password_notes": "SOAP",
                    "website_password_url": "https://park.company-technologies.com/AWasdasdS/asdas",
                    "website_password_title": "MusicService_v1"
                }
                ]
            };

        expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
    });

});
