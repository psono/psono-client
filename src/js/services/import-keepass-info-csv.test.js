import React from 'react';
import importKeePassInfoCsv from './import-keepass-info-csv';
import cryptoLibrary from "../services/crypto-library";

describe('Service: importKeePassInfoCsv test suite', function () {


    it('importKeePassInfoCsv exists', function () {
        expect(importKeePassInfoCsv).toBeDefined();
    });

    it('parse', function () {

        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

        const input = "\"Account\",\"Login Name\",\"Password\",\"Web Site\",\"Comments\"\n" +
            "\"Sample Entry Title\",\"Greg\",\"ycXfARD2G1AOBzLlhtbn\",\"http://www.somepage.net\",\"Some notes...\"\n" +
            "\"Yet Another Sample Entry\",\"Michael\",\"qgyXFZ1iGgNqzg+eZter\",\"http://www.anotherpage.org\",\"More notes...\"\n" +
            "\"Entry To Test Special Characters\",\"!§$%&/()=?´`_#²³{[]}\\\\\",\"öäüÖÄÜß€@<>µ©®\",\"http://www.website.com\",\"The user name and password fields contain special characters.\"\n" +
            "\"Multi-Line Test Entry\",\"User\",\"bBbescXqkgGF21PK09gV\",\"http://web.com\",\"This is a multi-line comment.\n" +
            "This is a multi-line comment.\n" +
            "This is a multi-line comment.\n" +
            "This is a multi-line comment.\n" +
            "This is a multi-line comment.\n" +
            "This is a multi-line comment.\n" +
            "This is a multi-line comment.\"\n" +
        "";

        const output = importKeePassInfoCsv.parser(input);

        const expected_output = {
            "datastore": {
                "id": generic_uuid,
                "name": output.datastore.name,
                "items": [{
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Sample Entry Title",
                    "urlfilter": "www.somepage.net",
                    "website_password_url_filter": "www.somepage.net",
                    "website_password_password": "ycXfARD2G1AOBzLlhtbn",
                    "website_password_username": "Greg",
                    "description": "Greg",
                    "website_password_notes": "Some notes...",
                    "website_password_url": "http://www.somepage.net",
                    "website_password_title": "Sample Entry Title"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Yet Another Sample Entry",
                    "urlfilter": "www.anotherpage.org",
                    "website_password_url_filter": "www.anotherpage.org",
                    "website_password_password": "qgyXFZ1iGgNqzg+eZter",
                    "website_password_username": "Michael",
                    "description": "Michael",
                    "website_password_notes": "More notes...",
                    "website_password_url": "http://www.anotherpage.org",
                    "website_password_title": "Yet Another Sample Entry"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Entry To Test Special Characters",
                    "urlfilter": "www.website.com",
                    "website_password_url_filter": "www.website.com",
                    "website_password_password": "öäüÖÄÜß€@<>µ©®",
                    "website_password_username": "!§$%&/()=?´`_#²³{[]}\\",
                    "description": "!§$%&/()=?´`_#²³{[]}\\",
                    "website_password_notes": "The user name and password fields contain special characters.",
                    "website_password_url": "http://www.website.com",
                    "website_password_title": "Entry To Test Special Characters"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Multi-Line Test Entry",
                    "urlfilter": "web.com",
                    "website_password_url_filter": "web.com",
                    "website_password_password": "bBbescXqkgGF21PK09gV",
                    "website_password_username": "User",
                    "description": "User",
                    "website_password_notes": "This is a multi-line comment.\nThis is a multi-line comment.\nThis is a multi-line comment.\nThis is a multi-line comment.\nThis is a multi-line comment.\nThis is a multi-line comment.\nThis is a multi-line comment.",
                    "website_password_url": "http://web.com",
                    "website_password_title": "Multi-Line Test Entry"
                }]
            },
            "secrets": [{
                "id": generic_uuid,
                "type": "website_password",
                "name": "Sample Entry Title",
                "urlfilter": "www.somepage.net",
                "website_password_url_filter": "www.somepage.net",
                "website_password_password": "ycXfARD2G1AOBzLlhtbn",
                "website_password_username": "Greg",
                "description": "Greg",
                "website_password_notes": "Some notes...",
                "website_password_url": "http://www.somepage.net",
                "website_password_title": "Sample Entry Title"
            }, {
                "id": generic_uuid,
                "type": "website_password",
                "name": "Yet Another Sample Entry",
                "urlfilter": "www.anotherpage.org",
                "website_password_url_filter": "www.anotherpage.org",
                "website_password_password": "qgyXFZ1iGgNqzg+eZter",
                "website_password_username": "Michael",
                "description": "Michael",
                "website_password_notes": "More notes...",
                "website_password_url": "http://www.anotherpage.org",
                "website_password_title": "Yet Another Sample Entry"
            }, {
                "id": generic_uuid,
                "type": "website_password",
                "name": "Entry To Test Special Characters",
                "urlfilter": "www.website.com",
                "website_password_url_filter": "www.website.com",
                "website_password_password": "öäüÖÄÜß€@<>µ©®",
                "website_password_username": "!§$%&/()=?´`_#²³{[]}\\",
                "description": "!§$%&/()=?´`_#²³{[]}\\",
                "website_password_notes": "The user name and password fields contain special characters.",
                "website_password_url": "http://www.website.com",
                "website_password_title": "Entry To Test Special Characters"
            }, {
                "id": generic_uuid,
                "type": "website_password",
                "name": "Multi-Line Test Entry",
                "urlfilter": "web.com",
                "website_password_url_filter": "web.com",
                "website_password_password": "bBbescXqkgGF21PK09gV",
                "website_password_username": "User",
                "description": "User",
                "website_password_notes": "This is a multi-line comment.\nThis is a multi-line comment.\nThis is a multi-line comment.\nThis is a multi-line comment.\nThis is a multi-line comment.\nThis is a multi-line comment.\nThis is a multi-line comment.",
                "website_password_url": "http://web.com",
                "website_password_title": "Multi-Line Test Entry"
            }]
        };

        expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
    });

});
