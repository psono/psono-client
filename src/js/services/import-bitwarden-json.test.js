import React from 'react';
import importBitwardenJson from './import-bitwarden-json';
import cryptoLibrary from "./crypto-library";


describe('Service: importBitwardenJson test suite', function () {

    it('helper exists', function() {
        expect(importBitwardenJson).toBeDefined();
    });

    it('parse', function () {

        const generic_uuid = '1fce01f4-6411-47a9-885c-a80bf4c654aa'
        cryptoLibrary.generateUuid = jest.fn();
        cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

        const input = '{"folders":[{"id":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx","name":"My Folder"}],"items":[{"id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa","organizationId":null,"folderId":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx","type":2,"name":"My Secure Note","notes":"1st line of secure note\\n2nd line of secure note\\n3rd line of secure note","favorite":false,"fields":[{"name":"Text Field","value":"text-field-value","type":0},{"name":"Hidden Field","value":"hidden-field-value","type":1},{"name":"Boolean Field","value":"false","type":2}],"secureNote":{"type":0},"collectionIds":[null]},{"id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","organizationId":null,"folderId":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx","type":3,"name":"Card Name","notes":"1st line of note text\\n2nd line of note text","favorite":false,"fields":[{"name":"Text Field","value":"text-field-value","type":0},{"name":"Hidden Field","value":"hidden-field-value","type":1},{"name":"Boolean Field","value":"false","type":2}],"card":{"cardholderName":"Jane Doe","brand":"Visa","number":"1234567891011121","expMonth":"10","expYear":"2021","code":"123"},"collectionIds":[null]},{"id":"cccccccc-cccc-cccc-cccc-cccccccccccc","organizationId":null,"folderId":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx","type":4,"name":"My Identity","notes":"1st line of a note\\n2nd line of a note","favorite":false,"fields":[{"name":"Text Field","value":"text-field-value","type":0},{"name":"Hidden Field","value":"hidden-field-value","type":1},{"name":"Boolean Field","value":"true","type":2}],"identity":{"title":"Mrs","firstName":"Jane","middleName":"A","lastName":"Doe","address1":" 1 North Calle Cesar Chavez ","address2":null,"address3":null,"city":"Santa Barbara","state":"CA","postalCode":"93103","country":"United States ","company":"My Employer","email":"myemail@gmail.com","phone":"123-123-1234","ssn":"123-12-1234","username":"myusername","passportNumber":"123456789","licenseNumber":"123456789"},"collectionIds":[null]},{"id":"dddddddd-dddd-dddd-dddd-dddddddddddd","organizationId":null,"folderId":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx","type":1,"name":"Login Name","notes":"1st line of note text\\n2nd Line of note text","favorite":false,"fields":[{"name":"Text Field","value":"text-field-valie","type":0},{"name":"Hidden Field","value":"hidden-field-value","type":1},{"name":"Boolean Field","value":"true","type":2}],"login":{"uris":[{"match":null,"uri":"https://mail.google.com"}],"username":"myusername@gmail.com","password":"mypassword","totp":"otpauth://totp/ACME:AzureDiamond?issuer=ACME&secret=NB2W45DFOIZA&algorithm=SHA1&digits=6&period=30"},"collectionIds":[null]}]}';

        const output = importBitwardenJson.parser(input);

        const expected_output = {
            "datastore": {
                "id": generic_uuid, "name": output.datastore.name, "folders": [{
                    "id": generic_uuid,
                    "name": "My Folder",
                    "items": [{
                        "id": generic_uuid,
                        "type": "note",
                        "name": "My Secure Note",
                        "note_notes": "1st line of secure note\n2nd line of secure note\n3rd line of secure note\nText Field: text-field-value\nHidden Field: hidden-field-value\nBoolean Field: false\n",
                        "note_title": "My Secure Note"
                    }, {
                        "id": generic_uuid,
                        "type": "credit_card",
                        "name": "Card Name",
                        "description": "xxxxxxxxxxxx1121",
                        "credit_card_number": "1234567891011121",
                        "credit_card_name": "Jane Doe",
                        "credit_card_cvc": "123",
                        "credit_card_valid_through": "1021",
                        "credit_card_pin": "",
                        "credit_card_notes": "1st line of note text\n2nd line of note textText Field: text-field-value\nHidden Field: hidden-field-value\nBoolean Field: false\n",
                        "credit_card_title": "Card Name"
                    }, {
                        "id": generic_uuid,
                        "type": "note",
                        "name": "My Identity",
                        "note_notes": "1st line of a note\n2nd line of a note\nText Field: text-field-value\nHidden Field: hidden-field-value\nBoolean Field: true\nTitle: Mrs\nFirstname: Jane\nMiddlename: A\nLastname: Doe\nAddress1:  1 North Calle Cesar Chavez \nCity: Santa Barbara\nState: CA\nPostal Code: 93103\nCountry: United States \nCompany: My Employer\nEmail: myemail@gmail.com\nPhone: 123-123-1234\nSSN: 123-12-1234\nUsername: myusername\nPassport Number: 123456789\nLicense Number: 123456789\n",
                        "note_title": "My Identity"
                    }, {
                        "id": generic_uuid,
                        "type": "website_password",
                        "name": "Login Name",
                        "description": "myusername@gmail.com",
                        "urlfilter": "mail.google.com",
                        "website_password_url_filter": "mail.google.com",
                        "website_password_password": "mypassword",
                        "website_password_username": "myusername@gmail.com",
                        "website_password_notes": "1st line of note text\n2nd Line of note textText Field: text-field-valie\nHidden Field: hidden-field-value\nBoolean Field: true\n",
                        "website_password_url": "https://mail.google.com",
                        "website_password_title": "Login Name"
                    }, {
                        "id": generic_uuid,
                        "type": "totp",
                        "name": "Login Name TOTP",
                        "totp_notes": "",
                        "totp_code": "NB2W45DFOIZA",
                        "totp_digits": 6,
                        "totp_algorithm": "SHA1",
                        "totp_period": 30,
                        "totp_title": "Login Name TOTP"
                    }]
                }], "items": []
            },
            "secrets": [{
                "id": generic_uuid,
                "type": "note",
                "name": "My Secure Note",
                "note_notes": "1st line of secure note\n2nd line of secure note\n3rd line of secure note\nText Field: text-field-value\nHidden Field: hidden-field-value\nBoolean Field: false\n",
                "note_title": "My Secure Note"
            }, {
                "id": generic_uuid,
                "type": "credit_card",
                "name": "Card Name",
                "description": "xxxxxxxxxxxx1121",
                "credit_card_number": "1234567891011121",
                "credit_card_name": "Jane Doe",
                "credit_card_cvc": "123",
                "credit_card_valid_through": "1021",
                "credit_card_pin": "",
                "credit_card_notes": "1st line of note text\n2nd line of note textText Field: text-field-value\nHidden Field: hidden-field-value\nBoolean Field: false\n",
                "credit_card_title": "Card Name"
            }, {
                "id": generic_uuid,
                "type": "note",
                "name": "My Identity",
                "note_notes": "1st line of a note\n2nd line of a note\nText Field: text-field-value\nHidden Field: hidden-field-value\nBoolean Field: true\nTitle: Mrs\nFirstname: Jane\nMiddlename: A\nLastname: Doe\nAddress1:  1 North Calle Cesar Chavez \nCity: Santa Barbara\nState: CA\nPostal Code: 93103\nCountry: United States \nCompany: My Employer\nEmail: myemail@gmail.com\nPhone: 123-123-1234\nSSN: 123-12-1234\nUsername: myusername\nPassport Number: 123456789\nLicense Number: 123456789\n",
                "note_title": "My Identity"
            }, {
                "id": generic_uuid,
                "type": "website_password",
                "name": "Login Name",
                "description": "myusername@gmail.com",
                "urlfilter": "mail.google.com",
                "website_password_url_filter": "mail.google.com",
                "website_password_password": "mypassword",
                "website_password_username": "myusername@gmail.com",
                "website_password_notes": "1st line of note text\n2nd Line of note textText Field: text-field-valie\nHidden Field: hidden-field-value\nBoolean Field: true\n",
                "website_password_url": "https://mail.google.com",
                "website_password_title": "Login Name"
            }, {
                "id": generic_uuid,
                "type": "totp",
                "name": "Login Name TOTP",
                "totp_notes": "",
                "totp_code": "NB2W45DFOIZA",
                "totp_digits": 6,
                "totp_algorithm": "SHA1",
                "totp_period": 30,
                "totp_title": "Login Name TOTP"
            }]
        }

        expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
    });

});