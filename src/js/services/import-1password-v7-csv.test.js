import React from 'react';
import import1PasswordV7Csv from './import-1password-v7-csv';
import cryptoLibrary from "../services/crypto-library";


describe('Service: import1PasswordV7Csv test suite', function () {

    it('helper exists', function() {
        expect(import1PasswordV7Csv).toBeDefined();
    });

    it('parse', function () {

        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

        const input = '"UUID","TITLE","USERNAME","PASSWORD","URL","URLS","SCOPE","AUTOSUBMIT","NOTES","SECTION_UNAZHCO2FJN3VMOVECXJ6VAPVQ 1: ONE-TIME PASSWORD","SECTION_OCAAN7KL7H3NBCG4MS5U32HK4I 1: ONE-TIME PASSWORD","SECTION_HMDIBYQYZTOO3T7VHQNL6RWD5Q 1: ONE-TIME PASSWORD","SECTION_HMDIBYQYZTOO3T7VHQNL6RWD5Q 2: TOTP EMEA","SECTION_25UMUV5BFEIKPG3CIR7GJZDZ2Q 1: ONE-TIME PASSWORD","SECTION_EKCTDUQ7IY3LEL5Z3W7V6WSRYY 1: ONE-TIME PASSWORD","SECTION_PNMULQU23IIE3APZCB47HX7NYY 1: ONE-TIME PASSWORD","SECTION_2YB726SMDTKVK5BS2LLJG3C3EU 1: ONE-TIME PASSWORD","SECTION_7NYM44Q42TTUKZZ7XQV3KJZJT4 1: ONE-TIME PASSWORD","SECTION_ARWON2SMNJJB3DGYAYUDSSZG7I 1: ONE-TIME PASSWORD","SECTION_I3U3L7I7VK2LQVJR2XYU6QMK2Y 1: ONE-TIME PASSWORD"\n' +
            '"w3mm2yqmlxzoet5yzixj2r2g3m","Entry1","username@example.com","","","","Default","Default","","","otpauth://totp/TargetLocation%3Ausername%23%40customsubdomain.onmicrosoft.com?secret=MySuperSecretId&issuer=Microsoft","","","","","","","","",""\n' +
            '"oj7qssf6famqwhehrdmlaorbce","Entry2","username@example.com","MyUnencryptedPassword","","","Default","Default","Requires additional information\n' +
            '\n' +
            'See this information for more details","","","otpauth://totp/TargetLocation%3Ausername%40example.com?secret=MuSuperSecretId&issuer=Microsoft","otpauth://totp/TargetLocation:username%40example.com?secret=MySuperSecretId&issuer=custom.url","","","","","","",""\n' +
            '"cnlpbbswmcsnnzm4dxgnl7fube","Entry3","username@example.com","MyUnencryptedPassword","https://example.com","https://example.com","Default","Default","","","","","","","otpauth://totp/TargetLocation%20Account:username@example.com?secret=MySuperSecretId&issuer=Custom+Name","","","","",""\n' +
            '"6y32zcyqqcfod2b2z24hjeccpe","Entry3","username@example.com","MyUnencryptedPassword","https://www.example.com","https://www.example.com","Default","Default","Also used for other example account.","","","","","","","otpauth://totp/Target%3Ausername%40example.com?secret=MySuperSecretId&issuer=Microsoft","","","",""\n' +
            '"tocde7becxi24g3vvhnbxrlrdy","Entry4","username@example.com","MyUnencryptedPassword","","","Default","Default","","","","","","","","","otpauth://totp/TargetLocation%3Ausername%40customsubdomain.onmicrosoft.com?secret=MySuperSecretId&issuer=Microsoft","","",""\n' +
            '"ispd2tfskowiw7tgfi5fxsbkca","Entry5","username@example.com","MyUnencryptedPassword","https://example.com/","https://example.com/","Default","Default","","","","","","","","","","otpauth://totp/TargetLocation%3Ausername%40example.com?secret=MySuperSecretId&issuer=Microsoft","",""\n' +
            '"xbomf4tv6f7o6mhbyz4yunwchq","Entry6","username@exmaple.com","MyUnencryptedPassword","","","Default","Default","","","","","","","","","","","",""\n'

        const output = import1PasswordV7Csv.parser(input);

        const expected_output = {
            "datastore": {
                "id": generic_uuid,
                "name": output.datastore.name,
                "items": [{
                    "id": generic_uuid,
                    "type": "totp",
                    "name": "Entry1 TOTP10",
                    "totp_notes": "",
                    "totp_code": "MYSUPERSECRETIA",
                    "totp_digits": 6,
                    "totp_algorithm": "SHA1",
                    "totp_period": 30,
                    "totp_title": "Entry1 TOTP10"
                }, {
                    "id": generic_uuid,
                    "type": "application_password",
                    "name": "Entry1",
                    "application_password_password": "",
                    "application_password_username": "username@example.com",
                    "application_password_notes": "",
                    "application_password_title": "Entry1"
                }, {
                    "id": generic_uuid,
                    "type": "totp",
                    "name": "Entry2 TOTP11",
                    "totp_notes": "Requires additional information\n\nSee this information for more details",
                    "totp_code": "MUSUPERSECRETIA",
                    "totp_digits": 6,
                    "totp_algorithm": "SHA1",
                    "totp_period": 30,
                    "totp_title": "Entry2 TOTP11"
                }, {
                    "id": generic_uuid,
                    "type": "totp",
                    "name": "Entry2 TOTP12",
                    "totp_notes": "Requires additional information\n\nSee this information for more details",
                    "totp_code": "",
                    "totp_digits": "6",
                    "totp_algorithm": "SHA1",
                    "totp_period": 30,
                    "totp_title": "Entry2 TOTP12"
                }, {
                    "id": generic_uuid,
                    "type": "application_password",
                    "name": "Entry2",
                    "application_password_password": "MyUnencryptedPassword",
                    "application_password_username": "username@example.com",
                    "application_password_notes": "Requires additional information\n\nSee this information for more details",
                    "application_password_title": "Entry2"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Entry3",
                    "urlfilter": "example.com",
                    "website_password_url_filter": "example.com",
                    "website_password_password": "MyUnencryptedPassword",
                    "website_password_username": "username@example.com",
                    "website_password_notes": "",
                    "website_password_url": "https://example.com",
                    "website_password_title": "Entry3"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Entry3",
                    "urlfilter": "www.example.com",
                    "website_password_url_filter": "www.example.com",
                    "website_password_password": "MyUnencryptedPassword",
                    "website_password_username": "username@example.com",
                    "website_password_notes": "Also used for other example account.",
                    "website_password_url": "https://www.example.com",
                    "website_password_title": "Entry3",
                    "website_password_totp_period": 30,
                    "website_password_totp_algorithm": "SHA1",
                    "website_password_totp_digits": 6,
                    "website_password_totp_code": "MYSUPERSECRETIA"
                }, {
                    "id": generic_uuid,
                    "type": "totp",
                    "name": "Entry4 TOTP16",
                    "totp_notes": "",
                    "totp_code": "MYSUPERSECRETIA",
                    "totp_digits": 6,
                    "totp_algorithm": "SHA1",
                    "totp_period": 30,
                    "totp_title": "Entry4 TOTP16"
                }, {
                    "id": generic_uuid,
                    "type": "application_password",
                    "name": "Entry4",
                    "application_password_password": "MyUnencryptedPassword",
                    "application_password_username": "username@example.com",
                    "application_password_notes": "",
                    "application_password_title": "Entry4"
                }, {
                    "id": generic_uuid,
                    "type": "website_password",
                    "name": "Entry5",
                    "urlfilter": "example.com",
                    "website_password_url_filter": "example.com",
                    "website_password_password": "MyUnencryptedPassword",
                    "website_password_username": "username@example.com",
                    "website_password_notes": "",
                    "website_password_url": "https://example.com/",
                    "website_password_title": "Entry5",
                    "website_password_totp_period": 30,
                    "website_password_totp_algorithm": "SHA1",
                    "website_password_totp_digits": 6,
                    "website_password_totp_code": "MYSUPERSECRETIA"
                }, {
                    "id": generic_uuid,
                    "type": "application_password",
                    "name": "Entry6",
                    "application_password_password": "MyUnencryptedPassword",
                    "application_password_username": "username@exmaple.com",
                    "application_password_notes": "",
                    "application_password_title": "Entry6"
                }]
            },
            "secrets": [{
                "id": generic_uuid,
                "type": "totp",
                "name": "Entry1 TOTP10",
                "totp_notes": "",
                "totp_code": "MYSUPERSECRETIA",
                "totp_digits": 6,
                "totp_algorithm": "SHA1",
                "totp_period": 30,
                "totp_title": "Entry1 TOTP10"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "Entry1",
                "application_password_password": "",
                "application_password_username": "username@example.com",
                "application_password_notes": "",
                "application_password_title": "Entry1"
            }, {
                "id": generic_uuid,
                "type": "totp",
                "name": "Entry2 TOTP11",
                "totp_notes": "Requires additional information\n\nSee this information for more details",
                "totp_code": "MUSUPERSECRETIA",
                "totp_digits": 6,
                "totp_algorithm": "SHA1",
                "totp_period": 30,
                "totp_title": "Entry2 TOTP11"
            }, {
                "id": generic_uuid,
                "type": "totp",
                "name": "Entry2 TOTP12",
                "totp_notes": "Requires additional information\n\nSee this information for more details",
                "totp_code": "",
                "totp_digits": "6",
                "totp_algorithm": "SHA1",
                "totp_period": 30,
                "totp_title": "Entry2 TOTP12"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "Entry2",
                "application_password_password": "MyUnencryptedPassword",
                "application_password_username": "username@example.com",
                "application_password_notes": "Requires additional information\n\nSee this information for more details",
                "application_password_title": "Entry2"
            }, {
                "id": generic_uuid,
                "type": "website_password",
                "name": "Entry3",
                "urlfilter": "example.com",
                "website_password_url_filter": "example.com",
                "website_password_password": "MyUnencryptedPassword",
                "website_password_username": "username@example.com",
                "website_password_notes": "",
                "website_password_url": "https://example.com",
                "website_password_title": "Entry3"
            }, {
                "id": generic_uuid,
                "type": "website_password",
                "name": "Entry3",
                "urlfilter": "www.example.com",
                "website_password_url_filter": "www.example.com",
                "website_password_password": "MyUnencryptedPassword",
                "website_password_username": "username@example.com",
                "website_password_notes": "Also used for other example account.",
                "website_password_url": "https://www.example.com",
                "website_password_title": "Entry3",
                "website_password_totp_period": 30,
                "website_password_totp_algorithm": "SHA1",
                "website_password_totp_digits": 6,
                "website_password_totp_code": "MYSUPERSECRETIA"
            }, {
                "id": generic_uuid,
                "type": "totp",
                "name": "Entry4 TOTP16",
                "totp_notes": "",
                "totp_code": "MYSUPERSECRETIA",
                "totp_digits": 6,
                "totp_algorithm": "SHA1",
                "totp_period": 30,
                "totp_title": "Entry4 TOTP16"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "Entry4",
                "application_password_password": "MyUnencryptedPassword",
                "application_password_username": "username@example.com",
                "application_password_notes": "",
                "application_password_title": "Entry4"
            }, {
                "id": generic_uuid,
                "type": "website_password",
                "name": "Entry5",
                "urlfilter": "example.com",
                "website_password_url_filter": "example.com",
                "website_password_password": "MyUnencryptedPassword",
                "website_password_username": "username@example.com",
                "website_password_notes": "",
                "website_password_url": "https://example.com/",
                "website_password_title": "Entry5",
                "website_password_totp_period": 30,
                "website_password_totp_algorithm": "SHA1",
                "website_password_totp_digits": 6,
                "website_password_totp_code": "MYSUPERSECRETIA"
            }, {
                "id": generic_uuid,
                "type": "application_password",
                "name": "Entry6",
                "application_password_password": "MyUnencryptedPassword",
                "application_password_username": "username@exmaple.com",
                "application_password_notes": "",
                "application_password_title": "Entry6"
            }]
        }

        expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
    });

});