import React from 'react';
import importNextcloudCsv from './import-nextcloud-csv';
import cryptoLibrary from "../services/crypto-library";

describe('Service: importNextcloudCsv test suite', function () {

    it('importNextcloudCsv exists', function () {
        expect(importNextcloudCsv).toBeDefined();
    });

    it('parse', function () {

        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

        const input = "Label,Username,Password,Notes,Url,Custom Fields,Folder,Tags,Favorite,Edited,Id,Revision,Folder Id\n"+
        "Production System,my Username,phkjphoiusrg,,https://123.123.123.12:8800,,Folder23,,false,Thu Oct 20 2022 21:31:42 GMT+0200 (Central European Summer Time),ea1964bc-46b0-401b-8960-ef8714138da5,7b1c4863-5386-4253-b944-21d1e1528ec1,6716569e-ce27-40c3-b886-8be4c8034aa8\n"+
        "Account 123,TestUsername,SuperSecure Password!,,https://example,,Home,,false,Fri Apr 16 2021 16:08:38 GMT+0200 (Central European Summer Time),740ea5fe-86e5-473f-bcf1-d8287805934d,93a4ce31-adb4-4e96-a723-e5d567ccf20c,00000000-0000-0000-0000-000000000000\n"

        const output = importNextcloudCsv.parser(input);

        const expectedOutput = {
            "datastore": {
                "id": generic_uuid,
                "name": output.datastore.name,
                "items": [{
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Account 123",
                    "urlfilter": "example",
                    "website_password_url_filter": "example",
                    "website_password_password": "SuperSecure Password!",
                    "website_password_username": "TestUsername",
                    "description": "TestUsername",
                    "website_password_notes": "",
                    "website_password_url": "https://example",
                    "website_password_title": "Account 123"
                }],
                "folders":
                    [{
                        "id": generic_uuid,
                        "name": "Folder23",
                        "folders": [],
                        "items": [{
                            "id": generic_uuid,
                            "type": "website_password",
                            "name": "Production System",
                            "urlfilter": "123.123.123.12:8800",
                            "website_password_url_filter": "123.123.123.12:8800",
                            "website_password_password": "phkjphoiusrg",
                            "website_password_username": "my Username",
                            "description": "my Username",
                            "website_password_notes": "",
                            "website_password_url": "https://123.123.123.12:8800",
                            "website_password_title": "Production System"
                        }]
                    }]
            }
            ,
            "secrets":
                [{
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Production System",
                    "urlfilter": "123.123.123.12:8800",
                    "website_password_url_filter": "123.123.123.12:8800",
                    "website_password_password": "phkjphoiusrg",
                    "website_password_username": "my Username",
                    "description": "my Username",
                    "website_password_notes": "",
                    "website_password_url": "https://123.123.123.12:8800",
                    "website_password_title": "Production System"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Account 123",
                    "urlfilter": "example",
                    "website_password_url_filter": "example",
                    "website_password_password": "SuperSecure Password!",
                    "website_password_username": "TestUsername",
                    "description": "TestUsername",
                    "website_password_notes": "",
                    "website_password_url": "https://example",
                    "website_password_title": "Account 123"
                }]
        }

        expect(JSON.parse(JSON.stringify(output))).toEqual(expectedOutput);
    });

});



