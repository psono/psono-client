import React from 'react';
import importProtonPassCsv from './import-protonpass-csv';
import cryptoLibrary from "../services/crypto-library";


describe('Service: importProtonPassCsv test suite', function () {

    it('helper exists', function() {
        expect(importProtonPassCsv).toBeDefined();
    });

    it('parse', function () {

        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

        const input = "type,name,url,email,username,password,note,totp,createTime,modifyTime,vault\n" +
            "alias,Alias name,,test@domain.com,,,login note or empty,,1710968710,1720675211,Personal\n" +
            "login,example.com,https://example.com/login,test@domain.com,,testpassword,,otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6&period=30,1717796629,1717796629,Personal\n" +
            "creditCard,TEST CARD,,,,,\"{\"\"cardholderName\"\":\"\"TEST\"\",\"\"cardType\"\":0,\"\"number\"\":\"\"123456789000\"\",\"\"verificationNumber\"\":\"\"123\"\",\"\"expirationDate\"\":\"\"2022-12\"\",\"\"pin\"\":\"\"1234\"\",\"\"note\"\":\"\"Test card\"\"}\",,1721903817,1721903817,Personal\n" +
            "note,Test note,,,,,Note content,,1721903847,1721903847,Personal";


        const output = importProtonPassCsv.parser(input);

        const expected_output = {
                "datastore": {
                    "id": generic_uuid,
                    "name": output.datastore.name,
                    "items": [{
                        "id": generic_uuid,
                        "type": "note",
                        "name": "Alias name",
                        "note_title": "Alias name",
                        "note_notes": "login note or empty\nEmail: test@domain.com\n"
                    }, {
                        "id": generic_uuid,
                        "type": "website_password",
                        "name": "example.com",
                        "urlfilter": "example.com",
                        "website_password_url_filter": "example.com",
                        "website_password_password": "testpassword",
                        "website_password_username": "test@domain.com",
                        "description": "test@domain.com",
                        "website_password_notes": "",
                        "website_password_url": "https://example.com/login",
                        "website_password_title": "example.com",
                        "website_password_totp_period": 30,
                        "website_password_totp_algorithm": "SHA1",
                        "website_password_totp_digits": 6,
                        "website_password_totp_code": "HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ"
                    }, {
                        "id": generic_uuid,
                        "type": "credit_card",
                        "name": "TEST CARD",
                        "credit_card_number": "123456789000",
                        "credit_card_name": "TEST",
                        "credit_card_cvc": "123",
                        "credit_card_valid_through": "1222",
                        "description": "xxxxxxxx9000",
                        "credit_card_pin": "1234",
                        "credit_card_notes": "",
                        "credit_card_title": "TEST CARD"
                    }, {
                        "id": generic_uuid,
                        "type": "note",
                        "name": "Test note",
                        "note_title": "Test note",
                        "note_notes": "Note content\n"
                    }]
                },
                "secrets": [{
                    "id": generic_uuid,
                    "type": "note",
                    "name": "Alias name",
                    "note_title": "Alias name",
                    "note_notes": "login note or empty\nEmail: test@domain.com\n"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "example.com",
                    "urlfilter": "example.com",
                    "website_password_url_filter": "example.com",
                    "website_password_password": "testpassword",
                    "website_password_username": "test@domain.com",
                    "description": "test@domain.com",
                    "website_password_notes": "",
                    "website_password_url": "https://example.com/login",
                    "website_password_title": "example.com",
                    "website_password_totp_period": 30,
                    "website_password_totp_algorithm": "SHA1",
                    "website_password_totp_digits": 6,
                    "website_password_totp_code": "HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ"
                }, {
                    "id": generic_uuid,
                    "type": "credit_card",
                    "name": "TEST CARD",
                    "credit_card_number": "123456789000",
                    "credit_card_name": "TEST",
                    "credit_card_cvc": "123",
                    "credit_card_valid_through": "1222",
                    "description": "xxxxxxxx9000",
                    "credit_card_pin": "1234",
                    "credit_card_notes": "",
                    "credit_card_title": "TEST CARD"
                }, {
                    "id": generic_uuid,
                    "type": "note",
                    "name": "Test note",
                    "note_title": "Test note",
                    "note_notes": "Note content\n"
                }]
            }
        ;

        expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
    });

});