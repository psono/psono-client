import React from 'react';
import importChromeCsv from './import-chrome-csv';
import cryptoLibrary from "../services/crypto-library";


describe('Service: importChromeCsv test suite', function () {

    it('helper exists', function() {
        expect(importChromeCsv).toBeDefined();
    });

    it('parse', function () {

        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

        const input = "name,url,username,password\n" +
            "www.amazon.com,https://www.amazon.com/ap/signin,narf.narf@gmail.com,asdfasdf\n" +
            "";

        const output = importChromeCsv.parser(input);

        const expected_output = {
            "datastore": {
                "id": generic_uuid,
                "name": output.datastore.name,
                "folders": [],
                "items": [{
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "www.amazon.com",
                    "urlfilter": "www.amazon.com",
                    "website_password_url_filter": "www.amazon.com",
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
                "urlfilter": "www.amazon.com",
                "website_password_url_filter": "www.amazon.com",
                "website_password_password": "asdfasdf",
                "website_password_username": "narf.narf@gmail.com",
                "website_password_notes": "",
                "website_password_url": "https://www.amazon.com/ap/signin",
                "website_password_title": "www.amazon.com"
            }]
        };

        expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
    });

});