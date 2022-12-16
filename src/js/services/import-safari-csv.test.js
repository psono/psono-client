import React from 'react';
import importSafariCsv from './import-safari-csv';
import cryptoLibrary from "./crypto-library";


describe('Service: importSafariCsv test suite', function () {

    it('helper exists', function() {
        expect(importSafariCsv).toBeDefined();
    });

    it('parse', function () {

        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

        const input = "Title,URL,Username,Password,Notes,OTPAuth\n" +
            "www.amazon.com (jdoe13),https://www.amazon.com/ap/signin,jdoe13@gmail.com,asdfasdf,some note," +
            "";

        const output = importSafariCsv.parser(input);

        const expected_output = {
            "datastore": {
                "id": generic_uuid,
                "name": output.datastore.name,
                "folders": [],
                "items": [{
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "www.amazon.com (jdoe13)",
                    "urlfilter": "www.amazon.com",
                    "website_password_url_filter": "www.amazon.com",
                    "website_password_password": "asdfasdf",
                    "website_password_username": "jdoe13@gmail.com",
                    "website_password_notes": "some note",
                    "website_password_url": "https://www.amazon.com/ap/signin",
                    "website_password_title": "www.amazon.com (jdoe13)"
                }]
            },
            "secrets": [{
                "id": generic_uuid,
                "type": "website_password",
                "name": "www.amazon.com (jdoe13)",
                "urlfilter": "www.amazon.com",
                "website_password_url_filter": "www.amazon.com",
                "website_password_password": "asdfasdf",
                "website_password_username": "jdoe13@gmail.com",
                "website_password_notes": "some note",
                "website_password_url": "https://www.amazon.com/ap/signin",
                "website_password_title": "www.amazon.com (jdoe13)"
            }]
        };

        expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
    });

});